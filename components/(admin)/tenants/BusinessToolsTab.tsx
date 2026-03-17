"use client";

import TenantStatusPill from "@/components/(admin)/tenants/TenantStatusPill";
import { ITenant } from "@/lib/types/tenant";
import {
  CheckCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Input,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface StatusOption {
  label: string;
  value: string;
}

interface BusinessToolsTabProps {
  tenants: ITenant[];
  loading: boolean;
  onRefresh: () => void;
}

const BusinessToolsTab: React.FC<BusinessToolsTabProps> = ({
  tenants,
  loading,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [businessToolSearch, setBusinessToolSearch] = React.useState("");
  const [businessToolStatus, setBusinessToolStatus] = React.useState<string>("all");

  const STATUS_LABELS: Record<string, string> = {
    all: t("tenants.filter.all_status"),
    active: t("tenants.filter.active"),
    inactive: t("tenants.filter.inactive"),
    maintenance: t("tenants.filter.maintenance"),
  };

  const businessToolStatusOptions: StatusOption[] = [
    { label: STATUS_LABELS.all, value: "all" },
    { label: STATUS_LABELS.active, value: "active" },
    { label: STATUS_LABELS.inactive, value: "inactive" },
    { label: STATUS_LABELS.maintenance, value: "maintenance" },
  ];

  const onBusinessToolSearchChange = (value: string) => {
    setBusinessToolSearch(value);
  };

  const onBusinessToolStatusChange = (value: string) => {
    setBusinessToolStatus(value);
  };

  const filteredBusinessToolData = useMemo(() => {
    const query = businessToolSearch.toLowerCase().trim();
    return tenants.filter((item) => {
      const matchesStatus =
        businessToolStatus === "all" || item.status === businessToolStatus;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.hostName.toLowerCase().includes(query) ||
        item.businessName.toLowerCase().includes(query) ||
        item.ownerEmail.toLowerCase().includes(query) ||
        item.mailRestaurant.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [businessToolSearch, businessToolStatus, tenants]);

  const businessToolColumns: ColumnsType<ITenant> = [
    {
      title: t("tenants.business_tools.table.live"),
      key: "live",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Tooltip title={t("tenants.business_tools.table.tooltip_auto_switch")}>
          <Switch
            size="small"
            defaultChecked={record.status === "active"}
            style={{ background: "var(--primary)" }}
          />
        </Tooltip>
      ),
    },
    {
      title: t("tenants.table.tenant_info"),
      dataIndex: "name",
      key: "tenant",
      width: 260,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div
            className="shadow-sm rounded-lg bg-[var(--primary)] text-white flex items-center justify-center"
            style={{ width: 36, height: 36 }}>
            {record.name.charAt(0)}
          </div>
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
      title: t("tenants.business_tools.table.trigger"),
      key: "trigger",
      width: 200,
      render: () => (
        <Space size={6} wrap>
          <Tag color="blue">{t("tenants.business_tools.table.auto_status")}</Tag>
          <Tag color="orange">{t("tenants.business_tools.table.schedule")}</Tag>
        </Space>
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
      title: t("tenants.business_tools.table.current_status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: ITenant["status"]) => <TenantStatusPill status={value} />,
    },
    {
      title: t("tenants.business_tools.table.next_status"),
      key: "nextStatus",
      width: 180,
      render: (_, record) => (
        <Select
          size="small"
          className="w-full"
          defaultValue={record.status}
          options={businessToolStatusOptions.filter(
            (option) => option.value !== "all"
          )}
        />
      ),
    },
    {
      title: t("tenants.business_tools.table.actions"),
      key: "actions",
      width: 120,
      align: "center",
      render: () => (
        <Button
          size="small"
          type="primary"
          icon={<ReloadOutlined />}
          className="shadow-orange-900/20 border-none">
          {t("tenants.business_tools.table.apply")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        variant="borderless"
        className="shadow-md"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Typography.Title
              level={4}
              style={{ margin: 0, color: "var(--text)" }}>
              {t("tenants.business_tools.title")}
            </Typography.Title>
            <Typography.Text style={{ color: "var(--text-muted)" }}>
              {t("tenants.business_tools.subtitle")}
            </Typography.Text>
          </div>
          <Space size={8} wrap>
            <Button type="primary" icon={<PlusOutlined />}>
              {t("tenants.business_tools.new_rule")}
            </Button>
            <Button icon={<ReloadOutlined />}> {t("tenants.business_tools.refresh")}</Button>
          </Space>
        </div>
        <Divider style={{ margin: "16px 0" }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="borderless"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <Statistic
              title={
                <span style={{ color: "var(--text-muted)" }}>
                  {t("tenants.business_tools.stats.active_rules")}
                </span>
              }
              value={12}
              prefix={<CheckCircleOutlined style={{ color: "#34d399" }} />}
              styles={{ content: { color: "#34d399" } }}
            />
          </Card>
          <Card
            variant="borderless"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <Statistic
              title={
                <span style={{ color: "var(--text-muted)" }}>
                  {t("tenants.business_tools.stats.scheduled_jobs")}
                </span>
              }
              value={6}
              prefix={<RiseOutlined style={{ color: "#60a5fa" }} />}
              styles={{ content: { color: "#60a5fa" } }}
            />
          </Card>
          <Card
            variant="borderless"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <Statistic
              title={
                <span style={{ color: "var(--text-muted)" }}>
                  {t("tenants.business_tools.stats.maintenance_queue")}
                </span>
              }
              value={4}
              prefix={<ShopOutlined style={{ color: "#f59e0b" }} />}
              styles={{ content: { color: "#f59e0b" } }}
            />
          </Card>
        </div>
      </Card>

      <Card
        variant="borderless"
        className="shadow-md overflow-hidden"
        styles={{ body: { padding: 0 } }}
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <div
          className="p-3 md:p-4 flex flex-col gap-3"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--card)",
          }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <Input
              allowClear
              placeholder={t("tenants.business_tools.search_placeholder")}
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              value={businessToolSearch}
              onChange={(e) => onBusinessToolSearchChange(e.target.value)}
              className="w-full lg:max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              <Select
                className="w-44"
                value={businessToolStatus}
                onChange={onBusinessToolStatusChange}
                options={businessToolStatusOptions}
              />
              <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                {t("tenants.business_tools.sync_tenants")}
              </Button>
            </div>
          </div>
          <div
            className="flex flex-wrap items-center gap-2 text-xs"
            style={{ color: "var(--text-muted)" }}>
            <Tag color="green">{t("tenants.business_tools.tags.auto")}</Tag>
            <Tag color="orange">{t("tenants.business_tools.tags.schedule")}</Tag>
            <Tag color="blue">{t("tenants.business_tools.tags.manual_trigger")}</Tag>
            <span>
              {t("tenants.business_tools.summary", {
                total: tenants.length,
                showing: filteredBusinessToolData.length,
              })}
            </span>
          </div>
        </div>
        <div className="w-full overflow-auto">
          <Table
            rowKey="id"
            columns={businessToolColumns}
            dataSource={filteredBusinessToolData}
            size="small"
            loading={loading}
            className="admin-tenants-table"
            style={
              {
                "--table-header-bg": "var(--surface)",
                "--table-header-text": "var(--text)",
                "--table-row-hover-bg": "var(--surface-subtle)",
              } as React.CSSProperties
            }
            pagination={{
              pageSize: 8,
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
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card
          variant="borderless"
          className="shadow-md"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}>
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title
                level={5}
                style={{ margin: 0, color: "var(--text)" }}>
                {t("tenants.business_tools.quick_actions.title")}
              </Typography.Title>
              <Typography.Text style={{ color: "var(--text-muted)" }}>
                {t("tenants.business_tools.quick_actions.subtitle")}
              </Typography.Text>
            </div>
            <Button type="link">
              {t("tenants.business_tools.quick_actions.view_all")}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: t(
                  "tenants.business_tools.quick_actions.items.bulk_activation.title"
                ),
                desc: t(
                  "tenants.business_tools.quick_actions.items.bulk_activation.desc"
                ),
                badge: t("tenants.business_tools.tags.auto"),
              },
              {
                title: t(
                  "tenants.business_tools.quick_actions.items.scheduled_pause.title"
                ),
                desc: t(
                  "tenants.business_tools.quick_actions.items.scheduled_pause.desc"
                ),
                badge: t("tenants.business_tools.tags.schedule"),
              },
              {
                title: t(
                  "tenants.business_tools.quick_actions.items.inactive_reminder.title"
                ),
                desc: t(
                  "tenants.business_tools.quick_actions.items.inactive_reminder.desc"
                ),
                badge: t("tenants.business_tools.tags.manual_trigger"),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start justify-between gap-4 rounded-xl p-3"
                style={{ background: "var(--surface)" }}>
                <div>
                  <Typography.Text strong style={{ color: "var(--text)" }}>
                    {item.title}
                  </Typography.Text>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </div>
                </div>
                <Tag
                  color={
                    item.badge === t("tenants.business_tools.tags.auto")
                      ? "green"
                      : item.badge === t("tenants.business_tools.tags.schedule")
                      ? "orange"
                      : "blue"
                  }>
                  {item.badge}
                </Tag>
              </div>
            ))}
          </div>
        </Card>

        <Card
          variant="borderless"
          className="shadow-md"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}>
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title
                level={5}
                style={{ margin: 0, color: "var(--text)" }}>
                {t("tenants.business_tools.rule_preview.title")}
              </Typography.Title>
              <Typography.Text style={{ color: "var(--text-muted)" }}>
                {t("tenants.business_tools.rule_preview.subtitle")}
              </Typography.Text>
            </div>
            <Button type="primary" size="small" icon={<PlusOutlined />}>
              {t("tenants.business_tools.rule_preview.create")}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              t("tenants.business_tools.rule_preview.items.new_signup"),
              t("tenants.business_tools.rule_preview.items.payment_failure"),
              t("tenants.business_tools.rule_preview.items.scheduled_downtime"),
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-xl border p-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-center justify-between">
                  <Typography.Text strong style={{ color: "var(--text)" }}>
                    {label}
                  </Typography.Text>
                  <Tag
                    color={index === 0 ? "green" : index === 1 ? "red" : "orange"}>
                    {index === 0
                      ? t("tenants.status.active")
                      : index === 1
                      ? t("tenants.status.inactive")
                      : t("tenants.status.maintenance")}
                  </Tag>
                </div>
                <div
                  className="text-xs mt-2"
                  style={{ color: "var(--text-muted)" }}>
                  {t("tenants.business_tools.rule_preview.condition_label", {
                    value:
                      index === 0
                        ? t(
                            "tenants.business_tools.rule_preview.conditions.new_tenant"
                          )
                        : index === 1
                        ? t(
                            "tenants.business_tools.rule_preview.conditions.failed_payment"
                          )
                        : t(
                            "tenants.business_tools.rule_preview.conditions.scheduled_maintenance"
                          ),
                  })}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("tenants.business_tools.rule_preview.action_label", {
                    value:
                      index === 0
                        ? t(
                            "tenants.business_tools.rule_preview.actions.auto_active"
                          )
                        : index === 1
                        ? t(
                            "tenants.business_tools.rule_preview.actions.switch_inactive"
                          )
                        : t(
                            "tenants.business_tools.rule_preview.actions.schedule_maintenance"
                          ),
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusinessToolsTab;
