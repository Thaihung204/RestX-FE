"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  ShopOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Badge,
  Modal,
  Descriptions,
  Card,
  Avatar,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ITenant } from "@/lib/types/tenant";
import { tenantService } from "@/lib/services/tenantService";
import TenantPlanTag from "./TenantPlanTag";

const { Text } = Typography;

const formatDate = (isoDate: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
};

interface TenantRequestListProps {
  onRequestUpdated?: () => void;
}

export const TenantRequestList: React.FC<TenantRequestListProps> = ({
  onRequestUpdated,
}) => {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    request: ITenant | null;
  }>({
    visible: false,
    request: null,
  });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getPendingTenantRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      message.error("Failed to load tenant requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    return requests.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.businessName.toLowerCase().includes(query) ||
        item.ownerEmail.toLowerCase().includes(query) ||
        item.phoneNumber.includes(query) ||
        item.hostName.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [search, requests]);

  const handleViewDetails = (request: ITenant) => {
    setDetailModal({ visible: true, request });
  };

  const handleApprove = async (request: ITenant) => {
    modal.confirm({
      title: "Approve Tenant Request",
      content: `Are you sure you want to approve "${request.name}"? This will activate their restaurant portal at ${request.hostName}`,
      okText: "Approve",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(request.id);
          await tenantService.approveTenantRequest(request.id);
          message.success(`Tenant "${request.name}" has been approved!`);
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          console.error("Failed to approve tenant:", error);
          message.error(error?.response?.data?.message || "Failed to approve tenant");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleReject = async (request: ITenant) => {
    modal.confirm({
      title: "Reject Tenant Request",
      content: `Are you sure you want to reject "${request.name}"? This will permanently delete the request.`,
      okText: "Reject",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(request.id);
          await tenantService.rejectTenantRequest(request.id);
          message.warning(`Tenant request "${request.name}" has been rejected and deleted`);
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          console.error("Failed to reject tenant:", error);
          message.error(error?.response?.data?.message || "Failed to reject tenant");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns: ColumnsType<ITenant> = [
    {
      title: "Restaurant",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size="large"
            className="bg-[#FF380B] text-white"
          >
            {record.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium text-sm" style={{ color: "var(--text)" }}>
              {record.name}
            </div>
            <Text type="secondary" className="text-xs">
              {record.hostName}
            </Text>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Business Name",
      dataIndex: "businessName",
      key: "businessName",
      width: 180,
      render: (text) => (
        <Text type="secondary" className="text-sm">
          {text}
        </Text>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 220,
      responsive: ["lg"] as any,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <MailOutlined className="text-xs" style={{ color: "var(--text-muted)" }} />
            <Text type="secondary" className="text-xs">
              {record.ownerEmail}
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <PhoneOutlined className="text-xs" style={{ color: "var(--text-muted)" }} />
            <Text type="secondary" className="text-xs">
              {record.phoneNumber}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Address",
      key: "address",
      width: 200,
      responsive: ["md"] as any,
      render: (_, record) => (
        <div className="text-xs">
          <div>{record.addressLine1}</div>
          {record.addressLine2 && <div className="opacity-60">{record.addressLine2}</div>}
          {record.addressLine3 && <div className="opacity-60">{record.addressLine3}</div>}
        </div>
      ),
      ellipsis: true,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      width: 100,
      render: (plan) => <TenantPlanTag plan={plan} />,
      filters: [
        { text: "Basic", value: "basic" },
        { text: "Pro", value: "pro" },
        { text: "Enterprise", value: "enterprise" },
      ],
      onFilter: (value, record) => record.plan === value,
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: () => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Pending
        </Tag>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "lastActive",
      key: "lastActive",
      width: 150,
      render: (date) => (
        <Text type="secondary" className="text-xs">
          {formatDate(date)}
        </Text>
      ),
      sorter: (a, b) =>
        new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={actionLoading === record.id}
            onClick={() => handleApprove(record)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            loading={actionLoading === record.id}
            onClick={() => handleReject(record)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const pendingCount = requests.length;

  return (
    <Card
      variant="borderless"
      className="shadow-md"
      styles={{ body: { padding: 0 } }}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Filter Bar */}
      <div
        className="p-3 md:p-4 flex flex-col sm:flex-row gap-2 md:gap-3 justify-between items-stretch sm:items-center"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        <div className="flex flex-col sm:flex-row flex-1 gap-2 max-w-2xl">
          <Input
            allowClear
            placeholder="Search by name, email, phone, or hostname..."
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Badge count={pendingCount} showZero>
            <Button type="default" className="w-full sm:w-auto">
              Pending Requests
            </Button>
          </Badge>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPendingRequests}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
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
              Total {total} pending request{total !== 1 ? 's' : ''}
            </span>
          ),
          className: "px-3 md:px-4 pb-3",
          responsive: true,
          showLessItems: true,
        }}
        scroll={{ x: 1200 }}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            Tenant Request Details
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, request: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setDetailModal({ visible: false, request: null })}
          >
            Close
          </Button>,
          <Button
            key="reject"
            danger
            loading={actionLoading === detailModal.request?.id}
            onClick={() => {
              if (detailModal.request) {
                handleReject(detailModal.request);
                setDetailModal({ visible: false, request: null });
              }
            }}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={actionLoading === detailModal.request?.id}
            onClick={() => {
              if (detailModal.request) {
                handleApprove(detailModal.request);
                setDetailModal({ visible: false, request: null });
              }
            }}
          >
            Approve
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 700 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {detailModal.request && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Restaurant Name">
              {detailModal.request.name}
            </Descriptions.Item>
            <Descriptions.Item label="Hostname">
              <Text code>{detailModal.request.hostName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Business Name">
              {detailModal.request.businessName}
            </Descriptions.Item>
            <Descriptions.Item label="Owner Email">
              {detailModal.request.ownerEmail}
            </Descriptions.Item>
            <Descriptions.Item label="Restaurant Email">
              {detailModal.request.mailRestaurant}
            </Descriptions.Item>
            <Descriptions.Item label="Phone Number">
              {detailModal.request.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <div>
                <div>{detailModal.request.addressLine1}</div>
                {detailModal.request.addressLine2 && <div>{detailModal.request.addressLine2}</div>}
                {detailModal.request.addressLine3 && <div>{detailModal.request.addressLine3}</div>}
                {detailModal.request.addressLine4 && <div>{detailModal.request.addressLine4}</div>}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Plan">
              <TenantPlanTag plan={detailModal.request.plan} />
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                Pending Approval
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted At">
              {formatDate(detailModal.request.lastActive)}
            </Descriptions.Item>
};

export default TenantRequestList;
