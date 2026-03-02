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
  const [messageApi, contextHolder] = message.useMessage();

  const defaultValues = {
    name: "",
    code: "",
    color: "#ff0000",
    isDefault: false,
  };

  const dbColors = Array.from(
    new Set(statuses.map((s) => s.color).filter(Boolean)),
  );

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await orderDetailStatusService.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error("Failed to fetch order detail statuses:", error);
      messageApi.error(t("dashboard.manage.errors.fetch_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

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
      messageApi.success(t("dashboard.manage.notifications.delete_success"));
      fetchStatuses();
    } catch (error: any) {
      console.error("Failed to delete order detail status:", error);
      messageApi.error(
        error?.response?.data?.message ||
          t("dashboard.manage.errors.delete_failed"),
      );
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const colorValue =
        typeof values.color === "string"
          ? values.color
          : (values.color?.toHexString?.() ?? values.color);

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
        messageApi.success(t("dashboard.manage.notifications.update_success"));
      } else {
        await orderDetailStatusService.createStatus(statusData);
        messageApi.success(t("dashboard.manage.notifications.create_success"));
      }

      setModalVisible(false);
      fetchStatuses();
    } catch (error: any) {
      if (error?.response) {
        messageApi.error(
          error?.response?.data?.message ||
            t("dashboard.manage.errors.save_failed"),
        );
      }
      console.error("Failed to save order detail status:", error);
    }
  };

  const handleSetDefault = async (record: OrderDetailStatus) => {
    if (record.isDefault) return;

    try {
      await orderDetailStatusService.setAsDefault(record);
      messageApi.success(t("dashboard.manage.notifications.update_success"));
      fetchStatuses();
    } catch (error) {
      console.error("Failed to update default status:", error);
      messageApi.error(t("dashboard.manage.errors.update_failed"));
    }
  };

  const columns: ColumnsType<OrderDetailStatus> = [
    {
      title: t("dashboard.manage.order_status.table.name"),
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
      title: t("dashboard.manage.order_status.table.code"),
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
      title: t("dashboard.manage.order_status.table.default"),
      key: "isDefault",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Tooltip
          title={
            record.isDefault
              ? t("dashboard.manage.order_status.tooltip.current_default")
              : t("dashboard.manage.order_status.tooltip.set_default")
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
      title: t("dashboard.manage.order_status.table.actions"),
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
            title={t("dashboard.manage.confirm_delete")}
            onConfirm={() => handleDelete(record.id)}
            okText={t("common.yes")}
            cancelText={t("common.no")}
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
      {contextHolder}
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

        .modern-modal .ant-color-picker {
          width: 100% !important;
        }
        .modern-modal .ant-color-picker-trigger {
          width: 100% !important;
          background: var(--input-bg, var(--card)) !important;
          border: 1px solid var(--border) !important;
          height: 44px !important;
          padding: 0 16px !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
        }
        .modern-modal .ant-color-picker-trigger .ant-color-picker-color-block {
          width: 24px !important;
          height: 24px !important;
          border-radius: 6px !important;
        }
        .modern-modal .ant-color-picker-trigger .ant-color-picker-trigger-text {
          color: var(--text) !important;
          margin-left: 12px !important;
        }

        /* Input fields styling */
        .modern-modal .ant-input {
          background: var(--input-bg, var(--card)) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        .modern-modal .ant-input::placeholder {
          color: var(--text-muted) !important;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] bg-clip-text text-transparent">
            {t("dashboard.manage.order_status.title")}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.manage.order_status.subtitle")}
          </p>
        </div>
        <Button
          type="primary"
          onClick={handleAdd}
          icon={<PlusOutlined />}
          size="large"
          className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-none hover:shadow-lg hover:scale-105 active:scale-95 transition-all rounded-xl h-11 px-6 font-medium">
          {t("dashboard.manage.order_status.add_status")}
        </Button>
      </div>

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
                  style={{ backgroundColor: "var(--surface-subtle)" }}>
                  <StarOutlined className="text-3xl opacity-50" />
                </div>
                <p className="text-lg font-medium">
                  {t("dashboard.manage.order_status.name")}
                </p>
                <p className="text-sm opacity-60">
                  {t("dashboard.manage.order_status.empty_state_desc")}
                </p>
              </div>
            ),
          }}
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white shadow-lg">
              {editingStatus ? (
                <EditOutlined className="text-lg" />
              ) : (
                <PlusOutlined className="text-lg" />
              )}
            </div>
            <div>
              <span
                className="text-lg font-bold block leading-tight"
                style={{ color: "var(--text)" }}>
                {editingStatus
                  ? t("dashboard.manage.order_status.edit_status")
                  : t("dashboard.manage.order_status.add_status")}
              </span>
              <span
                className="text-sm font-normal block"
                style={{ color: "var(--text-muted)" }}>
                {editingStatus
                  ? t("dashboard.manage.order_status.modal_subtitle_edit")
                  : t("dashboard.manage.order_status.modal_subtitle_create")}
              </span>
            </div>
          </div>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        okButtonProps={{
          className:
            "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-none text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all",
          size: "large",
          shape: "round",
        }}
        cancelButtonProps={{
          size: "large",
          shape: "round",
          style: {
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          },
        }}
        className="modern-modal"
        width={500}
        centered
        forceRender>
        <Form
          form={form}
          layout="vertical"
          className="mt-2"
          initialValues={defaultValues}
          requiredMark={false}>
          <Form.Item
            name="name"
            label={
              <span className="font-medium" style={{ color: "var(--text)" }}>
                {t("dashboard.manage.order_status.name")}
              </span>
            }
            rules={[
              {
                required: true,
                message: t("dashboard.manage.order_status.name_required"),
              },
            ]}>
            <Input
              placeholder={t("dashboard.manage.order_status.name_placeholder")}
              size="large"
              className="rounded-xl px-4 py-2.5"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label={
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {t("dashboard.manage.order_status.code")}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: t("dashboard.manage.order_status.code_required"),
                },
                {
                  pattern: /^[A-Z_]+$/,
                  message: t("dashboard.manage.order_status.code_format"),
                },
              ]}>
              <Input
                placeholder={t(
                  "dashboard.manage.order_status.code_placeholder",
                )}
                size="large"
                className="font-mono rounded-xl uppercase px-4 py-2.5"
                prefix={
                  <span
                    className="font-bold mr-1"
                    style={{ color: "var(--text-muted)" }}>
                    #
                  </span>
                }
              />
            </Form.Item>

            <Form.Item
              name="color"
              label={
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {t("dashboard.manage.order_status.color")}
                </span>
              }
              rules={[
                {
                  required: true,
                  message: t("dashboard.manage.order_status.color_required"),
                },
              ]}>
              <ColorPicker
                showText
                size="large"
                format="hex"
                presets={
                  dbColors.length > 0
                    ? [
                        {
                          label: t(
                            "dashboard.manage.order_status.color_from_db",
                          ),
                          colors: dbColors,
                        },
                      ]
                    : []
                }
                className="w-full justify-start rounded-xl"
              />
            </Form.Item>
          </div>

          <div
            className="p-4 rounded-xl space-y-4 border"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}>
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
                  <span
                    className="font-medium transition-colors"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.order_status.is_default")}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.manage.order_status.is_default_desc")}
                  </span>
                </div>
                <Switch checked={form.getFieldValue("isDefault")} />
              </div>
            </Form.Item>

            {(form.getFieldValue("isDefault") || editingStatus?.isDefault) && (
              <div
                className="text-sm flex items-center gap-2 p-2 rounded-lg"
                style={{
                  color: "var(--warning)",
                  background: "var(--warning-soft)",
                  border: "1px solid var(--warning-border)",
                }}>
                <StarFilled />
                {t("dashboard.manage.order_status.default_note")}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
