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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITenantRequest, TenantRequestStatus } from "@/lib/types/tenant";
import TenantPlanTag from "./TenantPlanTag";

const { Text } = Typography;

// Mock data - sẽ thay thế bằng API call sau
const MOCK_REQUESTS: ITenantRequest[] = [
  {
    id: "req-001",
    businessName: "Phở Hà Nội 24",
    contactPersonName: "Nguyễn Văn A",
    businessEmail: "contact@phohanoi24.com",
    businessPhone: "+84 901 234 567",
    businessAddress: "123 Phố Huế, Hai Bà Trưng, Hà Nội",
    requestedPlan: "pro",
    status: "pending",
    submittedAt: "2026-02-10T14:30:00Z",
    notes: "Cần tư vấn về gói Enterprise",
  },
  {
    id: "req-002",
    businessName: "Bún Chả Obama",
    contactPersonName: "Trần Thị B",
    businessEmail: "admin@bunchaobama.vn",
    businessPhone: "+84 912 345 678",
    businessAddress: "456 Lê Văn Hưu, Hai Bà Trưng, Hà Nội",
    requestedPlan: "basic",
    status: "approved",
    submittedAt: "2026-02-08T10:15:00Z",
    approvedAt: "2026-02-09T09:00:00Z",
    approvedBy: "Admin User",
    createdTenantId: "tenant-123",
  },
  {
    id: "req-003",
    businessName: "Cơm Tấm Sài Gòn",
    contactPersonName: "Lê Văn C",
    businessEmail: "info@comtamsaigon.com",
    businessPhone: "+84 923 456 789",
    businessAddress: "789 Nguyễn Trãi, Quận 1, TP.HCM",
    requestedPlan: "enterprise",
    status: "rejected",
    submittedAt: "2026-02-05T16:45:00Z",
    approvedAt: "2026-02-06T11:20:00Z",
    approvedBy: "Admin User",
    rejectionReason: "Thông tin doanh nghiệp chưa đầy đủ",
  },
  {
    id: "req-004",
    businessName: "Bánh Mì Phượng",
    contactPersonName: "Phạm Thị D",
    businessEmail: "contact@banhmiphuong.vn",
    businessPhone: "+84 934 567 890",
    businessAddress: "321 Đường Số 1, Quận 2, TP.HCM",
    requestedPlan: "pro",
    status: "pending",
    submittedAt: "2026-02-12T08:20:00Z",
  },
  {
    id: "req-005",
    businessName: "Lẩu Thái Bà Rịa",
    contactPersonName: "Hoàng Văn E",
    businessEmail: "admin@lauthaibaira.com",
    businessPhone: "+84 945 678 901",
    businessAddress: "654 Lê Lợi, Bà Rịa, Vũng Tàu",
    requestedPlan: "basic",
    status: "pending",
    submittedAt: "2026-02-13T13:10:00Z",
    notes: "Muốn mở chuỗi 3 chi nhánh",
  },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const TenantRequestStatusTag = ({ status, t }: { status: TenantRequestStatus; t: any }) => {
  const config = {
    pending: {
      color: "warning",
      icon: <ClockCircleOutlined />,
      text: t('tenant_requests.list.status_pending'),
    },
    approved: {
      color: "success",
      icon: <CheckCircleOutlined />,
      text: t('tenant_requests.list.status_approved'),
    },
    rejected: {
      color: "error",
      icon: <CloseCircleOutlined />,
      text: t('tenant_requests.list.status_rejected'),
    },
  };

  const { color, icon, text } = config[status];

  return (
    <Tag color={color} icon={icon}>
      {text}
    </Tag>
  );
};

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
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string, reason: string) => void;
}

