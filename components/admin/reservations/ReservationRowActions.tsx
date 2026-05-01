"use client";

import { ReservationActionMenu } from "@/components/reservations/ReservationActionMenu";
import ConfirmModal from "@/components/ui/ConfirmModal";
import reservationService, {
  ReservationListItem,
} from "@/lib/services/reservationService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ConfirmState =
  | {
      type: "deposit";
      title: string;
      description: string;
      confirmText: string;
      cancelText: string;
      variant: "danger" | "warning" | "info";
    }
  | {
      type: "checkin";
      title: string;
      description: string;
      confirmText: string;
      cancelText: string;
      variant: "danger" | "warning" | "info";
    };

const isSameLocalDate = (value: string | Date, y: number, m: number, d: number) => {
  const dt = new Date(value);
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
};

export function ReservationRowActions({
  item,
  onActionComplete,
  onViewDetail,
}: {
  item: ReservationListItem;
  onActionComplete: () => void;
  onViewDetail?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<"deposit" | "checkin" | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const code = item.status?.code?.toUpperCase() ?? "";
  const isConfirmed = code === "CONFIRMED";
  const isCheckedIn = code === "CHECKED_IN" || Boolean(item.checkedInAt);
  const hasDepositRequirement = (item.depositAmount ?? 0) > 0;
  const hasUnpaidDeposit = hasDepositRequirement && !item.depositPaid;

  const now = new Date();
  const canCheckIn =
    isConfirmed &&
    !isCheckedIn &&
    (!hasDepositRequirement || item.depositPaid) &&
    isSameLocalDate(item.reservationDateTime, now.getFullYear(), now.getMonth(), now.getDate());

  const pendingBadgeCount = Number(hasUnpaidDeposit) + Number(canCheckIn);

  const executeAction = async (type: "deposit" | "checkin") => {
    setActionLoading(type);
    setConfirmState(null);
    try {
      if (type === "checkin") {
        await reservationService.checkInReservation(item.confirmationCode);
        message.success(t("admin.reservations.messages.checkin_success"));
      } else {
        await reservationService.confirmCashDeposit(item.id, { cashReceive: item.depositAmount ?? 0 });
        message.success(t("admin.reservations.messages.deposit_confirmed"));
      }
      onActionComplete();
    } catch (e) {
      const fallbackKey =
        type === "checkin"
          ? "admin.reservations.messages.checkin_failed"
          : "admin.reservations.messages.deposit_failed";
      message.error(extractApiErrorMessage(e, t(fallbackKey, { defaultValue: "Action failed" })));
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirm = useCallback(
    (type: "deposit" | "checkin") => {
      const prefix = "admin.reservations.confirm";
      if (type === "deposit") {
        setConfirmState({
          type,
          title: t(`${prefix}.deposit_title`),
          description: t(`${prefix}.deposit_description`),
          confirmText: t(`${prefix}.deposit_confirm`),
          cancelText: t(`${prefix}.deposit_cancel`, { defaultValue: t(`${prefix}.cancel_cancel`) }),
          variant: "warning",
        });
        return;
      }

      setConfirmState({
        type,
        title: t(`${prefix}.checkin_title`),
        description: t(`${prefix}.checkin_description`),
        confirmText: t(`${prefix}.checkin_confirm`),
        cancelText: t(`${prefix}.checkin_cancel`, { defaultValue: t(`${prefix}.cancel_cancel`) }),
        variant: "info",
      });
    },
    [t],
  );

  const menuItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      variant?: "primary" | "warning" | "success" | "danger";
      onClick: () => void;
      disabled?: boolean;
    }> = [];

    if (hasDepositRequirement) {
      if (hasUnpaidDeposit) {
        items.push({
          key: "deposit_state",
          label: t("admin.reservations.messages.deposit_pending", {
            defaultValue: "Chưa cọc",
          }),
          variant: "danger",
          onClick: () => {},
          disabled: true,
        });
        items.push({
          key: "deposit",
          label: t("admin.reservations.actions.confirm_cash_deposit", {
            defaultValue: "Xác nhận đã cọc",
          }),
          variant: "success",
          icon: (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          onClick: () => openConfirm("deposit"),
          disabled: actionLoading !== null,
        });
      } else {
        items.push({
          key: "deposit_done",
          label: t("admin.reservations.actions.deposit_confirmed", {
            defaultValue: "Đã xác nhận cọc",
          }),
          variant: "success",
          onClick: () => {},
          disabled: true,
        });
      }
    }

    if (canCheckIn) {
      items.push({
        key: "checkin_state",
        label: t("admin.reservations.messages.not_checked_in", {
          defaultValue: "Chưa check-in",
        }),
        variant: "warning",
        onClick: () => {},
        disabled: true,
      });
      items.push({
        key: "checkin",
        label: t("admin.reservations.actions.checkin", { defaultValue: "Check-in" }),
        variant: "success",
        onClick: () => openConfirm("checkin"),
        disabled: actionLoading !== null,
      });
    } else if (isCheckedIn) {
      items.push({
        key: "checkin_done",
        label: t("admin.reservations.actions.checked_in", { defaultValue: "Đã check-in" }),
        variant: "success",
        onClick: () => {},
        disabled: true,
      });
    }

    return items;
  }, [actionLoading, canCheckIn, hasDepositRequirement, hasUnpaidDeposit, isCheckedIn, openConfirm, t]);

  const moreLabel = t("admin.reservations.actions.actions_menu", { defaultValue: "Thao tác" });

  return (
    <>
      <ReservationActionMenu
        onViewDetail={onViewDetail || (() => router.push(`/admin/reservation/${item.id}`))}
        viewDetailLabel={t("admin.reservations.actions.view_detail")}
        moreLabel={moreLabel}
        menuItems={menuItems}
        pendingBadgeCount={pendingBadgeCount}
        actionLoading={actionLoading !== null}
      />

      {confirmState && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
          loading={actionLoading !== null}
          onConfirm={() => executeAction(confirmState.type)}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </>
  );
}
