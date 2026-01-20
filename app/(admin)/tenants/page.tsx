"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import RevenueChart from "@/components/dashboard/charts/RevenueChart";
import {
  CheckCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Input,
  Radio,
  Select,
  Statistic,
  Table,
  Tabs,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import TenantPlanTag from "../../../components/(admin)/tenants/TenantPlanTag";
import TenantStatusPill from "../../../components/(admin)/tenants/TenantStatusPill";

// --- TYPES ---
interface ITenant {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: "basic" | "pro" | "enterprise";
  status: "active" | "inactive" | "maintenance";
  lastActive: string;
}

// --- MOCK DATA ---
const MOCK_DATA: ITenant[] = [
  { id: "t-001", name: "KFC Da Nang", slug: "kfc-danang", ownerEmail: "ops.danang@kfc.com", plan: "enterprise", status: "active", lastActive: "2025-01-10T09:15:00Z" },
  { id: "t-002", name: "Pizza Hut Hanoi", slug: "pizzahut-hanoi", ownerEmail: "owner@pizzahut.vn", plan: "pro", status: "active", lastActive: "2025-01-09T14:25:00Z" },
  { id: "t-003", name: "Highlands Coffee HCMC", slug: "highlands-hcmc", ownerEmail: "franchise@highlands.vn", plan: "enterprise", status: "maintenance", lastActive: "2025-01-08T05:45:00Z" },
  { id: "t-004", name: "Jollibee Hue", slug: "jollibee-hue", ownerEmail: "contact@jollibee.vn", plan: "basic", status: "inactive", lastActive: "2024-12-20T11:00:00Z" },
  { id: "t-005", name: "Lotteria Da Lat", slug: "lotteria-dalat", ownerEmail: "dalat@lotteria.vn", plan: "pro", status: "active", lastActive: "2025-01-07T07:10:00Z" },
  { id: "t-006", name: "Starbucks District 1", slug: "starbucks-d1", ownerEmail: "d1@starbucks.vn", plan: "enterprise", status: "active", lastActive: "2025-01-11T10:00:00Z" },
  { id: "t-007", name: "TocoToco Hai Phong", slug: "tocotoco-haiphong", ownerEmail: "hp@tocotoco.vn", plan: "basic", status: "inactive", lastActive: "2024-12-18T16:30:00Z" },
  { id: "t-008", name: "The Coffee House Nha Trang", slug: "tch-nhatrang", ownerEmail: "nhatrang@coffeehouse.vn", plan: "pro", status: "maintenance", lastActive: "2025-01-05T12:05:00Z" },
  { id: "t-009", name: "Phuc Long Thu Duc", slug: "phuclong-thuduc", ownerEmail: "thuduc@phuclong.vn", plan: "pro", status: "active", lastActive: "2025-01-10T21:40:00Z" },
  { id: "t-010", name: "Texas Chicken Da Nang", slug: "texas-danang", ownerEmail: "texas.dn@texaschicken.vn", plan: "basic", status: "active", lastActive: "2025-01-06T09:55:00Z" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Maintenance", value: "maintenance" },
];

// --- HELPER COMPONENTS ---

// Dark Mode Status Pill
const StatusPill = ({ status }: { status: ITenant["status"] }) => {
  // Using rgba colors for better dark mode blending
  const config = {
    active: { color: "text-emerald-400", bg: "bg-emerald-900/30", border: "border-emerald-800/50", text: "Active", dot: "bg-emerald-500" },
    inactive: { color: "text-rose-400", bg: "bg-rose-900/30", border: "border-rose-800/50", text: "Inactive", dot: "bg-rose-500" },
    maintenance: { color: "text-orange-400", bg: "bg-orange-900/30", border: "border-orange-800/50", text: "Maintenance", dot: "bg-orange-500" },
  };
  const style = config[status];

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${style.bg} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${style.dot}`} />
      <span className={`text-xs font-medium ${style.color}`}>{style.text}</span>
    </div>
  );
};

const formatDate = (isoDate: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
};

// --- MAIN PAGE COMPONENT ---

const TenantPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [activeRevenueRange, setActiveRevenueRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    return MOCK_DATA.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.ownerEmail.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [search, status]);

  const stats = useMemo(() => {
    return {
        total: MOCK_DATA.length,
        active: MOCK_DATA.filter(t => t.status === 'active').length,
        maintenance: MOCK_DATA.filter(t => t.status === 'maintenance').length
    }
  }, []);

  const handleRefresh = () => {
    message.success("Refreshed successfully");
  };

  const menuItems: MenuProps["items"] = [
    { key: "view", label: "View Details" },
    { key: "domain", label: "Configure Domain" },
    { type: "divider" },
    { key: "suspend", label: <span className="text-red-500">Suspend Tenant</span> },
  ];

  const columns: ColumnsType<ITenant> = [
    {
      title: "Tenant Name",
      dataIndex: "name",
      key: "tenant",
      width: 300,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size="large"
            className="shadow-sm rounded-lg bg-orange-600 text-white"
          >
            {record.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--text)" }}
            >
              {record.name}
            </span>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {record.slug}.restx.food
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan: ITenant["plan"]) => <TenantPlanTag plan={plan} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: ITenant["status"]) => (
        <TenantStatusPill status={value} />
      ),
    },
    {
      title: "Owner Info",
      dataIndex: "ownerEmail",
      key: "ownerEmail",
      render: (email) => (
        <span
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {email}
        </span>
      ),
    },
    {
      title: "Last Active",
      dataIndex: "lastActive",
      key: "lastActive",
      render: (value: string) => (
        <span
          className="text-sm font-variant-numeric tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {formatDate(value)}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            icon={<MoreOutlined style={{ color: "var(--text-muted)" }} />}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top header + theme toggle */}
          <div className="flex items-start justify-between gap-4">
            {/* Header Section - Admin Tenants */}
            <div>
              <Breadcrumb
                items={[{ title: "Admin" }, { title: "Tenants" }]}
                className="text-xs font-medium mb-1"
              />
              <Typography.Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "var(--text)",
                }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  Tenant Management
                </span>
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}
              >
                Manage restaurants in the RestX system, track tenant count and total system revenue.
              </Typography.Paragraph>
            </div>

            {/* Theme toggle + create button */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/tenants/create">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="shadow-orange-900/20 shadow-lg border-none"
                >
                  Add Tenant
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
              }}
            >
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Total Tenants
                  </span>
                }
                value={stats.total}
                prefix={<ShopOutlined style={{ color: "#f97316" }} />}
                valueStyle={{ color: "var(--text)" }}
              />
            </Card>

            <Card
              variant="borderless"
              className="shadow-md"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Active Tenants
                  </span>
                }
                value={stats.active}
                valueStyle={{ color: "#34d399" }}
                prefix={<CheckCircleOutlined style={{ color: "#34d399" }} />}
              />
            </Card>

            <Card
              variant="borderless"
              className="shadow-md"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <Statistic
                title={
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Monthly Revenue (mock)
                  </span>
                }
                value={125_000_000}
                precision={0}
                prefix={
                  <RiseOutlined
                    style={{ color: "#60a5fa", marginRight: 4 }}
                  />
                }
                valueStyle={{ color: "#60a5fa" }}
                suffix="₫"
              />
            </Card>
          </div>

          {/* Tabs: Tenant list & System revenue */}
          <Tabs
            defaultActiveKey="tenants"
            items={[
              {
                key: "tenants",
                label: "Restaurant List (Tenants)",
                children: (
                  <Card
                    variant="borderless"
                    className="shadow-md overflow-hidden"
                    bodyStyle={{ padding: 0 }}
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Filter Bar */}
                    <div
                      className="p-5 flex flex-col md:flex-row gap-4 justify-between"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    >
                      <div className="flex flex-1 gap-3 max-w-2xl">
                        <Input
                          size="large"
                          allowClear
                          placeholder="Search by name, slug, email..."
                          prefix={
                            <SearchOutlined
                              style={{ color: "var(--text-muted)" }}
                            />
                          }
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <Select
                          size="large"
                          className="w-48"
                          value={status}
                          onChange={setStatus}
                          options={STATUS_OPTIONS}
                        />
                      </div>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        size="large"
                        type="text"
                      >
                        Refresh
                      </Button>
                    </div>

                    {/* Table */}
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={filteredData}
                      pagination={{
                        pageSize: 8,
                        showTotal: (total) => (
                          <span style={{ color: "var(--text-muted)" }}>
                            Total {total} tenants
                          </span>
                        ),
                        className: "px-5 pb-4",
                      }}
                    />
                  </Card>
                ),
              },
              {
                key: "revenue",
                label: "System Revenue",
                children: (
                  <div className="space-y-4">
                    {/* Filter bar for revenue */}
                    <Card
                      variant="borderless"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <Typography.Title
                            level={4}
                            style={{
                              margin: 0,
                              color: "var(--text)",
                            }}
                          >
                            Total System Revenue
                          </Typography.Title>
                          <Typography.Text
                            style={{ color: "var(--text-muted)" }}
                          >
                            View revenue trends by day / week / month / year.
                          </Typography.Text>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Radio.Group
                            value={activeRevenueRange}
                            onChange={(e) =>
                              setActiveRevenueRange(e.target.value)
                            }
                            options={[
                              { label: "Day", value: "day" },
                              { label: "Week", value: "week" },
                              { label: "Month", value: "month" },
                              { label: "Year", value: "year" },
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