export const TenantRequestList: React.FC<TenantRequestListProps> = ({
  onApprove,
  onReject,
}) => {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    request: ITenantRequest | null;
  }>({
    visible: false,
    request: null,
  });

  const STATUS_OPTIONS_TRANSLATED = useMemo(() => [
    { label: t('tenant_requests.list.filter_all'), value: "all" },
    { label: t('tenant_requests.list.filter_pending'), value: "pending" },
    { label: t('tenant_requests.list.filter_approved'), value: "approved" },
    { label: t('tenant_requests.list.filter_rejected'), value: "rejected" },
  ], [t]);

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    return MOCK_REQUESTS.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const matchesSearch =
        !query ||
        item.businessName.toLowerCase().includes(query) ||
        item.contactPersonName.toLowerCase().includes(query) ||
        item.businessEmail.toLowerCase().includes(query) ||
        item.businessPhone.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter]);

  const handleViewDetails = (request: ITenantRequest) => {
    setDetailModal({ visible: true, request });
  };

  const handleApprove = (request: ITenantRequest) => {
    modal.confirm({
      title: t('tenant_requests.list.approve_confirm_title'),
      content: t('tenant_requests.list.approve_confirm_message'),
      okText: t('tenant_requests.list.approve_confirm_ok'),
      okType: "primary",
      cancelText: t('tenant_requests.list.approve_confirm_cancel'),
      onOk: () => {
        message.success(t('tenant_requests.list.approve_success'));
        // onApprove?.(request.id);
      },
    });
  };

  const handleReject = (request: ITenantRequest) => {
    let rejectionReason = "";
    modal.confirm({
      title: t('tenant_requests.list.reject_confirm_title'),
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            {t('tenant_requests.list.reject_confirm_message')}
          </p>
          <Input.TextArea
            rows={3}
            placeholder={t('tenant_requests.list.detail_rejection_reason')}
            onChange={(e) => (rejectionReason = e.target.value)}
          />
        </div>
      ),
      okText: t('tenant_requests.list.reject_confirm_ok'),
      okType: "danger",
      cancelText: t('tenant_requests.list.reject_confirm_cancel'),
      onOk: () => {
        message.warning(t('tenant_requests.list.reject_success'));
        // onReject?.(request.id, rejectionReason);
      },
    });
  };

  const columns: ColumnsType<ITenantRequest> = [
    {
      title: t('tenant_requests.list.column_business_name'),
      dataIndex: "businessName",
      key: "businessName",
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium text-sm" style={{ color: "var(--text)" }}>
            {text}
          </div>
          <Text type="secondary" className="text-xs">
            {record.contactPersonName}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.businessName.localeCompare(b.businessName),
    },
    {
      title: t('tenant_requests.list.column_contact_info'),
      key: "contact",
      responsive: ["lg"] as any,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <MailOutlined className="text-xs" style={{ color: "var(--text-muted)" }} />
            <Text type="secondary" className="text-xs">
              {record.businessEmail}
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <PhoneOutlined className="text-xs" style={{ color: "var(--text-muted)" }} />
            <Text type="secondary" className="text-xs">
              {record.businessPhone}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t('tenant_requests.list.column_address'),
      dataIndex: "businessAddress",
      key: "businessAddress",
      render: (text) => (
        <Text type="secondary" className="text-xs">
          {text}
        </Text>
      ),
      ellipsis: true,
      responsive: ["md"] as any,
    },
    {
      title: t('tenant_requests.list.column_plan'),
      dataIndex: "requestedPlan",
      key: "requestedPlan",
      render: (plan) => <TenantPlanTag plan={plan} />,
      filters: [
        { text: "Basic", value: "basic" },
        { text: "Pro", value: "pro" },
        { text: "Enterprise", value: "enterprise" },
      ],
      onFilter: (value, record) => record.requestedPlan === value,
    },
    {
      title: t('tenant_requests.list.column_status'),
      dataIndex: "status",
      key: "status",
      render: (status) => <TenantRequestStatusTag status={status} t={t} />,
      filters: STATUS_OPTIONS.slice(1).map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('tenant_requests.list.column_submitted'),
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (date) => (
        <Text type="secondary" className="text-xs">
          {formatDate(date)}
        </Text>
      ),
      sorter: (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: t('tenant_requests.list.column_actions'),
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            {t('tenant_requests.list.action_view')}
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => handleApprove(record)}
                style={{ color: "var(--success)" }}
              >
                {t('tenant_requests.list.action_approve')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleReject(record)}
              >
                {t('tenant_requests.list.action_reject')}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = MOCK_REQUESTS.filter((r) => r.status === "pending").length;

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
            placeholder={t('tenant_requests.list.column_business_name')}
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Select
            className="w-full sm:w-40"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS_TRANSLATED}
          />
        </div>
        <Badge count={pendingCount} showZero>
          <Button type="default" className="w-full sm:w-auto">
            {t('tenant_requests.list.pending_requests')}
          </Button>
        </Badge>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
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
              {t('tenant_requests.list.total_requests', { count: total })}
            </span>
          ),
          className: "px-3 md:px-4 pb-3",
          responsive: true,
          showLessItems: true,
        }}
        scroll={{ x: 1000 }}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {t('tenant_requests.list.detail_modal_title')}
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, request: null })}
        footer={
          detailModal.request?.status === "pending"
            ? [
                <Button
                  key="reject"
                  danger
                  onClick={() => {
                    if (detailModal.request) {
                      handleReject(detailModal.request);
                      setDetailModal({ visible: false, request: null });
                    }
                  }}
                >
                  {t('tenant_requests.list.action_reject')}
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  onClick={() => {
                    if (detailModal.request) {
                      handleApprove(detailModal.request);
                      setDetailModal({ visible: false, request: null });
                    }
                  }}
                >
                  {t('tenant_requests.list.action_approve')}
                </Button>,
              ]
            : [
                <Button
                  key="close"
                  onClick={() => setDetailModal({ visible: false, request: null })}
                >
                  {t('tenant_requests.list.detail_close')}
                </Button>,
              ]
        }
        width="90%"
        style={{ maxWidth: 700 }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {detailModal.request && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('tenant_requests.list.detail_business_name')}>
              {detailModal.request.businessName}
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_contact_person')}>
              {detailModal.request.contactPersonName}
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_business_email')}>
              {detailModal.request.businessEmail}
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_phone')}>
              {detailModal.request.businessPhone}
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_address')}>
              {detailModal.request.businessAddress}
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_plan')}>
              <TenantPlanTag plan={detailModal.request.requestedPlan} />
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_status')}>
              <TenantRequestStatusTag status={detailModal.request.status} t={t} />
            </Descriptions.Item>
            <Descriptions.Item label={t('tenant_requests.list.detail_submitted')}>
              {formatDate(detailModal.request.submittedAt)}
            </Descriptions.Item>
            {detailModal.request.approvedAt && (
              <Descriptions.Item label={t('tenant_requests.list.detail_approved_at')}>
                {formatDate(detailModal.request.approvedAt)}
              </Descriptions.Item>
            )}
            {detailModal.request.approvedBy && (
              <Descriptions.Item label={t('tenant_requests.list.detail_approved_by')}>
                {detailModal.request.approvedBy}
              </Descriptions.Item>
            )}
            {detailModal.request.rejectionReason && (
              <Descriptions.Item label={t('tenant_requests.list.detail_rejection_reason')}>
                <Text type="danger">{detailModal.request.rejectionReason}</Text>
              </Descriptions.Item>
            )}
            {detailModal.request.notes && (
              <Descriptions.Item label={t('tenant_requests.list.detail_notes')}>
                {detailModal.request.notes}
              </Descriptions.Item>
            )}
            {detailModal.request.createdTenantId && (
              <Descriptions.Item label="Created Tenant ID">
                <Text code>{detailModal.request.createdTenantId}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default TenantRequestList;
