"use client";

import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import StatusToggle from "@/components/ui/StatusToggle";
import loyaltyService, {
    LoyaltyPointBand,
    TIER_COLORS,
} from "@/lib/services/loyaltyService";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
    Button,
    ColorPicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Table,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LoyaltyPointBandSettings() {
  const { t } = useTranslation("common");
  const [bands, setBands] = useState<LoyaltyPointBand[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBand, setEditingBand] = useState<LoyaltyPointBand | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Default values for new bands
  const defaultValues = {
    isActive: true,
    min: 0,
    discountPercentage: 0,
    logoColor: TIER_COLORS.bronze,
    name: "",
    benefitDescription: "",
  };

  const fetchBands = async () => {
    setLoading(true);
    try {
      const data = await loyaltyService.getAllBands();
      setBands(data);
    } catch (error) {
      console.error("Failed to fetch loyalty point bands:", error);
      messageApi.error(
        t("dashboard.manage.errors.fetch_failed", {
          defaultValue: "Failed to fetch loyalty point bands",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // Prepare form when modal opens
  useEffect(() => {
    if (modalVisible) {
      if (editingBand) {
        form.setFieldsValue(editingBand);
      } else {
        form.resetFields();
        form.setFieldsValue(defaultValues);
      }
    }
  }, [modalVisible, editingBand, form]);

  useEffect(() => {
    fetchBands();
  }, []);

  const handleAdd = () => {
    setEditingBand(null);
    setModalVisible(true);
  };

  const handleEdit = (band: LoyaltyPointBand) => {
    setEditingBand(band);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await loyaltyService.deleteBand(id);
      messageApi.success(
        t("dashboard.manage.notifications.delete_success", {
          defaultValue: "Deleted successfully",
        }),
      );
      fetchBands();
    } catch (error) {
      console.error("Failed to delete loyalty point band:", error);
      messageApi.error(
        t("dashboard.manage.errors.delete_failed", {
          defaultValue: "Failed to delete",
        }),
      );
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingBand) {
        await loyaltyService.updateBand(editingBand.id, {
          ...values,
          id: editingBand.id,
        });
        messageApi.success(
          t("dashboard.manage.notifications.update_success", {
            defaultValue: "Updated successfully",
          }),
        );
      } else {
        await loyaltyService.createBand(values);
        messageApi.success(
          t("dashboard.manage.notifications.create_success", {
            defaultValue: "Created successfully",
          }),
        );
      }

      setModalVisible(false);
      fetchBands();
    } catch (error: any) {
      console.error("Failed to save loyalty point band:", error);
      messageApi.error(
        error?.message ||
          t("dashboard.manage.errors.save_failed", {
            defaultValue: "Failed to save loyalty point band",
          }),
      );
    }
  };

  const handleToggleStatus = async (record: LoyaltyPointBand) => {
    try {
      const updatedBand = { ...record, isActive: !record.isActive };
      await loyaltyService.updateBand(record.id, updatedBand);
      messageApi.success(
        t("dashboard.manage.notifications.update_success", {
          defaultValue: "Updated successfully",
        }),
      );
      fetchBands();
    } catch (error) {
      console.error("Failed to update status:", error);
      messageApi.error(
        t("dashboard.manage.errors.update_failed", {
          defaultValue: "Failed to update status",
        }),
      );
    }
  };

  /** Returns the hex color for a tier name — now uses the centralized TIER_COLORS map */
  const getVipTierColor = (tierOrColor: string): string => {
    // If it looks like a hex color already (from BE logoColor), return as-is
    if (tierOrColor?.startsWith('#')) return tierOrColor;
    return TIER_COLORS[tierOrColor?.toLowerCase()] ?? '#6B7280';
  };

  const columns = [
    {
      title: t("dashboard.manage.loyalty.form.logo", { defaultValue: "Rank" }),
      key: "icon",
      width: 100,
      align: "center" as const,
      render: (_: any, record: LoyaltyPointBand) => {
        const color = record.logoColor || getVipTierColor(record.name);
        return (
          <div className="flex items-center justify-center">
            <LoyaltyBandIcon color={color} size={24} />
          </div>
        );
      },
    },
    {
      title: t("dashboard.manage.loyalty.name", { defaultValue: "Band Name" }),
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: t("dashboard.manage.loyalty.range", {
        defaultValue: "Points Range",
      }),
      key: "range",
      render: (_: any, record: LoyaltyPointBand) => (
        <span>
          {record.min} - {record.max !== null ? record.max : "∞"}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.loyalty.discount", {
        defaultValue: "Discount",
      }),
      dataIndex: "discountPercentage",
      key: "discountPercentage",
      render: (val: number) => <span>{val}%</span>,
    },
    {
      title: t("dashboard.manage.loyalty.benefits", {
        defaultValue: "Benefits",
      }),
      dataIndex: "benefitDescription",
      key: "benefitDescription",
      ellipsis: true,
    },
    {
      title: t("dashboard.manage.loyalty.status", { defaultValue: "Status" }),
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: LoyaltyPointBand) => (
        <StatusToggle
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          ariaLabel={
            isActive
              ? t("common.status.deactivate", { defaultValue: "Deactivate" })
              : t("common.status.activate", { defaultValue: "Activate" })
          }
        />
      ),
    },
    {
      title: t("common.actions.title", { defaultValue: "Actions" }),
      key: "actions",
      width: 120,
      render: (_: any, record: LoyaltyPointBand) => (
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="text"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          />
          <Popconfirm
            title={t("common.confirm.delete_title", {
              defaultValue: "Are you sure?",
            })}
            description={t("common.confirm.delete_msg", {
              defaultValue: "This action cannot be undone.",
            })}
            onConfirm={() => handleDelete(record.id)}
            okText={t("common.actions.yes", { defaultValue: "Yes" })}
            cancelText={t("common.actions.no", { defaultValue: "No" })}>
            <Button
              icon={<DeleteOutlined />}
              type="text"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      {contextHolder}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {t("dashboard.manage.loyalty.title", {
              defaultValue: "Loyalty Point Bands",
            })}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t("dashboard.manage.loyalty.desc", {
              defaultValue: "Manage loyalty tiers and benefits",
            })}
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            background:
              "linear-gradient(to right, var(--primary), var(--primary-hover))",
            border: "none",
          }}>
          {t("dashboard.manage.loyalty.add_new", {
            defaultValue: "Add New Band",
          })}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={bands}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="admin-loyalty-table"
      />

      <Modal
        title={
          editingBand
            ? t("dashboard.manage.loyalty.edit", {
              defaultValue: "Edit Loyalty Band",
            })
            : t("dashboard.manage.loyalty.create", {
              defaultValue: "Create Loyalty Band",
            })
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okButtonProps={{
          style: {
            background: "var(--primary)",
            borderColor: "var(--primary)",
          },
        }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t("dashboard.manage.loyalty.form.name", {
              defaultValue: "Band Name",
            })}
            rules={[
              {
                required: true,
                message: t("common.validation.required", {
                  defaultValue: "This field is required",
                }),
              },
            ]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="logoColor"
            label={t("dashboard.manage.loyalty.form.logo", {
              defaultValue: "Rank Color",
            })}
            rules={[
              {
                required: true,
                message: t("dashboard.manage.loyalty.form.logo_required", {
                  defaultValue: "Please choose a color",
                }),
              },
            ]}
            getValueFromEvent={(value) => value?.toHexString?.() ?? value}>
            <ColorPicker
              showText
              size="large"
              format="hex"
              presets={[
                {
                  label: t("dashboard.manage.loyalty.badges.default", { defaultValue: "Default badges" }),
                  colors: Object.values(TIER_COLORS),
                },
              ]}
              className="w-full justify-start rounded-xl"
            />
          </Form.Item>

          <Form.Item
            label={t("dashboard.manage.loyalty.form.range", {
              defaultValue: "Points Range",
            })}
            required
            style={{ marginBottom: 0 }}>
            <div className="flex gap-4">
              <Form.Item
                name="min"
                rules={[{ required: true }]}
                style={{ flex: 1 }}>
                <InputNumber
                  min={0}

                  style={{ width: "100%" }}
                />
              </Form.Item>
              <span className="leading-[32px]">-</span>
              <Form.Item
                name="max"
                style={{ flex: 1 }}
                tooltip={t("dashboard.manage.loyalty.form.max_tooltip", {
                  defaultValue: "Leave empty for infinite range",
                })}>
                <InputNumber
                  min={0}

                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            name="discountPercentage"
            label={t("dashboard.manage.loyalty.form.discount", {
              defaultValue: "Discount Percentage (%)",
            })}
            rules={[{ required: true }]}>
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              parser={(value) => value?.replace("%", "") as unknown as number}
              formatter={(value) => `${value}%`}
            />
          </Form.Item>

          <Form.Item
            name="benefitDescription"
            label={t("dashboard.manage.loyalty.form.benefits", {
              defaultValue: "Benefits Description",
            })}
            rules={[{ required: true }]}>
            <Input.TextArea
              rows={3}

            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={t("common.status.label", { defaultValue: "Status" })}
            valuePropName="checked"
            getValueFromEvent={(checked: boolean) => checked}>
            <StatusToggle
              checked={form.getFieldValue("isActive") ?? true}
              onChange={(checked) => form.setFieldValue("isActive", checked)}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const selectedColor = getFieldValue("logoColor") || TIER_COLORS.bronze;
              const selectedName = getFieldValue("name") || t("dashboard.manage.loyalty.preview.default_name", { defaultValue: "New Rank" });
              return (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {t("dashboard.manage.loyalty.preview.title", { defaultValue: "Badge preview" })}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ border: `1px solid ${selectedColor}55`, background: `${selectedColor}1A` }}>
                    <LoyaltyBandIcon color={selectedColor} size={18} />
                    <span className="text-sm font-semibold" style={{ color: selectedColor }}>{selectedName}</span>
                  </div>
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
