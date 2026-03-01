"use client";

import orderDetailStatusService, {
  OrderDetailStatus,
} from "@/lib/services/orderDetailStatusService";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  Button,
  ColorPicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function OrderDetailStatusSettings() {
  const { t } = useTranslation("common");
  const [statuses, setStatuses] = useState<OrderDetailStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderDetailStatus | null>(
    null,
  );
  const [form] = Form.useForm();

  // Default values for new status
  const defaultValues = {
    name: "",
    code: "",
    color: "",
    isDefault: false,
  };

  const dbColors = Array.from(
    new Set(statuses.map((s) => s.color).filter(Boolean))
  );

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await orderDetailStatusService.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error("Failed to fetch order detail statuses:", error);
      message.error(
        t("dashboard.manage.errors.fetch_failed", {
          defaultValue: "Failed to fetch order detail statuses",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // Prepare form when modal opens
  useEffect(() => {
    if (modalVisible) {
      if (editingStatus) {
        form.setFieldsValue(editingStatus);
      } else {
        form.resetFields();
        form.setFieldsValue(defaultValues);
      }
    }
  }, [modalVisible, editingStatus, form]);

  const handleAdd = () => {
    setEditingStatus(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (status: OrderDetailStatus) => {
    setEditingStatus(status);
    setModalVisible(true);
    form.setFieldsValue(status);
  };

  const handleDelete = async (id: string) => {
    try {
      await orderDetailStatusService.deleteStatus(id);
      message.success(
        t("dashboard.manage.notifications.delete_success", {
          defaultValue: "Deleted successfully",
        }),
      );
      fetchStatuses();
    } catch (error: any) {
      console.error("Failed to delete order detail status:", error);
      message.error(
        error?.response?.data?.message ||
        t("dashboard.manage.errors.delete_failed", {
          defaultValue: "Failed to delete",
        }),
      );
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Convert color to hex string if it's a Color object
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() ?? values.color;

      const statusData = {
        name: values.name,
        code: values.code,
        color: colorValue,
        isDefault: values.isDefault ?? false,
      };

      if (editingStatus) {
        await orderDetailStatusService.updateStatus(editingStatus.id, {
          ...statusData,
          id: editingStatus.id,
        });
        message.success(
          t("dashboard.manage.notifications.update_success", {
            defaultValue: "Updated successfully",
          }),
        );
      } else {
        await orderDetailStatusService.createStatus(statusData);
        message.success(
          t("dashboard.manage.notifications.create_success", {
            defaultValue: "Created successfully",
          }),
        );
      }

      setModalVisible(false);
      fetchStatuses();
    } catch (error: any) {
      if (error?.response) {
        message.error(
          error?.response?.data?.message ||
          t("dashboard.manage.errors.save_failed", { defaultValue: "Failed to save" })
        );
      }
      console.error("Failed to save order detail status:", error);
    }
  };

  const handleSetDefault = async (record: OrderDetailStatus) => {
    if (record.isDefault) return; // Already default

    try {
      await orderDetailStatusService.setAsDefault(record.id);
      message.success(
        t("dashboard.manage.notifications.update_success", {
          defaultValue: "Updated successfully",
        }),
      );
      fetchStatuses();
    } catch (error) {
      console.error("Failed to update default status:", error);
      message.error(
        t("dashboard.manage.errors.update_failed", {
          defaultValue: "Failed to update default status",
        }),
      );
    }
  };

  const columns: ColumnsType<OrderDetailStatus> = [
    {
      title: t("dashboard.manage.order_status.table.name", {
        defaultValue: "Status Name",
      }),
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center border transition-colors"
            style={{
              backgroundColor: record.color,
              borderColor: "var(--border)",
            }}></div>
          <div>
            <span
              className="font-semibold block"
              style={{ color: "var(--text)" }}>
              {text}
            </span>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}>
              {record.color}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t("dashboard.manage.order_status.table.code", {
        defaultValue: "Code",
      }),
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <Tag
          className="font-mono px-3 py-1.5 rounded-lg font-bold uppercase shadow-sm border-0"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}>
          #{text}
        </Tag>
      ),
    },
    {
      title: t("dashboard.manage.order_status.table.default", {
        defaultValue: "Default",
      }),
      key: "isDefault",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Tooltip
          title={
            record.isDefault
              ? t("dashboard.manage.order_status.tooltip.current_default", {
                  defaultValue: "Mặc định hiện tại",
                })
              : t("dashboard.manage.order_status.tooltip.set_default", {
                  defaultValue: "Đặt làm mặc định",
                })
          }>
          <Button
            type="text"
            shape="circle"
            onClick={() => handleSetDefault(record)}
            icon={
              record.isDefault ? (
                <StarFilled className="text-yellow-400 text-lg" />
              ) : (
                <StarOutlined className="text-gray-400 hover:text-yellow-400 text-lg transition-colors" />
              )
            }
            disabled={record.isDefault}
          />
        </Tooltip>
      ),
    },

    {
      title: t("dashboard.manage.order_status.table.actions", {
        defaultValue: "Actions",
      }),
      key: "actions",
      align: "right",
      width: 150,
      render: (_, record) => (
        <div className="flex justify-end gap-2">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          />
          <Popconfirm
            title={t("dashboard.manage.confirm_delete", {
              defaultValue: "Are you sure?",
            })}
            onConfirm={() => handleDelete(record.id)}
            okText={t("common.yes", { defaultValue: "Yes" })}
            cancelText={t("common.no", { defaultValue: "No" })}
            okButtonProps={{ danger: true }}>
            <Button
              type="text"
              icon={<DeleteOutlined className="text-red-500" />}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              style={{ color: "var(--primary)" }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <style jsx global>{`
        .modern-table .ant-table {
          background: transparent;
        }
        .modern-table .ant-table-container {
          background: var(--card);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .modern-table .ant-table-thead > tr > th {
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--border) !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border) !important;
          color: var(--text);
        }
        .modern-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-hover) !important;
        }

        .modern-modal .ant-modal-content {
          border-radius: 24px !important;
          overflow: hidden;
          background: var(--card);
          padding: 0 !important;
        }
        .modern-modal .ant-modal-header {
          background: transparent;
          border-bottom: 1px solid var(--border);
          padding: 20px 24px !important;
          margin-bottom: 0 !important;
        }
        .modern-modal .ant-modal-body {
          padding: 24px !important;
        }
        .modern-modal .ant-modal-footer {
          margin-top: 0 !important;
          padding: 16px 24px !important;
          border-top: 1px solid var(--border);
        }
        .modern-modal .ant-modal-title {
          color: var(--text);
        }
        .modern-modal .ant-modal-close {
          color: var(--text-muted);
          top: 24px !important;
        }

        /* Dark mode specific fine-tuning if needed, relying on var variables usually handles it */
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] bg-clip-text text-transparent">
            {t("dashboard.manage.order_status.title", {
              defaultValue: "Order Detail Status Management",
            })}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.manage.order_status.subtitle", {
              defaultValue: "Manage order detail statuses, codes, and colors",
            })}
          </p>
        </div>
        <Button
          type="primary"
          onClick={handleAdd}
          icon={<PlusOutlined />}
          size="large"
          className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-none hover:shadow-lg hover:scale-105 active:scale-95 transition-all rounded-xl h-11 px-6 font-medium">
          {t("dashboard.manage.order_status.add_status", {
            defaultValue: "Add Status",
          })}
        </Button>
      </div>

      {/* Table Section */}
      <div className="modern-table">
        <Table
          columns={columns}
          dataSource={statuses}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            placement: ["bottomCenter"],
          }}
          locale={{
            emptyText: (
              <div
                className="py-12 text-center"
                style={{ color: "var(--text-muted)" }}>
                <div
                  className="mb-4 w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: "var(--bg-hover)" }}>
                  <StarOutlined className="text-3xl opacity-50" />
                </div>
                <p className="text-lg font-medium">
                  {t("dashboard.manage.menu.no_items", {
                    defaultValue: "No items found",
                  })}
                </p>
                <p className="text-sm opacity-60">
                  {t("dashboard.manage.order_status.empty_state_desc", {
                    defaultValue: "Tạo trạng thái mới để bắt đầu",
                  })}
                </p>
              </div>
            ),
          }}
        />
      </div>

      {/* Modal Form */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white shadow-lg`}>
              {editingStatus ? (
                <EditOutlined className="text-lg" />
              ) : (
                <PlusOutlined className="text-lg" />
              )}
            </div>
            <div>
              <span className="text-lg font-bold block leading-tight">
                {editingStatus
                  ? t("dashboard.manage.order_status.edit_status", {
                      defaultValue: "Edit Order Detail Status",
                    })
                  : t("dashboard.manage.order_status.add_status", {
                      defaultValue: "Add Order Detail Status",
                    })}
              </span>
              <span className="text-xs font-normal opacity-60">
                {editingStatus
                  ? t("dashboard.manage.order_status.modal_subtitle_edit", {
                      defaultValue: "Cập nhật thông tin trạng thái",
                    })
                  : t("dashboard.manage.order_status.modal_subtitle_create", {
                      defaultValue: "Tạo mới trạng thái",
                    })}
              </span>
            </div>
          </div>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText={t("common.save", { defaultValue: "Save" })}
        cancelText={t("common.cancel", { defaultValue: "Cancel" })}
        okButtonProps={{
          className:
            "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-none text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all",
          size: "large",
          shape: "round",
        }}
        cancelButtonProps={{
          size: "large",
          shape: "round",
          className:
            "hover:bg-gray-100 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-700",
        }}
        className="modern-modal"
        width={500}
        centered>
        <Form
          form={form}
          layout="vertical"
          className="mt-2"
          initialValues={defaultValues}
          requiredMark={false}>
          <Form.Item
            name="name"
            label={
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.manage.order_status.name", {
                  defaultValue: "Name",
                })}
              </span>
            }
            rules={[
              {
                required: true,
                message: t("dashboard.manage.order_status.name_required", {
                  defaultValue: "Please enter status name",
                }),
              },
            ]}>
            <Input
              placeholder={t("dashboard.manage.order_status.name_placeholder", {
                defaultValue: "Enter status name",
              })}
              size="large"
              className="rounded-xl px-4 py-2.5"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label={
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("dashboard.manage.order_status.code", {
                    defaultValue: "Code",
                  })}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: t("dashboard.manage.order_status.code_required", {
                    defaultValue: "Please enter status code",
                  }),
                },
                {
                  pattern: /^[A-Z_]+$/,
                  message: t("dashboard.manage.order_status.code_format", {
                    defaultValue:
                      "Code must be uppercase letters and underscores only",
                  }),
                },
              ]}>
              <Input
                placeholder={t(
                  "dashboard.manage.order_status.code_placeholder",
                  { defaultValue: "e.g., PENDING" },
                )}
                size="large"
                className="font-mono rounded-xl uppercase px-4 py-2.5"
                prefix={<span className="text-gray-400 font-bold mr-1">#</span>}
              />
            </Form.Item>

            <Form.Item
              name="color"
              label={
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("dashboard.manage.order_status.color", {
                    defaultValue: "Color",
                  })}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: t("dashboard.manage.order_status.color_required", {
                    defaultValue: "Please select a color",
                  }),
                },
              ]}>
              <ColorPicker
                showText
                size="large"
                format="hex"
                presets={
                  dbColors.length > 0
                    ? [{ label: t("dashboard.manage.order_status.color_from_db", { defaultValue: "Màu hiện có" }), colors: dbColors }]
                    : []
                }
                className="w-full justify-start rounded-xl"
              />
            </Form.Item>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-zinc-800">
            <Form.Item name="isDefault" valuePropName="checked" noStyle>
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() =>
                  form.setFieldValue(
                    "isDefault",
                    !form.getFieldValue("isDefault"),
                  )
                }>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                    {t("dashboard.manage.order_status.is_default", {
                      defaultValue: "Set as Default",
                    })}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("dashboard.manage.order_status.is_default_desc", {
                      defaultValue: "Đặt làm trạng thái mặc định cho đơn mới",
                    })}
                  </span>
                </div>
                <Switch checked={form.getFieldValue("isDefault")} />
              </div>
            </Form.Item>

            {(form.getFieldValue("isDefault") || editingStatus?.isDefault) && (
              <div className="text-xs text-amber-500 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                <StarFilled />
                {t("dashboard.manage.order_status.default_note", {
                  defaultValue:
                    "Only one status can be set as default. This will replace the current default.",
                })}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
