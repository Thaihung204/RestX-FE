"use client";

import StatusToggle from "@/components/ui/StatusToggle";
import supplierService, { SupplierItem } from "@/lib/services/supplierService";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type Supplier = SupplierItem & { phone: string; email: string; address: string };

export default function SupplierSettings() {
  const { t } = useTranslation("common");
  const { message } = App.useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Supplier>({ name: "", phone: "", email: "", address: "", isActive: true });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data as Supplier[]);
    } catch {
      message.error(t("dashboard.manage.suppliers.fetch_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) { setEditingSupplier(supplier); setFormData(supplier); }
    else { setEditingSupplier(null); setFormData({ id: "", name: "", phone: "", email: "", address: "", isActive: true }); }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingSupplier(null); };

  const handleSave = async () => {
    if (!formData.name.trim()) { message.error(t("dashboard.manage.suppliers.name_required")); return; }
    try {
      setSaving(true);
      if (editingSupplier?.id) {
        await supplierService.update(editingSupplier.id, { ...formData, id: editingSupplier.id });
        message.success(t("dashboard.manage.suppliers.updated"));
      } else {
        await supplierService.create(formData);
        message.success(t("dashboard.manage.suppliers.created"));
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch {
      message.error(t("dashboard.manage.suppliers.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supplierService.delete(id);
      message.success(t("dashboard.manage.suppliers.deleted", { defaultValue: "Đã xoá" }));
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error(t("dashboard.manage.suppliers.delete_failed"));
    }
  };

  const toggleStatus = async (supplier: Supplier) => {
    if (!supplier.id) return;
    const updated = { ...supplier, isActive: !supplier.isActive };
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? updated : s)));
    try {
      await supplierService.update(supplier.id, updated);
    } catch {
      setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
      message.error(t("dashboard.manage.suppliers.status_update_failed"));
    }
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: t("dashboard.manage.suppliers.name"),
      key: "name",
      render: (_, s) => (
        <div>
          <div className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>{s.name}</div>
          <div className="flex items-start gap-2 text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-2">{s.address}</span>
          </div>
        </div>
      ),
    },
    {
      title: t("dashboard.manage.suppliers.contact"),
      key: "contact",
      render: (_, s) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {s.phone}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {s.email || "-"}
          </div>
        </div>
      ),
    },
    {
      title: t("dashboard.manage.suppliers.status"),
      key: "status",
      width: 80,
      render: (_, s) => (
        <StatusToggle
          checked={s.isActive}
          onChange={() => toggleStatus(s)}
          ariaLabel={s.isActive ? t("dashboard.manage.suppliers.deactivate") : t("dashboard.manage.suppliers.activate")}
        />
      ),
    },
    {
      title: t("dashboard.manage.suppliers.actions"),
      key: "actions",
      align: "right",
      width: 100,
      render: (_, s) => (
        <div className="flex justify-end gap-2">
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(s)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" />
          <Popconfirm
            title={t("dashboard.manage.suppliers.confirm_delete")}
            onConfirm={() => s.id && handleDelete(s.id)}
            okText={t("common.actions.yes", { defaultValue: "Yes" })}
            cancelText={t("common.actions.no", { defaultValue: "No" })}
            okButtonProps={{ danger: true }}>
            <Button type="text" icon={<DeleteOutlined className="text-red-500" />} className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">{t("dashboard.manage.suppliers.title")}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("dashboard.manage.suppliers.subtitle")}</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
          {t("dashboard.manage.suppliers.add")}
        </Button>
      </div>

      <Table columns={columns} dataSource={suppliers} rowKey={(r) => r.id || r.name} loading={loading} pagination={{ pageSize: 10 }} className="admin-loyalty-table" />

      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {editingSupplier ? t("dashboard.manage.suppliers.edit") : t("dashboard.manage.suppliers.add")}
              </h3>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.suppliers.name")} <span className="text-[var(--primary)]">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.suppliers.phone")} <span className="text-[var(--primary)]">*</span></label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.suppliers.email")}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.suppliers.address")}</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                  rows={3} style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.suppliers.status", { defaultValue: "Status" })}</label>
                <StatusToggle
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  ariaLabel={formData.isActive ? t("dashboard.manage.suppliers.active", { defaultValue: "Active" }) : t("dashboard.manage.suppliers.inactive", { defaultValue: "Inactive" })}
                />
              </div>
            </div>
            <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.buttons.cancel")}
              </button>
              <button onClick={handleSave} disabled={!formData.name.trim() || saving}
                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {saving ? t("dashboard.settings.buttons.saving") : t("dashboard.settings.buttons.save_changes")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
