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

type ConfirmState = {
  type: "deposit" | "checkin" | "delete";
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
  restrictToToday = true,
}: {
  item: ReservationListItem;
  onActionComplete: () => void;
  onViewDetail?: () => void;
  restrictToToday?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<"deposit" | "checkin" | "delete" | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const code = item.status?.code?.toUpperCase() ?? "";
  const isConfirmed = code === "CONFIRMED";
  const isCheckedIn = code === "CHECKED_IN" || Boolean(item.checkedInAt);
  const isCompleted = code === "COMPLETED";
  const hasDepositRequirement = (item.depositAmount ?? 0) > 0;
  
  const isDepositPaid = item.depositPaid || isConfirmed || isCheckedIn || isCompleted;
  const hasUnpaidDeposit = hasDepositRequirement && !isDepositPaid && code !== "CANCELLED" && code !== "NO_SHOW" && code !== "NOSHOW";

  const now = new Date();
  const canCheckIn =
    isConfirmed &&
    !isCheckedIn &&
    (!hasDepositRequirement || isDepositPaid) &&
    (!restrictToToday || isSameLocalDate(item.reservationDateTime, now.getFullYear(), now.getMonth(), now.getDate()));

  const pendingBadgeCount = Number(hasUnpaidDeposit) + Number(canCheckIn);

  const executeAction = async (type: "deposit" | "checkin" | "delete") => {
    setActionLoading(type);
    setConfirmState(null);
    try {
      if (type === "delete") {
        await reservationService.deleteReservation(item.id);
        message.success(t("admin.reservations.messages.delete_success", { defaultValue: "Xóa đặt bàn thành công" }));
      } else if (type === "checkin") {
        await reservationService.checkInReservation(item.confirmationCode);
        message.success(t("admin.reservations.messages.checkin_success"));
      } else {
        await reservationService.confirmCashDeposit(item.id, { cashReceive: item.depositAmount ?? 0 });
        message.success(t("admin.reservations.messages.deposit_confirmed"));
      }
      onActionComplete();
    } catch (e) {
      const fallbackKey =
        type === "delete"
          ? "admin.reservations.messages.delete_failed"
          : type === "checkin"
          ? "admin.reservations.messages.checkin_failed"
          : "admin.reservations.messages.deposit_failed";
      message.error(extractApiErrorMessage(e, t(fallbackKey, { defaultValue: "Action failed" })));
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirm = useCallback(
    (type: "deposit" | "checkin" | "delete") => {
      const prefix = "admin.reservations.confirm";
      
      if (type === "delete") {
        setConfirmState({
          type,
          title: t(`${prefix}.delete_title`, { defaultValue: "Xóa đặt bàn" }),
          description: t(`${prefix}.delete_description`, { defaultValue: "Bạn có chắc chắn muốn xóa đặt bàn này không? Hành động này không thể hoàn tác." }),
          confirmText: t(`${prefix}.delete_confirm`, { defaultValue: "Xóa" }),
          cancelText: t(`${prefix}.delete_cancel`, { defaultValue: t(`${prefix}.cancel_cancel`, { defaultValue: "Hủy" }) }),
          variant: "danger",
        });
        return;
      }
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
          key: "deposit",
          label: t("admin.reservations.actions.confirm_cash_deposit", {
            defaultValue: "Xác nhận đã cọc",
          }),
          variant: "success",
          onClick: () => openConfirm("deposit"),
          disabled: actionLoading !== null,
        });
      }
    }

    if (canCheckIn) {
      items.push({
        key: "checkin",
        label: t("admin.reservations.actions.checkin", { defaultValue: "Check-in" }),
        variant: "success",
        onClick: () => openConfirm("checkin"),
        disabled: actionLoading !== null,
      });
    }

    items.push({
      key: "delete",
      label: t("admin.reservations.actions.delete", { defaultValue: "Xóa đặt bàn" }),
      variant: "danger",
      onClick: () => openConfirm("delete"),
      disabled: actionLoading !== null,
    });

    return items;
  }, [actionLoading, canCheckIn, hasDepositRequirement, hasUnpaidDeposit, isCheckedIn, openConfirm, t]);

  const moreLabel = t("admin.reservations.actions.actions_menu", { defaultValue: "Thao tác" });

  return (
    <>
      <ReservationActionMenu
        onViewDetail={onViewDetail || (() => router.push(`/admin/your-reservation/${item.id}`))}
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
