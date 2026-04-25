"use client";

import { tenantService } from "@/lib/services/tenantService";
import { ITenantRequest, TenantRequestStatus } from "@/lib/types/tenant";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Input,
  Modal,
  Spin,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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

  const pendingCount = requests.length;

  const buildAddress = (req: ITenantRequest) => {
    const parts = [
      req.businessAddressLine1,
      req.businessAddressLine2,
      req.businessAddressLine3,
      req.businessAddressLine4,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const req = detailModal.request;

  return (
    <div className="tr-shell">
      {/* ── Filter Bar ── */}
      <div className="tr-filter-bar">
        <div className="tr-filter-left">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tr-search-input"
            placeholder={t("tenant_requests.list.search_placeholder")}
          />
          <span className="tr-filter-summary">
            {t("tenant_requests.list.total_filtered", {
              total: requests.length,
              filtered: filteredData.length,
            })}
          </span>
        </div>
        <div className="tr-filter-right">
          <Badge count={pendingCount} showZero>
            <Button type="default" className="tr-pending-btn">
              {t("tenant_requests.list.pending_requests")}
            </Button>
          </Badge>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPendingRequests}
            loading={loading}
            className="tr-refresh-btn">
            {t("tenant_requests.list.refresh")}
          </Button>
        </div>
      </div>

      {/* ── Request Cards ── */}
      <Spin spinning={loading}>
        {filteredData.length === 0 && !loading ? (
          <div className="tr-empty">
            <div className="tr-empty-icon">
              <GlobalOutlined />
            </div>
            <p className="tr-empty-title">{t("tenant_requests.list.no_data")}</p>
            <p className="tr-empty-desc">{t("tenant_requests.list.no_data_desc")}</p>
          </div>
        ) : (
          <div className="tr-card-list">
            {filteredData.map((record) => (
              <div
                key={record.id || record.hostname || record.name}
                className="tr-card">
                <div className="tr-card-accent" />
                <div className="tr-card-body">
                  {/* Identity */}
                  <div className="tr-card-identity">
                    <div className="tr-card-avatar">
                      {record.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="tr-card-name-wrap">
                      <span className="tr-card-name">{record.name}</span>
                      <span className="tr-card-biz">{record.businessName || "-"}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="tr-card-contact">
                    <span className="tr-card-contact-item">
                      <PhoneOutlined />
                      {record.businessPrimaryPhone || "-"}
                    </span>
                    <span className="tr-card-contact-item" title={record.businessEmailAddress || ""}>
                      <MailOutlined />
                      {record.businessEmailAddress || "-"}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="tr-card-address">
                    <EnvironmentOutlined />
                    <span>{buildAddress(record) || "-"}</span>
                  </div>

                  {/* Domain */}
                  <div className="tr-card-domain">
                    <span className="tr-domain-badge">{record.hostname}</span>
                  </div>

                  {/* Actions */}
                  <div className="tr-card-actions">
                    <button
                      className="tr-action-view"
                      onClick={() => handleViewDetails(record)}
                      title={t("tenant_requests.list.action_view")}>
                      <EyeOutlined />
                    </button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      loading={actionLoading === record.id}
                      onClick={() => handleApprove(record)}
                      className="tr-action-approve">
                      {t("tenant_requests.list.action_approve")}
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseCircleOutlined />}
                      loading={actionLoading === record.id}
                      onClick={() => handleReject(record)}
                      className="tr-action-reject">
                      {t("tenant_requests.list.action_reject")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {/* ── Detail Modal ── */}
      <Modal
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, request: null })}
        centered
        width={560}
        rootClassName="tr-detail-modal"
        title={null}
        footer={null}
        styles={{
          mask: { backdropFilter: "blur(10px)", background: "var(--modal-overlay)" },
        }}>
        {req && (
          <div className="tr-modal-inner">
            {/* Modal Header */}
            <div className="tr-modal-header">
              <div className="tr-modal-avatar">
                {req.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="tr-modal-name">{req.name}</h2>
                <span className="tr-modal-status-badge">
                  <CheckCircleOutlined />
                  {t("tenant_requests.list.status_pending_approval")}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="tr-modal-fields">
              <div className="tr-modal-field">
                <span className="tr-modal-label">{t("tenant_requests.list.detail_restaurant_name")}</span>
                <span className="tr-modal-value">{req.name}</span>
              </div>
              <div className="tr-modal-field">
                <span className="tr-modal-label">{t("tenant_requests.list.detail_hostname")}</span>
                <span className="tr-modal-value tr-modal-value-mono">{req.hostname}</span>
              </div>
              {req.businessName && (
                <div className="tr-modal-field">
                  <span className="tr-modal-label">{t("tenant_requests.list.detail_business_name")}</span>
                  <span className="tr-modal-value">{req.businessName}</span>
                </div>
              )}
              {req.businessEmailAddress && (
                <div className="tr-modal-field">
                  <span className="tr-modal-label">{t("tenant_requests.list.detail_business_email")}</span>
                  <span className="tr-modal-value">{req.businessEmailAddress}</span>
                </div>
              )}
              {req.businessPrimaryPhone && (
                <div className="tr-modal-field">
                  <span className="tr-modal-label">{t("tenant_requests.list.detail_phone")}</span>
                  <span className="tr-modal-value">{req.businessPrimaryPhone}</span>
                </div>
              )}
              {(req.businessAddressLine1 || req.businessAddressLine2 || req.businessAddressLine3 || req.businessAddressLine4) && (
                <div className="tr-modal-field">
                  <span className="tr-modal-label">{t("tenant_requests.list.detail_address")}</span>
                  <span className="tr-modal-value">
                    {[req.businessAddressLine1, req.businessAddressLine2, req.businessAddressLine3, req.businessAddressLine4]
                      .filter(Boolean)
                      .map((line, i) => (
                        <span key={i} className="tr-modal-address-line">{line}</span>
                      ))}
                  </span>
                </div>
              )}
              {req.businessCountry && (
                <div className="tr-modal-field">
                  <span className="tr-modal-label">{t("tenant_requests.list.detail_country")}</span>
                  <span className="tr-modal-value">{req.businessCountry}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="tr-modal-footer">
              <Button
                onClick={() => setDetailModal({ visible: false, request: null })}
                className="tr-modal-close-btn">
                {t("tenant_requests.list.detail_close")}
              </Button>
              <Button
                danger
                loading={actionLoading === req.id}
                onClick={() => {
                  handleReject(req);
                  setDetailModal({ visible: false, request: null });
                }}
                className="tr-modal-reject-btn">
                {t("tenant_requests.list.action_reject")}
              </Button>
              <Button
                type="primary"
                loading={actionLoading === req.id}
                onClick={() => {
                  handleApprove(req);
                  setDetailModal({ visible: false, request: null });
                }}
                className="tr-modal-approve-btn">
                {t("tenant_requests.list.action_approve")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantRequestList;
