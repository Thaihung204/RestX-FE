"use client";

import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import ConfirmModal from "@/components/ui/ConfirmModal";
import StatusToggle from "@/components/ui/StatusToggle";
import loyaltyService, { LoyaltyPointBand, TIER_COLORS } from "@/lib/services/loyaltyService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, ColorPicker, Form, Input, InputNumber, message, Modal, Table } from "antd";
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
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LoyaltyPointBand | null>(null);
  const [pendingToggle, setPendingToggle] = useState<LoyaltyPointBand | null>(null);

  const defaultValues = { isActive: true, min: 0, discountPercentage: 0, logoColor: TIER_COLORS.bronze, name: "", benefitDescription: "" };

  const fetchBands = async () => {
    setLoading(true);
    try {
      const data = await loyaltyService.getAllBands();
      setBands(data);
    } catch (error) {
      messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.errors.fetch_failed")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible) {
      if (editingBand) { form.setFieldsValue(editingBand); }
      else { form.resetFields(); form.setFieldsValue(defaultValues); }
    }
  }, [modalVisible, editingBand, form]);

  useEffect(() => { fetchBands(); }, []);

  const handleAdd = () => { setEditingBand(null); setModalVisible(true); };
  const handleEdit = (band: LoyaltyPointBand) => { setEditingBand(band); setModalVisible(true); };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      await loyaltyService.deleteBand(id);
      messageApi.success(t("dashboard.manage.notifications.delete_success"));
      fetchBands();
    } catch (error) {
      messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.errors.delete_failed")));
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const values = await form.validateFields();
      if (editingBand) {
        await loyaltyService.updateBand(editingBand.id, { ...values, id: editingBand.id });
        messageApi.success(t("dashboard.manage.notifications.update_success"));
      } else {
        await loyaltyService.createBand(values);
        messageApi.success(t("dashboard.manage.notifications.create_success"));
      }
      setModalVisible(false);
      fetchBands();
    } catch (error: any) {
      messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.errors.save_failed")));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!pendingToggle || togglingId) return;
    const record = pendingToggle;
    try {
      setTogglingId(record.id);
      await loyaltyService.updateBand(record.id, { ...record, isActive: !record.isActive });
      messageApi.success(t("dashboard.manage.notifications.update_success"));
      fetchBands();
    } catch (error) {
      messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.errors.update_failed")));
    } finally {
      setTogglingId(null);
      setPendingToggle(null);
    }
  };

  const getVipTierColor = (tierOrColor: string): string => {
    if (tierOrColor?.startsWith("#")) return tierOrColor;
    return TIER_COLORS[tierOrColor?.toLowerCase()] ?? "#6B7280";
  };

  const columns = [
    {
      title: t("dashboard.manage.loyalty.form.logo"),
      key: "icon",
      width: 100,
      align: "center" as const,
      render: (_: any, record: LoyaltyPointBand) => {
        const color = record.logoColor || getVipTierColor(record.name);
        return <div className="flex items-center justify-center"><LoyaltyBandIcon color={color} size={24} /></div>;
      },
    },
    { title: t("dashboard.manage.loyalty.name"), dataIndex: "name", key: "name", render: (text: string) => <span className="font-medium">{text}</span> },
    {
      title: t("dashboard.manage.loyalty.range"),
      key: "range",
      render: (_: any, record: LoyaltyPointBand) => <span>{record.min} - {record.max !== null ? record.max : "∞"}</span>,
    },
    { title: t("dashboard.manage.loyalty.discount"), dataIndex: "discountPercentage", key: "discountPercentage", render: (val: number) => <span>{val}%</span> },
    { title: t("dashboard.manage.loyalty.benefits"), dataIndex: "benefitDescription", key: "benefitDescription", ellipsis: true },
    {
      title: t("dashboard.manage.loyalty.status"),
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: LoyaltyPointBand) => (
        <StatusToggle
          checked={isActive}
          onChange={() => setPendingToggle(record)}
          disabled={!!togglingId || !!deletingId}
          ariaLabel={isActive ? t("common.deactivate") : t("common.activate")}
        />
      ),
    },
    {
      title: t("common.actions.title"),
      key: "actions",
      width: 120,
      render: (_: any, record: LoyaltyPointBand) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} type="text" disabled={!!deletingId || !!togglingId || isSaving} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" />
          <Button icon={<DeleteOutlined />} type="text" loading={deletingId === record.id} disabled={!!deletingId || !!togglingId || isSaving} onClick={() => setPendingDelete(record)} className="text-red-600 hover:text-red-700 hover:bg-red-50" />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      {contextHolder}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">{t("dashboard.manage.loyalty.title")}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("dashboard.manage.loyalty.desc")}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={loading}
          style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
          {t("dashboard.manage.loyalty.add_new")}
        </Button>
      </div>

      <Table columns={columns} dataSource={bands} rowKey="id" loading={loading} pagination={false} className="admin-loyalty-table" />

      <ConfirmModal
        open={!!pendingDelete}
        title={t("dashboard.manage.loyalty.confirm_delete_title")}
        description={t("dashboard.manage.loyalty.confirm_delete_desc", { name: pendingDelete?.name })}
        confirmText={t("common.actions.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        open={!!pendingToggle}
        title={pendingToggle?.isActive ? t("dashboard.manage.loyalty.confirm_deactivate_title") : t("dashboard.manage.loyalty.confirm_activate_title")}
        description={pendingToggle?.isActive
          ? t("dashboard.manage.loyalty.confirm_deactivate_desc", { name: pendingToggle?.name })
          : t("dashboard.manage.loyalty.confirm_activate_desc", { name: pendingToggle?.name })}
        confirmText={pendingToggle?.isActive ? t("common.deactivate") : t("common.activate")}
        cancelText={t("common.cancel")}
        variant={pendingToggle?.isActive ? "warning" : "info"}
        loading={!!togglingId}
        onConfirm={confirmToggleStatus}
        onCancel={() => setPendingToggle(null)}
      />

      <Modal
        title={editingBand ? t("dashboard.manage.loyalty.edit") : t("dashboard.manage.loyalty.create")}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        okButtonProps={{ loading: isSaving, disabled: isSaving, style: { background: "var(--primary)", borderColor: "var(--primary)" } }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t("dashboard.manage.loyalty.form.name")} rules={[{ required: true, message: t("common.validation.required") }]}>
            <Input />
          </Form.Item>
          <Form.Item name="logoColor" label={t("dashboard.manage.loyalty.form.logo")}
            rules={[{ required: true, message: t("dashboard.manage.loyalty.form.logo_required") }]}
            getValueFromEvent={(value) => value?.toHexString?.() ?? value}>
            <ColorPicker showText size="large" format="hex"
              presets={[{ label: t("dashboard.manage.loyalty.badges.default"), colors: Object.values(TIER_COLORS) }]}
              className="w-full justify-start rounded-xl" />
          </Form.Item>
          <Form.Item label={t("dashboard.manage.loyalty.form.range")} required style={{ marginBottom: 0 }}>
            <div className="flex gap-4">
              <Form.Item name="min" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <span className="leading-[32px]">-</span>
              <Form.Item name="max" style={{ flex: 1 }} tooltip={t("dashboard.manage.loyalty.form.max_tooltip")}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item name="discountPercentage" label={t("dashboard.manage.loyalty.form.discount")} rules={[{ required: true }]}>
            <InputNumber min={0} max={100} style={{ width: "100%" }} parser={(value) => value?.replace("%", "") as unknown as number} formatter={(value) => `${value}%`} />
          </Form.Item>
          <Form.Item name="benefitDescription" label={t("dashboard.manage.loyalty.form.benefits")} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label={t("common.status.label")} valuePropName="checked" getValueFromEvent={(checked: boolean) => checked}>
            <StatusToggle
              checked={form.getFieldValue("isActive") ?? true}
              onChange={() => form.setFieldValue("isActive", !(form.getFieldValue("isActive") ?? true))}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const selectedColor = getFieldValue("logoColor") || TIER_COLORS.bronze;
              const selectedName = getFieldValue("name") || t("dashboard.manage.loyalty.preview.default_name");
              return (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {t("dashboard.manage.loyalty.preview.title")}
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
