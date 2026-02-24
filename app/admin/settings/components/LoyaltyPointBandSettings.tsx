"use client";

import loyaltyService, {
  LoyaltyPointBand,
  TIER_COLORS,
  getTierFromColor,
} from "@/lib/services/loyaltyService";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Diamond,
  EmojiEvents,
  Star,
  WorkspacePremium,
} from "@mui/icons-material";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Radio,
  Table,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const StatusToggle = ({ value, onChange, t }: any) => (
  <div className="flex items-center gap-3">
    <div
      onClick={() => onChange?.(!value)}
      className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${value ? "bg-[var(--primary)]" : "bg-gray-200 dark:bg-zinc-700"
        }`}
      role="switch"
      aria-checked={value}>
      <span
        className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${value ? "translate-x-6" : "translate-x-0"
          }`}
      />
    </div>
    <span
      className={`font-medium text-sm ${value ? "text-[var(--primary)]" : "text-gray-500"
        }`}>
      {value
        ? t("common.status.active", { defaultValue: "Active" })
        : t("common.status.inactive", { defaultValue: "Inactive" })}
    </span>
  </div>
);

export default function LoyaltyPointBandSettings() {
  const { t } = useTranslation("common");
  const [bands, setBands] = useState<LoyaltyPointBand[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBand, setEditingBand] = useState<LoyaltyPointBand | null>(null);
  const [form] = Form.useForm();

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
      message.error(
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
      message.success(
        t("dashboard.manage.notifications.delete_success", {
          defaultValue: "Deleted successfully",
        }),
      );
      fetchBands();
    } catch (error) {
      console.error("Failed to delete loyalty point band:", error);
      message.error(
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
        message.success(
          t("dashboard.manage.notifications.update_success", {
            defaultValue: "Updated successfully",
          }),
        );
      } else {
        await loyaltyService.createBand(values);
        message.success(
          t("dashboard.manage.notifications.create_success", {
            defaultValue: "Created successfully",
          }),
        );
      }

      setModalVisible(false);
      fetchBands();
    } catch (error) {
      console.error("Failed to save loyalty point band:", error);
    }
  };

  const handleToggleStatus = async (record: LoyaltyPointBand) => {
    try {
      const updatedBand = { ...record, isActive: !record.isActive };
      await loyaltyService.updateBand(record.id, updatedBand);
      message.success(
        t("dashboard.manage.notifications.update_success", {
          defaultValue: "Updated successfully",
        }),
      );
      fetchBands();
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error(
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
        const tier = getTierFromColor(color);
        return (
          <div className="flex items-center justify-center">
            {tier === "platinum" || tier === "diamond" ? (
              <Diamond sx={{ fontSize: 24, color }} />
            ) : tier === "gold" ? (
              <EmojiEvents sx={{ fontSize: 24, color }} />
            ) : tier === "silver" ? (
              <Star sx={{ fontSize: 24, color }} />
            ) : (
              <WorkspacePremium sx={{ fontSize: 24, color }} />
            )}
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
        <button
          onClick={() => handleToggleStatus(record)}
          className={`cursor-pointer inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all hover:opacity-80 ${isActive
            ? "bg-green-500 text-white dark:bg-green-600"
            : "bg-gray-500 text-white dark:bg-gray-600"
            }`}>
          <span className="w-1.5 h-1.5 rounded-full mr-2 bg-white"></span>
          {isActive
            ? t("common.status.active", { defaultValue: "Active" })
            : t("common.status.inactive", { defaultValue: "Inactive" })}
        </button>
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
            name="logoColor"
            label={t("dashboard.manage.loyalty.form.logo", {
              defaultValue: "Rank Icon",
            })}
            rules={[{ required: true }]}>
            <Radio.Group className="w-full">
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(TIER_COLORS).map(([tier, color]) => (
                  <Radio.Button
                    key={tier}
                    value={color}
                    className="flex flex-col items-center justify-center h-20 !p-1"
                    style={{ height: "auto", padding: "10px" }}>
                    <div className="flex flex-col items-center gap-1">
                      {tier === "platinum" || tier === "diamond" ? (
                        <Diamond sx={{ color }} />
                      ) : tier === "gold" ? (
                        <EmojiEvents sx={{ color }} />
                      ) : tier === "silver" ? (
                        <Star sx={{ color }} />
                      ) : (
                        <WorkspacePremium sx={{ color }} />
                      )}
                      <span className="text-xs capitalize">
                        {t(`dashboard.manage.loyalty.badges.${tier}`, { defaultValue: tier })}
                      </span>
                    </div>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>

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
            <Input placeholder="e.g. Silver, Gold" />
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
                  placeholder="Min Points"
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
                  placeholder="Max Points (Optional)"
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
              placeholder="Describe the benefits for this tier..."
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={t("common.status.label", { defaultValue: "Status" })}>
            <StatusToggle t={t} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
