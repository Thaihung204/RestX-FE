"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import { useLanguage } from "@/components/I18nProvider";
import adminAuthService from "@/lib/services/adminAuthService";
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
    UserOutlined,
} from "@ant-design/icons";
import {
    App,
    Avatar,
    Breadcrumb,
    Button,
    Card,
    DatePicker,
    Dropdown,
    Input,
    Radio,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TenantRequestList from "../../../components/(admin)/tenants/TenantRequestList";
import TenantStatusPill from "../../../components/(admin)/tenants/TenantStatusPill";
import { tenantService } from "../../../lib/services/tenantService";
import { ITenant } from "../../../lib/types/tenant";

// --- MAIN PAGE COMPONENT ---

const TenantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const { message } = App.useApp();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Super Admin");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [activeRevenueRange, setActiveRevenueRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tenants from API
  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    const admin = adminAuthService.getCurrentAdmin();
    if (admin) {
      setAdminName(admin.fullName || admin.email || "Admin");
      const roles = admin.roles || [];
      setAdminRole(roles.length ? roles.join(", ") : "Super Admin");
    }
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenantsForAdmin();
      setTenants(data);
      message.success(t("tenants.toasts.fetch_success_message"));
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

  const stats = useMemo(() => {
    return {
      total: tenants.length,
      active: tenants.filter((t) => t.status === "active").length,
      maintenance: tenants.filter((t) => t.status === "maintenance").length,
    };
  }, [tenants]);

  const handleRefresh = async () => {
    await fetchTenants();
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
          <Avatar
            shape="square"
            size="large"
            className="shadow-sm rounded-lg bg-[var(--primary)] text-white">
            {record.name.charAt(0)}
          </Avatar>
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
      width: 140,
      render: (value: ITenant["status"]) => <TenantStatusPill status={value} />,
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

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top header + theme toggle */}
          <div className="flex items-start justify-between gap-4">
            {/* Header Section - Admin Tenants */}
            <div>
              <Breadcrumb
                items={[
                  { title: t("tenants.breadcrumb.admin") },
                  { title: t("tenants.breadcrumb.tenants") },
                ]}
                className="text-xs font-medium mb-1"
              />
              <Typography.Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "var(--text)",
                }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B3B] to-red-500">
                  {t("tenants.title")}
                </span>
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}>
                {t("tenants.subtitle")}
              </Typography.Paragraph>
            </div>

            {/* Language + Theme toggle + create button */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 rounded-lg transition-colors group flex items-center gap-2.5 h-10"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                  }}>
                  {language === "vi" ? (
                    <svg
                      className="w-6 h-4 rounded-[2px] shadow-sm"
                      viewBox="0 0 3 2"
                      xmlns="http://www.w3.org/2000/svg">
                      <rect width="3" height="2" fill="#DA251D" />
                      <polygon
                        points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                        fill="#FF0"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-4 rounded-[2px] shadow-sm"
                      viewBox="0 0 60 30"
                      xmlns="http://www.w3.org/2000/svg">
                      <clipPath id="s">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <clipPath id="t">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                      </clipPath>
                      <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path
                          d="M0,0 L60,30 M60,0 L0,30"
                          stroke="#fff"
                          strokeWidth="6"
                        />
                        <path
                          d="M0,0 L60,30 M60,0 L0,30"
                          clipPath="url(#t)"
                          stroke="#C8102E"
                          strokeWidth="4"
                        />
                        <path
                          d="M30,0 v30 M0,15 h60"
                          stroke="#fff"
                          strokeWidth="10"
                        />
                        <path
                          d="M30,0 v30 M0,15 h60"
                          stroke="#C8102E"
                          strokeWidth="6"
                        />
                      </g>
                    </svg>
                  )}
                  <span className="text-sm font-medium uppercase group-hover:text-orange-500 leading-none pt-[1px]">
                    {language}
                  </span>
                  <svg
                    className="w-3 h-3 text-[var(--text-muted)] opacity-70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isLangMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsLangMenuOpen(false)}
                    />
                    <div
                      className="absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border p-1 z-40 transition-all"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}>
                      <button
                        onClick={() => {
                          changeLanguage("en");
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${language === "en" ? "bg-orange-500/10 text-orange-500" : "hover:bg-[var(--bg-base)]"}`}
                        style={{
                          color: language === "en" ? undefined : "var(--text)",
                        }}>
                        <svg
                          className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                          viewBox="0 0 60 30"
                          xmlns="http://www.w3.org/2000/svg">
                          <clipPath id="s2">
                            <path d="M0,0 v30 h60 v-30 z" />
                          </clipPath>
                          <clipPath id="t2">
                            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                          </clipPath>
                          <g clipPath="url(#s2)">
                            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                            <path
                              d="M0,0 L60,30 M60,0 L0,30"
                              stroke="#fff"
                              strokeWidth="6"
                            />
                            <path
                              d="M0,0 L60,30 M60,0 L0,30"
                              clipPath="url(#t2)"
                              stroke="#C8102E"
                              strokeWidth="4"
                            />
                            <path
                              d="M30,0 v30 M0,15 h60"
                              stroke="#fff"
                              strokeWidth="10"
                            />
                            <path
                              d="M30,0 v30 M0,15 h60"
                              stroke="#C8102E"
                              strokeWidth="6"
                            />
                          </g>
                        </svg>
                        <span className="font-medium">English</span>
                        {language === "en" && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage("vi");
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${language === "vi" ? "bg-orange-500/10 text-orange-500" : "hover:bg-[var(--bg-base)]"}`}
                        style={{
                          color: language === "vi" ? undefined : "var(--text)",
                        }}>
                        <svg
                          className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                          viewBox="0 0 3 2"
                          xmlns="http://www.w3.org/2000/svg">
                          <rect width="3" height="2" fill="#DA251D" />
                          <polygon
                            points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                            fill="#FF0"
                          />
                        </svg>
                        <span className="font-medium">Tiếng Việt</span>
                        {language === "vi" && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <ThemeToggle />
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "user-info",
                      label: (
                        <div style={{ padding: "4px 0", maxWidth: 200 }}>
                          <div style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "bold" }}>{adminName}</div>
                          <div style={{ fontSize: 12, display: "block", opacity: 0.6 }}>{adminRole}</div>
                        </div>
                      ),
                      disabled: true,
                      style: { cursor: "default" },
                    },
                    { type: "divider" },
                    { key: "logout", label: t("staff.user_menu.logout"), danger: true },
                  ],
                  style: {
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  },
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      adminAuthService.logout();
                      router.replace("/login");
                    }
                  },
                }}
                placement="bottomRight"
                trigger={["click"]}>
                <button
                  className="flex items-center justify-center rounded-full transition-colors"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", width: 36, height: 36 }}>
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    style={{ background: "var(--primary)", color: "white" }}
                  />
                </button>
              </Dropdown>
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

          {/* Stats Cards Row - focused for admin/tenants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              variant="borderless"
              className="shadow-md"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}>
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}>
                    {t("tenants.stats.total_tenants")}
                  </span>
                }
                value={stats.total}
                prefix={<ShopOutlined style={{ color: "var(--primary)" }} />}
                styles={{ content: { color: "var(--text)" } }}
              />
            </Card>

            <Card
              variant="borderless"
              className="shadow-md"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}>
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}>
                    {t("tenants.stats.active_tenants")}
                  </span>
                }
                value={stats.active}
                styles={{ content: { color: "#34d399" } }}
                prefix={<CheckCircleOutlined style={{ color: "#34d399" }} />}
              />
            </Card>

            <Card
              variant="borderless"
              className="shadow-md"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}>
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}>
                    {t("tenants.stats.monthly_revenue")}
                  </span>
                }
                value={125_000_000}
                precision={0}
                prefix={
                  <RiseOutlined style={{ color: "#60a5fa", marginRight: 4 }} />
                }
                styles={{ content: { color: "#60a5fa" } }}
                suffix="₫"
              />
            </Card>
          </div>

          {/* Tabs: Tenant list, Tenant Requests & System revenue */}
          <Tabs
            defaultActiveKey="tenants"
            items={[
              {
                key: "tenants",
                label: t("tenants.tabs.restaurant_list"),
                children: (
                  <Card
                    variant="borderless"
                    className="shadow-md overflow-hidden"
                    styles={{ body: { padding: 0 } }}
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}>
                    {/* Filter Bar */}
                    <div
                      className="p-3 md:p-4 flex flex-col sm:flex-row gap-2 md:gap-3 justify-between items-stretch sm:items-center"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: "var(--card)",
                      }}>
                      <div className="flex flex-col sm:flex-row flex-1 gap-2 max-w-2xl">
                        <Input
                          allowClear
                          placeholder={t("tenants.filter.search_placeholder")}
                          prefix={
                            <SearchOutlined
                              style={{ color: "var(--text-muted)" }}
                            />
                          }
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full sm:flex-1"
                        />
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          {t("tenants.filter.total_filtered", {
                            total: tenants.length,
                            filtered: filteredData.length,
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          className="w-40"
                          value={status}
                          onChange={setStatus}
                          options={STATUS_OPTIONS_TRANSLATED}
                        />
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleRefresh}
                          loading={loading}>
                          {t("tenants.filter.refresh")}
                        </Button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-auto">
                      <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={filteredData}
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
                        scroll={{ x: "max-content", y: "calc(100vh - 400px)" }}
                      />
                    </div>
                  </Card>
                ),
              },
              {
                key: "requests",
                label: t("tenants.tabs.tenant_requests"),
                children: <TenantRequestList />,
              },
              {
                key: "revenue",
                label: t("tenants.tabs.system_revenue"),
                children: (
                  <div className="space-y-4">
                    {/* Filter bar for revenue */}
                    <Card
                      variant="borderless"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <Typography.Title
                            level={4}
                            style={{
                              margin: 0,
                              color: "var(--text)",
                            }}>
                            {t("tenants.revenue.title")}
                          </Typography.Title>
                          <Typography.Text
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.revenue.subtitle")}
                          </Typography.Text>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Radio.Group
                            value={activeRevenueRange}
                            onChange={(e) =>
                              setActiveRevenueRange(e.target.value)
                            }
                            options={[
                              { label: t("tenants.revenue.day"), value: "day" },
                              {
                                label: t("tenants.revenue.week"),
                                value: "week",
                              },
                              {
                                label: t("tenants.revenue.month"),
                                value: "month",
                              },
                              {
                                label: t("tenants.revenue.year"),
                                value: "year",
                              },
                            ]}
                            optionType="button"
                            buttonStyle="solid"
                          />
                          <DatePicker.RangePicker />
                        </div>
                      </div>
                    </Card>

                    {/* Chart area - reuse RevenueChart with system theme */}
                    <RevenueChart />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </main>
    </div>
  );
};

export default TenantPage;
