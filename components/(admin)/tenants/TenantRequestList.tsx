"use client";

import { tenantService } from "@/lib/services/tenantService";
import { ITenantRequest, TenantRequestStatus } from "@/lib/types/tenant";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface TenantRequestListProps {
  onRequestUpdated?: () => void;
}

export const TenantRequestList: React.FC<TenantRequestListProps> = ({
  onRequestUpdated,
}) => {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<ITenantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    request: ITenantRequest | null;
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
      const data = await tenantService.getAllTenantRequests();

      const pendingRequests = data.filter((req) => {
        const status = req.tenantRequestStatus;

        const isPending =
          status === "Pending" ||
          status === TenantRequestStatus.Pending ||
          status === undefined;

        return isPending;
      });

      setRequests(pendingRequests);
    } catch (error) {
      message.error("Failed to load tenant requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = requests.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.businessName &&
          item.businessName.toLowerCase().includes(query)) ||
        (item.businessEmailAddress &&
          item.businessEmailAddress.toLowerCase().includes(query)) ||
        (item.businessPrimaryPhone &&
          item.businessPrimaryPhone.includes(query)) ||
        item.hostname.toLowerCase().includes(query);
      return matchesSearch;
    });

    return filtered;
  }, [search, requests]);

  const handleViewDetails = (request: ITenantRequest) => {
    setDetailModal({ visible: true, request });
  };

  const handleApprove = async (request: ITenantRequest) => {
    modal.confirm({
      title: "Approve Tenant Request",
      content: `Are you sure you want to approve "${request.name}"? This will create a new tenant with hostname ${request.hostname}`,
      okText: "Approve",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          if (!request.id) {
            message.error("Invalid request ID");
            return;
          }
          setActionLoading(request.id);
          const tenantId = await tenantService.acceptTenantRequest(request.id);
          message.success(
            `Tenant "${request.name}" has been approved! Tenant ID: ${tenantId}`,
          );
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          message.error(
            error?.response?.data?.message || "Failed to approve tenant",
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleReject = async (request: ITenantRequest) => {
    modal.confirm({
      title: "Reject Tenant Request",
      content: `Are you sure you want to reject "${request.name}"? This will mark the request as denied.`,
      okText: "Reject",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          if (!request.id) {
            message.error("Invalid request ID");
            return;
          }
          setActionLoading(request.id);
          await tenantService.declineTenantRequest(request.id);
          message.warning(`Tenant request "${request.name}" has been rejected`);
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          message.error(
            error?.response?.data?.message || "Failed to reject tenant",
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns: ColumnsType<ITenantRequest> = [
    {
      title: t("tenant_requests.list.column_restaurant"),
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size="large"
            className="bg-[#FF380B] text-white">
            {record.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <div
              className="font-medium text-sm"
              style={{ color: "var(--text)" }}>
              {record.name}
            </div>
            <Text type="secondary" className="text-xs">
              {record.hostname}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: t("tenant_requests.list.column_business_name"),
      dataIndex: "businessName",
      key: "businessName",
      width: 150,
      responsive: ["xl"] as any,
      render: (text) => (
        <Text type="secondary" className="text-sm">
          {text || "-"}
        </Text>
      ),
    },
    {
      title: t("tenant_requests.list.column_contact"),
      key: "contact",
      width: 200,
      responsive: ["lg"] as any,
      render: (_, record) => (
        <div className="space-y-1">
          {record.businessEmailAddress && (
            <div className="flex items-center gap-1">
              <MailOutlined
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              />
              <Text type="secondary" className="text-xs truncate max-w-[180px]">
                {record.businessEmailAddress}
              </Text>
            </div>
          )}
          {record.businessPrimaryPhone && (
            <div className="flex items-center gap-1">
              <PhoneOutlined
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              />
              <Text type="secondary" className="text-xs">
                {record.businessPrimaryPhone}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: t("tenant_requests.list.column_address"),
      key: "address",
      width: 180,
      responsive: ["xl"] as any,
      render: (_, record) => (
        <div className="text-xs">
          {record.businessAddressLine1 && (
            <div className="truncate">{record.businessAddressLine1}</div>
          )}
          {record.businessAddressLine2 && (
            <div className="opacity-60 truncate">
              {record.businessAddressLine2}
            </div>
          )}
          {record.businessAddressLine3 && (
            <div className="opacity-60 truncate">
              {record.businessAddressLine3}
            </div>
          )}
          {!record.businessAddressLine1 && <Text type="secondary">-</Text>}
        </div>
      ),
      ellipsis: true,
    },
    {
      title: t("tenant_requests.list.column_status"),
      key: "status",
      width: 110,
      render: () => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Pending
        </Tag>
      ),
    },
    {
      title: t("tenant_requests.list.column_actions"),
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}>
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={actionLoading === record.id}
            onClick={() => handleApprove(record)}>
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            loading={actionLoading === record.id}
            onClick={() => handleReject(record)}>
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
      className="shadow-md overflow-hidden"
      styles={{ body: { padding: 0 } }}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        maxWidth: "100%",
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
            placeholder={t("tenant_requests.list.search_placeholder")}
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1"
          />
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("tenant_requests.list.total_filtered", { total: requests.length, filtered: filteredData.length })}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge count={pendingCount} showZero>
            <Button type="default" className="w-full sm:w-auto">
              {t("tenant_requests.list.pending_requests")}
            </Button>
          </Badge>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPendingRequests}
            loading={loading}>
            {t("tenant_requests.list.refresh")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => record.id || record.hostname || record.name}
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
          locale={{
            emptyText: (
              <div style={{ padding: "40px", color: "var(--text-muted)" }}>
                <div>{t("tenant_requests.list.no_data")}</div>
                <div style={{ fontSize: "12px", marginTop: "8px" }}>
                  Debug: {t("tenant_requests.list.total_filtered", { total: requests.length, filtered: filteredData.length })}
                </div>
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => (
              <span style={{ color: "var(--text-muted)" }}>
                {t("tenant_requests.list.total_requests", { count: total })}
              </span>
            ),
            className: "px-3 md:px-4 pb-3",
            responsive: true,
            showLessItems: true,
          }}
          scroll={{ x: "max-content", y: "calc(100vh - 400px)" }}
        />
      </div>

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
            onClick={() => setDetailModal({ visible: false, request: null })}>
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
            }}>
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
            }}>
            Approve
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 700 }}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
        {detailModal.request && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Restaurant Name">
              {detailModal.request.name}
            </Descriptions.Item>
            <Descriptions.Item label="Hostname">
              <Text code>{detailModal.request.hostname}</Text>
            </Descriptions.Item>
            {detailModal.request.businessName && (
              <Descriptions.Item label="Business Name">
                {detailModal.request.businessName}
              </Descriptions.Item>
            )}
            {detailModal.request.businessEmailAddress && (
              <Descriptions.Item label="Business Email">
                {detailModal.request.businessEmailAddress}
              </Descriptions.Item>
            )}
            {detailModal.request.businessPrimaryPhone && (
              <Descriptions.Item label="Phone Number">
                {detailModal.request.businessPrimaryPhone}
              </Descriptions.Item>
            )}
            {(detailModal.request.businessAddressLine1 ||
              detailModal.request.businessAddressLine2 ||
              detailModal.request.businessAddressLine3 ||
              detailModal.request.businessAddressLine4) && (
              <Descriptions.Item label="Address">
                <div>
                  {detailModal.request.businessAddressLine1 && (
                    <div>{detailModal.request.businessAddressLine1}</div>
                  )}
                  {detailModal.request.businessAddressLine2 && (
                    <div>{detailModal.request.businessAddressLine2}</div>
                  )}
                  {detailModal.request.businessAddressLine3 && (
                    <div>{detailModal.request.businessAddressLine3}</div>
                  )}
                  {detailModal.request.businessAddressLine4 && (
                    <div>{detailModal.request.businessAddressLine4}</div>
                  )}
                </div>
              </Descriptions.Item>
            )}
            {detailModal.request.businessCountry && (
              <Descriptions.Item label="Country">
                {detailModal.request.businessCountry}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                Pending Approval
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default TenantRequestList;
