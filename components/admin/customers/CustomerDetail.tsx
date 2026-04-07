"use client";

import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import customerService, {
  Customer,
  CustomerResponseDto,
} from "@/lib/services/customerService";
import {
  Cake,
  Cancel,
  CheckCircle,
  Close,
  History,
  Phone,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  const { t } = useTranslation("common");
  const primaryColor = "var(--primary)";

  const [customerProfile, setCustomerProfile] = useState<CustomerResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerById = async () => {
      if (!customer?.id) return;
      setIsLoading(true);
      try {
        const detail = await customerService.getCustomerProfile(customer.id);
        if (isMounted) {
          setCustomerProfile(detail);
        }
      } catch {
        if (isMounted) {
          setCustomerProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCustomerById();

    return () => {
      isMounted = false;
    };
  }, [customer?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const getVipBadgeColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return "#E5E7EB";
      case "gold":
        return "#EAB308";
      case "silver":
        return "#9CA3AF";
      default:
        return "#FB923C";
    }
  };

  const displayName = customerProfile?.fullName || customer.name;
  const displayPhone = customerProfile?.phoneNumber || customer.phone || "N/A";
  const displayAvatar =
    customerProfile?.avatarUrl ||
    customer.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const displayMembership = customerProfile?.membershipLevel || customer.vipTier || "Bronze";
  const displayPoints = customerProfile?.loyaltyPoints ?? customer.loyaltyPoints ?? 0;
  const displayTotalOrders = customerProfile?.totalOrders ?? customer.totalOrders ?? 0;
  const displayTotalReservations = customerProfile?.totalReservations ?? 0;
  const displayCreatedDate = customerProfile?.createdDate || customer.memberSince;
  const displayModifiedDate = customerProfile?.modifiedDate || customer.lastVisit;
  const displayIsActive = customerProfile?.isActive ?? customer.isActive;
  const isBirthday = customerService.isBirthday(customer.birthday);

  const statusStyles = useMemo(
    () =>
      displayIsActive
        ? {
            label: t("customers.list.status.active"),
            icon: <CheckCircle sx={{ fontSize: 16, color: "#22c55e" }} />,
            color: "#22c55e",
            bg: "rgba(34, 197, 94, 0.12)",
            border: "rgba(34, 197, 94, 0.3)",
          }
        : {
            label: t("customers.list.status.inactive"),
            icon: <Cancel sx={{ fontSize: 16, color: "#ef4444" }} />,
            color: "#ef4444",
            bg: "rgba(239, 68, 68, 0.12)",
            border: "rgba(239, 68, 68, 0.3)",
          },
    [displayIsActive, t],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-start justify-between gap-4 px-6 py-5 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-14 h-14 rounded-full border object-cover"
              style={{ borderColor: "var(--border)" }}
            />
            <div className="min-w-0">
              <h3 className="text-xl font-bold truncate" style={{ color: "var(--text)" }}>
                {displayName}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                  style={{ color: statusStyles.color, background: statusStyles.bg, borderColor: statusStyles.border }}>
                  {statusStyles.icon}
                  {statusStyles.label}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                  style={{
                    color: getVipBadgeColor(displayMembership),
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}>
                  <LoyaltyBandIcon color={getVipBadgeColor(displayMembership)} size={14} />
                  {String(displayMembership).toUpperCase()}
                </span>

                {isBirthday && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                    style={{ color: primaryColor, background: "var(--primary-soft)", borderColor: "var(--primary-border)" }}>
                    <Cake sx={{ fontSize: 14 }} />
                    {t("customers.list.status.birthday")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full transition"
            style={{ color: "var(--text-muted)", background: "var(--surface)" }}
            onClick={onClose}
            aria-label={t("customers.detail.modal.close_aria")}>
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {isLoading && (
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {t("customers.detail.loading")}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("customers.detail.orders")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--text)" }}>
                {displayTotalOrders}
              </p>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("customers.detail.reservations")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--text)" }}>
                {displayTotalReservations}
              </p>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("customers.detail.points")}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>
                {displayPoints}
              </p>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div
              className="px-4 py-3 border-b text-sm font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
              {t("customers.detail.customer_information")}
            </div>

            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("customers.detail.phone_number")}
                </span>
                <span className="text-sm font-medium inline-flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Phone sx={{ fontSize: 16, color: primaryColor }} />
                  {displayPhone}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("customers.detail.registration_date")}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formatDateTime(displayCreatedDate)}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("customers.detail.last_modified_date")}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formatDateTime(displayModifiedDate)}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("customers.detail.member_since_label")}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formatDate(displayCreatedDate)}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm inline-flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <History sx={{ fontSize: 16 }} />
                  {t("customers.detail.last_activity")}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formatDateTime(displayModifiedDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
