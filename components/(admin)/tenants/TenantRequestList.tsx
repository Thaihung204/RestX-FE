"use client";

import { tenantService } from "@/lib/services/tenantService";
import { ITenantRequest, TenantRequestStatus } from "@/lib/types/tenant";
import {
  CheckCircleOutlined,
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
      message.error(t("tenant_requests.list.load_error"));
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
        (item.businessPrimaryPhone &&
          item.businessPrimaryPhone.includes(query)) ||
        (item.businessEmailAddress &&
          item.businessEmailAddress.toLowerCase().includes(query)) ||
        (item.businessAddressLine1 &&
          item.businessAddressLine1.toLowerCase().includes(query)) ||
        (item.businessAddressLine2 &&
          item.businessAddressLine2.toLowerCase().includes(query)) ||
        (item.businessAddressLine3 &&
          item.businessAddressLine3.toLowerCase().includes(query)) ||
        (item.businessAddressLine4 &&
          item.businessAddressLine4.toLowerCase().includes(query)) ||
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
      title: t("tenant_requests.list.approve_confirm_title"),
      content: t("tenant_requests.list.approve_confirm_message", {
        name: request.name,
        hostname: request.hostname,
      }),
      okText: t("tenant_requests.list.approve_confirm_ok"),
      okType: "primary",
      cancelText: t("tenant_requests.list.approve_confirm_cancel"),
      onOk: async () => {
        try {
          if (!request.id) {
            message.error(t("tenant_requests.list.invalid_id"));
            return;
          }
          setActionLoading(request.id);
          const tenantId = await tenantService.acceptTenantRequest(request.id);
          message.success(
            t("tenant_requests.list.approve_success", {
              name: request.name,
              id: tenantId,
            }),
          );
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            t("tenant_requests.list.approve_error");
          message.error(errorMessage);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleReject = async (request: ITenantRequest) => {
    modal.confirm({
      title: t("tenant_requests.list.reject_confirm_title"),
      content: t("tenant_requests.list.reject_confirm_message", {
        name: request.name,
      }),
      okText: t("tenant_requests.list.reject_confirm_ok"),
      okType: "danger",
      cancelText: t("tenant_requests.list.reject_confirm_cancel"),
      onOk: async () => {
        try {
          if (!request.id) {
            message.error(t("tenant_requests.list.invalid_id"));
            return;
          }
          setActionLoading(request.id);
          await tenantService.declineTenantRequest(request.id);
          message.success(
            t("tenant_requests.list.reject_success", { name: request.name }),
          );
          await fetchPendingRequests();
          onRequestUpdated?.();
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            t("tenant_requests.list.reject_error");
          message.error(errorMessage);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns: ColumnsType<ITenantRequest> = [
    {
      title: t("tenants.table.tenant_info"),
      dataIndex: "name",
      key: "name",
      width: 280,
      fixed: "left",
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
              {record.businessName || "-"}
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
            <PhoneOutlined className="mr-1" />
            {record.businessPrimaryPhone || "-"}
          </span>
          <span
            className="text-[11px] truncate max-w-[200px]"
            style={{ color: "var(--text-muted)" }}
            title={record.businessEmailAddress || ""}>
            <MailOutlined className="mr-1" />
            {record.businessEmailAddress || "-"}
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
            {record.businessAddressLine1 || "-"} {record.businessAddressLine2 || ""}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {record.businessAddressLine3 || ""}{record.businessAddressLine3 && record.businessAddressLine4 ? ", " : ""}{record.businessAddressLine4 || ""}
          </span>
        </div>
      ),
    },
    {
      title: t("tenants.table.hostname"),
      dataIndex: "hostname",
      key: "hostname",
      width: 200,
      render: (hostname: string) => (
        <span
          className="text-[11px] font-mono truncate max-w-[180px] block"
          style={{ color: "var(--text-muted)" }}
          title={hostname}>
          {hostname}
        </span>
      ),
    },
    {
      title: t("tenant_requests.list.column_actions"),
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 w-full items-start">
          <div className="flex items-start justify-center">
            <Button
              type="text"
              shape="circle"
              icon={<EyeOutlined style={{ color: "var(--text-muted)" }} />}
              onClick={() => handleViewDetails(record)}
              title={t("tenant_requests.list.action_view")}
              aria-label={t("tenant_requests.list.action_view")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={actionLoading === record.id}
              onClick={() => handleApprove(record)}
              className="w-full justify-center">
              {t("tenant_requests.list.action_approve")}
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              loading={actionLoading === record.id}
              onClick={() => handleReject(record)}
              className="w-full justify-center">
              {t("tenant_requests.list.action_reject")}
            </Button>
          </div>
        </div>
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
            {t("tenant_requests.list.detail_modal_title")}
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, request: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setDetailModal({ visible: false, request: null })}>
            {t("tenant_requests.list.detail_close")}
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
            {t("tenant_requests.list.action_reject")}
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
            {t("tenant_requests.list.action_approve")}
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 700 }}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
        {detailModal.request && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item
              label={t("tenant_requests.list.detail_restaurant_name")}>
              {detailModal.request.name}
            </Descriptions.Item>
            <Descriptions.Item label={t("tenant_requests.list.detail_hostname")}>
              <Text code>{detailModal.request.hostname}</Text>
            </Descriptions.Item>
            {detailModal.request.businessName && (
              <Descriptions.Item
                label={t("tenant_requests.list.detail_business_name")}>
                {detailModal.request.businessName}
              </Descriptions.Item>
            )}
            {detailModal.request.businessEmailAddress && (
              <Descriptions.Item
                label={t("tenant_requests.list.detail_business_email")}>
                {detailModal.request.businessEmailAddress}
              </Descriptions.Item>
            )}
            {detailModal.request.businessPrimaryPhone && (
              <Descriptions.Item
                label={t("tenant_requests.list.detail_phone")}>
                {detailModal.request.businessPrimaryPhone}
              </Descriptions.Item>
            )}
            {(detailModal.request.businessAddressLine1 ||
              detailModal.request.businessAddressLine2 ||
              detailModal.request.businessAddressLine3 ||
              detailModal.request.businessAddressLine4) && (
              <Descriptions.Item
                label={t("tenant_requests.list.detail_address")}>
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
              <Descriptions.Item label={t("tenant_requests.list.detail_country")}>
                {detailModal.request.businessCountry}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t("tenant_requests.list.detail_status")}>
              <Tag color="orange" icon={<CheckCircleOutlined />}>
                {t("tenant_requests.list.status_pending_approval")}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default TenantRequestList;
