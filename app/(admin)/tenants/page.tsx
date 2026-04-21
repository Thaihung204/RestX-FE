"use client";

import StatusToggle from "@/components/ui/StatusToggle";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  ShopOutlined
} from "@ant-design/icons";
import { App, Avatar, Button, Card, Input, Modal, Select, Table } from "antd";
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

const TenantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deactivateModal, setDeactivateModal] = useState<{ visible: boolean; tenant: ITenant | null }>({ visible: false, tenant: null });

  const { activeTab, setActiveTab, setTabItems } = useTenantLayout();

  useEffect(() => {
    setMounted(true);
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
    setActiveTab("tenants");

    return () => {
      setTabItems([]);
      setActiveTab("");
    };
  }, [setTabItems, setActiveTab, t]);

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
      // Activating — no confirm needed
      doToggleStatus(record, true);
    }
  };

  const doToggleStatus = async (record: ITenant, activate: boolean) => {
    if (togglingId) return;
    setTogglingId(record.id);
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
      message.error(t("tenants.toasts.save_error_message"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateModal.tenant) return;
    await doToggleStatus(deactivateModal.tenant, false);
    setDeactivateModal({ visible: false, tenant: null });
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
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {(record as ITenant & { logoUrl?: string }).logoUrl ? (
            <div
              className="w-10 h-10 rounded-lg overflow-hidden shadow-sm border"
              style={{
                background: "transparent",
                borderColor: "var(--border)",
              }}>
              <img
                src={(record as ITenant & { logoUrl?: string }).logoUrl}
                alt={`${record.name} logo`}
                className="w-full h-full"
                style={{
                  objectFit: "contain",
                  filter: "none",
                  mixBlendMode: "normal",
                  background: "transparent",
                }}
              />
            </div>
          ) : (
            <Avatar
              shape="square"
              size="large"
              className="shadow-sm rounded-lg bg-[var(--primary)] text-white">
              {record.name.charAt(0)}
            </Avatar>
          )}
          <div className="flex flex-col">
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--text)" }}>
              {record.name}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {record.businessName}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t("tenants.table.contact"),
      key: "contact",
      width: 220,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            <PhoneOutlined className="mr-1" /> {record.phoneNumber}
          </span>
          <span
            className="text-[11px] truncate max-w-[200px]"
            style={{ color: "var(--text-muted)" }}
            title={record.mailRestaurant}>
            <MailOutlined className="mr-1" /> {record.mailRestaurant}
          </span>
        </div>
      ),
    },
    {
      title: t("tenants.table.address"),
      key: "address",
      width: 240,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {record.addressLine1} {record.addressLine2}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {record.addressLine3}, {record.addressLine4}
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
        const url = hostName.startsWith("http")
          ? hostName
          : `https://${hostName}`;
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono truncate max-w-[200px] block hover:underline"
            style={{ color: "var(--text-muted)" }}
            title={url}>
            {url}
          </a>
        );
      },
    },
    {
      title: t("tenants.table.status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (value: ITenant["status"], record: ITenant) => (
        <StatusToggle
          checked={value === "active"}
          onChange={() => handleToggleStatus(record)}
          disabled={togglingId === record.id}
          ariaLabel={t("tenants.table.status")}
        />
      ),
    },
    {
      title: t("dashboard.tables.card.view_details"),
      key: "actions",
      width: 70,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          shape="circle"
          icon={<EyeOutlined style={{ color: "var(--text-muted)" }} />}
          onClick={() => handleViewDetails(record)}
          title={t("tenants.actions.view_details")}
          aria-label={t("tenants.actions.view_details")}
        />
      ),
    },
  ];

  if (!mounted) {
    return (
      <div
        style={{
          background: "var(--bg-base)",
          minHeight: "calc(100vh - 60px)",
        }}
      />
    );
  }

  return (
    <>
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)", flex: 1 }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === "tenants" && (
            <Card
              variant="borderless"
              className="shadow-md overflow-hidden"
              styles={{ body: { padding: 0 } }}
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}>
              <div
                className="p-3 md:p-4 flex flex-col lg:flex-row gap-3 justify-between"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--card)",
                }}>
                <div className="flex flex-col sm:flex-row flex-1 gap-2 max-w-3xl">
                  <Input
                    allowClear
                    prefix={
                      <SearchOutlined style={{ color: "var(--text-muted)" }} />
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:flex-1"
                  />
                  <Select
                    className="w-full sm:w-44"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS_TRANSLATED}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}>
                    {t("tenants.filter.total_filtered", {
                      total: tenants.length,
                      filtered: filteredData.length,
                    })}
                  </span>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}>
                    {t("tenants.filter.refresh")}
                  </Button>
                  <Link href="/tenants/new">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="shadow-orange-900/20 shadow-lg border-none">
                      {t("tenants.add_tenant")}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="w-full overflow-auto">
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredData}
                  size="small"
                  loading={loading}
                  className="admin-tenants-table"
                  style={{
                    ["--table-header-bg" as string]: "var(--surface)",
                    ["--table-header-text" as string]: "var(--text)",
                    ["--table-row-hover-bg" as string]: "var(--surface-subtle)",
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => (
                      <span style={{ color: "var(--text-muted)" }}>
                        {t("tenants.table.total", { count: total })}
                      </span>
                    ),
                    className: "px-3 md:px-4 pb-3",
                    responsive: true,
                    showLessItems: true,
                  }}
                  scroll={{ x: "max-content", y: "calc(100vh - 500px)" }}
                />
              </div>
            </Card>
          )}

          {activeTab === "requests" && <TenantRequestList />}
          {activeTab === "revenue" && <TenantsSystemRevenue />}
        </div>
      </main>

      {/* Deactivate Confirm Modal */}
      <Modal
        centered
        maskClosable={!togglingId}
        keyboard={!togglingId}
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-orange-500 text-2xl" />
            <span className="text-lg font-semibold">
              {t("tenants.deactivate_modal.title")}
            </span>
          </div>
        }
        open={deactivateModal.visible}
        onCancel={() => setDeactivateModal({ visible: false, tenant: null })}
        footer={[
          <Button key="cancel" onClick={() => setDeactivateModal({ visible: false, tenant: null })} size="large">
            {t("tenants.edit.delete_modal.button_cancel")}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={!!togglingId}
            onClick={handleDeactivateConfirm}
            size="large"
            icon={<DeleteOutlined />}>
            {t("tenants.deactivate_modal.button_confirm")}
          </Button>,
        ]}
        width={480}
        styles={{
          mask: { backdropFilter: "blur(10px)", background: "var(--modal-overlay)" },
        }}>
        <div className="py-4 space-y-4">
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
              {t("tenants.deactivate_modal.warning_title")}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {t("tenants.deactivate_modal.warning_description")}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TenantPage;
