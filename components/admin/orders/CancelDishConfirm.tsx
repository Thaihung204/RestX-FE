"use client";

import { Modal } from "antd";
import { useTranslation } from "react-i18next";

interface CancelDishConfirmProps {
  open: boolean;
  dishName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CancelDishConfirm({
  open,
  dishName,
  onConfirm,
  onCancel,
  loading = false,
}: CancelDishConfirmProps) {
  const { t } = useTranslation("common");

  return (
    <Modal
      open={open}
      title={t("admin.order_detail.cancel_dish.title")}
      okText={t("admin.order_detail.cancel_dish.confirm")}
      cancelText={t("common.cancel")}
      okButtonProps={{ danger: true, loading }}
      onOk={onConfirm}
      onCancel={onCancel}
      centered
      width={400}
      zIndex={1100}>
      <p style={{ margin: 0 }}>
        {t("admin.order_detail.cancel_dish.message", { name: dishName ?? "" })}
      </p>
    </Modal>
  );
}
