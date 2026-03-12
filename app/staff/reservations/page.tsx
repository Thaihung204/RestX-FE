"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import reservationService, {
  PaginatedReservations,
  ReservationListItem,
} from "@/lib/services/reservationService";
import { Button, Empty, Input, Select, Table, Tag, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

const statusColors: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

export default function StaffReservationsPage() {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: page,
        pageSize: 10,
        search: search || undefined,
        statusId: statusId !== "" ? statusId : undefined,
        sortBy: "reservationDateTime",
        sortDescending: true,
      });
      setData(result);
    } catch (error) {
      console.error(error);
      messageApi.error(t("staff.reservations.load_error"));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusId, messageApi, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusId]);

  const statusOptions = useMemo(
    () => [
      { id: 1, labelKey: "pending" },
      { id: 2, labelKey: "confirmed" },
      { id: 3, labelKey: "checkin" },
      { id: 4, labelKey: "completed" },
      { id: 5, labelKey: "cancelled" },
    ],
    [],
  );

  const handleConfirm = async (id: string) => {
    try {
      await reservationService.confirmReservation(id);
      messageApi.success(t("staff.reservations.confirm_success"));
      fetchData();
    } catch (error) {
      console.error(error);
      messageApi.error(t("staff.reservations.action_error"));
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await reservationService.checkInReservation(id);
      messageApi.success(t("staff.reservations.checkin_success"));
      fetchData();
    } catch (error) {
      console.error(error);
      messageApi.error(t("staff.reservations.action_error"));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await reservationService.completeReservation(id);
      messageApi.success(t("staff.reservations.complete_success"));
      fetchData();
    } catch (error) {
      console.error(error);
      messageApi.error(t("staff.reservations.action_error"));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await reservationService.updateReservationStatus(id, 5);
      messageApi.success(t("staff.reservations.cancel_success"));
      fetchData();
    } catch (error) {
      console.error(error);
      messageApi.error(t("staff.reservations.action_error"));
    }
  };

  const columns = [
    {
      title: t("staff.reservations.columns.code"),
      dataIndex: "confirmationCode",
      key: "code",
      render: (_: string, record: ReservationListItem) => (
        <div>
          <Text strong style={{ color: "var(--primary)" }}>#{record.confirmationCode}</Text>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: t("staff.reservations.columns.customer"),
      dataIndex: "contactName",
      key: "customer",
      render: (_: string, record: ReservationListItem) => (
        <div>
          <Text>{record.contactName}</Text>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{record.contactPhone}</div>
        </div>
      ),
    },
    {
      title: t("staff.reservations.columns.table"),
      dataIndex: "tables",
      key: "table",
      render: (_: string, record: ReservationListItem) => (
        <div>
          {record.tables.map((table) => (
            <div key={table.id} style={{ fontSize: 12 }}>
              {table.code} · {table.floorName}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t("staff.reservations.columns.date_time"),
      dataIndex: "reservationDateTime",
      key: "date",
      render: (value: string) => (
        <div>
          <div>{new Date(value).toLocaleDateString()}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ),
    },
    {
      title: t("staff.reservations.columns.guests"),
      dataIndex: "numberOfGuests",
      key: "guests",
      align: "center" as const,
    },
    {
      title: t("staff.reservations.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status: ReservationListItem["status"]) => (
        <Tag color={status.colorCode || statusColors[status.code]}>{status.name}</Tag>
      ),
    },
    {
      title: t("staff.reservations.columns.actions"),
      key: "actions",
      render: (_: string, record: ReservationListItem) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {record.status.code === "PENDING" && (
            <Button type="primary" size="small" onClick={() => handleConfirm(record.id)}>
              {t("staff.reservations.actions.confirm")}
            </Button>
          )}
          {record.status.code === "CONFIRMED" && (
            <Button type="primary" size="small" onClick={() => handleCheckIn(record.id)}>
              {t("staff.reservations.actions.checkin")}
            </Button>
          )}
          {record.status.code === "CHECKED_IN" && (
            <Button type="primary" size="small" onClick={() => handleComplete(record.id)}>
              {t("staff.reservations.actions.complete")}
            </Button>
          )}
          {(record.status.code === "PENDING" || record.status.code === "CONFIRMED") && (
            <Button danger size="small" onClick={() => handleCancel(record.id)}>
              {t("staff.reservations.actions.cancel")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t("staff.reservations.title")}
          </Typography.Title>
          <Text style={{ color: "var(--text-muted)" }}>
            {t("staff.reservations.subtitle")}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          {t("staff.reservations.refresh")}
        </Button>
      </div>

      <div
        style={{
          marginTop: 16,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder={t("staff.reservations.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Select
          value={statusId}
          onChange={(value) => setStatusId(value === "" ? "" : Number(value))}
          style={{ minWidth: 180 }}
          placeholder={t("staff.reservations.filter_status")}
          options={[
            { value: "", label: t("staff.reservations.status_all") },
            ...statusOptions.map((option) => ({
              value: option.id,
              label: t(`staff.reservations.status.${option.labelKey}`),
            })),
          ]}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items || []}
          loading={loading}
          pagination={
            data
              ? {
                  current: data.pageNumber,
                  pageSize: data.pageSize,
                  total: data.totalCount,
                  onChange: (p) => setPage(p),
                }
              : false
          }
          locale={{
            emptyText: (
              <Empty description={t("staff.reservations.empty")} />
            ),
          }}
          style={{
            background: "var(--card)",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        />
      </div>
    </div>
  );
}
