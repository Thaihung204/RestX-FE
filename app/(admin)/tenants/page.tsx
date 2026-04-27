"use client";

import {
    CheckCircleOutlined,
    EyeOutlined,
    MailOutlined,
    PhoneOutlined,
    PlusOutlined,
    ReloadOutlined,
    RiseOutlined,
    SearchOutlined,
    ShopOutlined,
    StopOutlined,
    WarningOutlined
} from "@ant-design/icons";
import { App, Input, Select, Switch, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TenantsSystemRevenue from "../../../components/(admin)/tenants/SystemRevenueTab";
import TenantRequestList from "../../../components/(admin)/tenants/TenantRequestList";

import { tenantService } from "../../../lib/services/tenantService";
import { ITenant } from "../../../lib/types/tenant";
import { useTenantLayout } from "./TenantLayoutProvider";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STAT_CONFIGS = [
  {
    key: "total",
    icon: <ShopOutlined />,
    iconColor: "#a5c8ff",
    glowColor: "rgba(35, 146, 255, 0.1)",
    filter: () => true,
  },
  {
    key: "active",
    icon: <CheckCircleOutlined />,
    iconColor: "#22C55E",
    glowColor: "rgba(34, 197, 94, 0.1)",
    filter: (t: ITenant) => t.status === "active",
  },
  {
    key: "inactive",
    icon: <StopOutlined />,
    iconColor: "#EF4444",
    glowColor: "rgba(239, 68, 68, 0.1)",
    filter: (t: ITenant) => t.status === "inactive",
  },
  {
    key: "maintenance",
    icon: <WarningOutlined />,
    iconColor: "#F97316",
    glowColor: "rgba(249, 115, 22, 0.1)",
    filter: (t: ITenant) => t.status === "maintenance",
  },
] as const;

const TenantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deactivateModal, setDeactivateModal] = useState<{ visible: boolean; tenant: ITenant | null }>({ visible: false, tenant: null });
  const [activateModal, setActivateModal] = useState<{ visible: boolean; tenant: ITenant | null }>({ visible: false, tenant: null });

  const { activeTab, setActiveTab, setTabItems } = useTenantLayout();

  // Restore or set default tab (survives remounts from language changes)
  useEffect(() => {
    setMounted(true);
    const savedTab = sessionStorage.getItem("tenants_active_tab");
    setActiveTab(savedTab || "tenants");

    return () => {
      setTabItems([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist active tab to sessionStorage whenever it changes
  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem("tenants_active_tab", activeTab);
    }
  }, [activeTab]);

  // Update tab labels when language changes (without resetting active tab)
  useEffect(() => {
    setTabItems([
      {
        key: "tenants",
        label: t("tenants.tabs.restaurant_list"),
        icon: <ShopOutlined />,
      },
      {
        key: "requests",
        label: t("tenants.tabs.tenant_requests"),
        icon: <CheckCircleOutlined />,
      },
      {
        key: "revenue",
        label: t("tenants.tabs.system_revenue"),
        icon: <RiseOutlined />,
      },
    ]);
  }, [setTabItems, t]);

  useEffect(() => {
    if (!mounted) return;
    fetchTenants();
  }, [mounted]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenantsForAdmin();
      setTenants(data);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      message.error(t("tenants.toasts.fetch_error_message"));
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    return tenants.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.hostName.toLowerCase().includes(query) ||
        item.businessName.toLowerCase().includes(query) ||
        item.phoneNumber.includes(query) ||
        item.ownerEmail.toLowerCase().includes(query) ||
        item.mailRestaurant.toLowerCase().includes(query) ||
        (item.networkIp && item.networkIp.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [search, status, tenants]);

  const handleRefresh = async () => {
    await fetchTenants();
  };

  const handleToggleStatus = (record: ITenant) => {
    const isActive = record.status === "active";
    if (isActive) {
      // Deactivating — show confirm modal
      setDeactivateModal({ visible: true, tenant: record });
    } else {
      // Activating — show confirm modal
      setActivateModal({ visible: true, tenant: record });
    }
  };

  const doToggleStatus = async (record: ITenant, activate: boolean) => {
    if (togglingIds.has(record.id)) return;
    setTogglingIds((prev) => new Set(prev).add(record.id));
    try {
      await tenantService.changeStatus(record.id, activate);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === record.id ? { ...t, status: activate ? "active" : "inactive" } : t
        )
      );
      message.success(
        activate
          ? t("tenants.toasts.activate_success")
          : t("tenants.toasts.deactivate_success")
      );
    } catch {
      message.error(t("tenants.toasts.toggle_error"));
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateModal.tenant) return;
    await doToggleStatus(deactivateModal.tenant, false);
    setDeactivateModal({ visible: false, tenant: null });
  };

  const handleActivateConfirm = async () => {
    if (!activateModal.tenant) return;
    await doToggleStatus(activateModal.tenant, true);
    setActivateModal({ visible: false, tenant: null });
  };

  const STATUS_OPTIONS_TRANSLATED = [
    { label: t("tenants.filter.all_status"), value: "all" },
    { label: t("tenants.filter.active"), value: "active" },
    { label: t("tenants.filter.inactive"), value: "inactive" },
    { label: t("tenants.filter.maintenance"), value: "maintenance" },
  ];



  const handleViewDetails = (record: ITenant) => {
    router.push(`/tenants/${record.id}`);
  };

  const columns: ColumnsType<ITenant> = [
    {
      title: t("tenants.table.tenant_info"),
      dataIndex: "name",
      key: "tenant",
      width: 300,
      render: (_, record) => (
        <div className="tenant-row-info">
          {(record as ITenant & { logoUrl?: string }).logoUrl ? (
            <div className="tenant-row-avatar" style={{ background: "transparent" }}>
              <img
                src={(record as ITenant & { logoUrl?: string }).logoUrl}
                alt={`${record.name} logo`}
              />
            </div>
          ) : (
            <div
              className="tenant-row-avatar"
              style={{ background: "var(--primary)", color: "#fff" }}>
              {record.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="tenant-row-name">{record.name}</div>
            <div className="tenant-row-business">{record.businessName}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("tenants.table.contact"),
      key: "contact",
      width: 220,
      render: (_, record) => (
        <div className="tenant-row-contact">
          <span className="tenant-row-contact-item">
            <PhoneOutlined /> {record.phoneNumber}
          </span>
          <span className="tenant-row-contact-item" title={record.mailRestaurant} style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
            <MailOutlined /> {record.mailRestaurant}
          </span>
        </div>
      ),
    },
    {
      title: t("tenants.table.address"),
      key: "address",
      width: 260,
      render: (_, record) => (
        <div className="tenant-row-contact">
          <span className="tenant-row-contact-item" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {record.addressLine1} {record.addressLine2}
          </span>
          <span className="tenant-row-contact-item">
            {record.addressLine3}{record.addressLine3 && record.addressLine4 ? ", " : ""}{record.addressLine4}
          </span>
        </div>
      ),
    },
    {
      title: t("tenants.table.hostname"),
      dataIndex: "hostName",
      key: "hostName",
      width: 220,
      render: (hostName: string) => {
        if (!hostName) return <span className="tenant-row-hostname">—</span>;
        const url = hostName.startsWith("http") ? hostName : `https://${hostName}`;
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="tenant-row-hostname"
            title={url}>
            {hostName}
          </a>
        );
      },
    },
    {
      title: t("tenants.table.status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: ITenant) => (
        <div className="tenant-status-toggle">
          <Switch
            checked={record.status === "active"}
            loading={togglingIds.has(record.id)}
            onChange={() => handleToggleStatus(record)}
            size="small"
          />
          <span className={`tenant-status-label tenant-status-label-${record.status}`}>
            {t(`tenants.status.${record.status}`)}
          </span>
        </div>
      ),
    },

    {
      title: t("dashboard.tables.card.view_details"),
      key: "actions",
      width: 80,
      align: "right" as const,
      render: (_, record) => (
        <button
          className="tenant-view-btn"
          onClick={() => handleViewDetails(record)}
          title={t("tenants.actions.view_details")}>
          <EyeOutlined />
        </button>
      ),
    },
  ];

  if (!mounted) {
    return (
      <div style={{ background: "var(--bg-base)", minHeight: "calc(100vh - 60px)" }} />
    );
  }

  return (
    <>
      <main style={{ background: "var(--bg-base)", color: "var(--text)", flex: 1 }}>
        <div className="tenant-content">
          {activeTab === "tenants" && (
            <div className="dashboard-animate-in" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* KPI Stats (Glass Slabs) */}
              <div className="tenant-stats-bar">
                {STAT_CONFIGS.map((cfg) => {
                  const count = tenants.filter(cfg.filter).length;
                  return (
                    <div key={cfg.key} className="tenant-stat-card">
                      <div className="tenant-stat-glow" style={{ background: cfg.glowColor }} />
                      <div className="tenant-stat-top">
                        <div>
                          <p className="tenant-stat-label">{t(`tenants.stats.${cfg.key}`)}</p>
                          <h3 className="tenant-stat-value">{count}</h3>
                        </div>
                        <span className="tenant-stat-icon" style={{ color: cfg.iconColor }}>
                          {cfg.icon}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toolbar */}
              <div className="tenant-toolbar">
                <div className="tenant-toolbar-left">
                  <div className="tenant-toolbar-search">
                    <Input
                      allowClear
                      prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ borderRadius: "999px", padding: "0.625rem 1rem" }}
                    />
                  </div>
                  <Select
                    style={{ width: 160 }}
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS_TRANSLATED}
                  />
                  <span className="tenant-toolbar-count">
                    {t("tenants.filter.total_filtered", {
                      total: tenants.length,
                      filtered: filteredData.length,
                    })}
                  </span>
                </div>
                <div className="tenant-toolbar-right">
                  <button
                    className={`tenant-refresh-btn ${loading ? "tenant-refresh-btn-loading" : ""}`}
                    onClick={handleRefresh}
                    disabled={loading}>
                    <ReloadOutlined />
                    <span>{t("tenants.filter.refresh")}</span>
                  </button>
                  <Link href="/tenants/new">
                    <span className="tenant-add-btn">
                      <PlusOutlined />
                      {t("tenants.add_tenant")}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Table */}
              <div className="tenant-table-wrap">
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredData}
                  size="small"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {t("tenants.table.total", { count: total })}
                      </span>
                    ),
                    className: "px-4 pb-3",
                    responsive: true,
                    showLessItems: true,
                  }}
                  scroll={{ x: "max-content", y: "calc(100vh - 520px)" }}
                />
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div className="dashboard-animate-in">
              <TenantRequestList />
            </div>
          )}
          {activeTab === "revenue" && (
            <div className="dashboard-animate-in">
              <TenantsSystemRevenue />
            </div>
          )}
        </div>

        {/* Bottom refractive glow */}
        <div className="tenant-bottom-glow" />
      </main>

      {/* Deactivate Confirm Modal */}
      <ConfirmModal
        open={deactivateModal.visible}
        title={t("tenants.deactivate_modal.title")}
        description={t("tenants.deactivate_modal.warning_description")}
        confirmText={t("tenants.deactivate_modal.button_confirm")}
        cancelText={t("tenants.edit.delete_modal.button_cancel")}
        variant="warning"
        loading={deactivateModal.tenant ? togglingIds.has(deactivateModal.tenant.id) : false}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateModal({ visible: false, tenant: null })}
      />

      <ConfirmModal
        open={activateModal.visible}
        title={t("tenants.activate_modal.title")}
        description={t("tenants.activate_modal.description")}
        confirmText={t("common.activate")}
        cancelText={t("common.cancel")}
        variant="info"
        loading={activateModal.tenant ? togglingIds.has(activateModal.tenant.id) : false}
        onConfirm={handleActivateConfirm}
        onCancel={() => setActivateModal({ visible: false, tenant: null })}
      />
    </>
  );
};

export default TenantPage;
