"use client";

import { tenantService } from "@/lib/services/tenantService";
import { ITenant } from "@/lib/types/tenant";
import { App, Button, Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface PaymentGatewaySettings {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

interface TenantPaymentSettingsModalProps {
  open: boolean;
  tenant: ITenant | null;
  onClose: () => void;
}

export default function TenantPaymentSettingsModal({
  open,
  tenant,
  onClose,
}: TenantPaymentSettingsModalProps) {
  const { t } = useTranslation("common");
  const { message } = App.useApp();
  const [form] = Form.useForm<PaymentGatewaySettings>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [initialSettings, setInitialSettings] =
    useState<PaymentGatewaySettings | null>(null);

  const showNoPaymentInfoToast = () => {
    message.warning(
      t("dashboard.settings.payment.notifications.not_configured"),
    );
  };

  const normalizeSettings = (
    settings: PaymentGatewaySettings,
  ): PaymentGatewaySettings => ({
    clientId: settings.clientId?.trim() || "",
    apiKey: settings.apiKey?.trim() || "",
    checksumKey: settings.checksumKey?.trim() || "",
  });

  const isSameSettings = (
    left: PaymentGatewaySettings | null,
    right: PaymentGatewaySettings,
  ) => {
    if (!left) return false;
    const normalizedLeft = normalizeSettings(left);
    const normalizedRight = normalizeSettings(right);
    return (
      normalizedLeft.clientId === normalizedRight.clientId &&
      normalizedLeft.apiKey === normalizedRight.apiKey &&
      normalizedLeft.checksumKey === normalizedRight.checksumKey
    );
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (!open || !tenant?.id) return;

      setLoading(true);
      form.resetFields();

      try {
        const settings = await tenantService.getPaymentSettings(tenant.id);
        if (settings) {
          const normalized = normalizeSettings({
            clientId: settings.clientId || "",
            apiKey: settings.apiKey || "",
            checksumKey: settings.checksumKey || "",
          });
          form.setFieldsValue(normalized);
          setInitialSettings(normalized);
          setHasExistingSettings(true);
        } else {
          const emptySettings = normalizeSettings({
            clientId: "",
            apiKey: "",
            checksumKey: "",
          });
          setInitialSettings(emptySettings);
          setHasExistingSettings(false);
          showNoPaymentInfoToast();
        }
      } catch (error) {
        console.error("Failed to fetch payment settings:", error);
        setInitialSettings(null);
        setHasExistingSettings(false);
        message.error(t("dashboard.settings.notifications.error_update"));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [open, tenant, form, message, t]);

  const handleSubmit = async (values: PaymentGatewaySettings) => {
    if (!tenant?.id || saving) return;

    const normalizedValues = normalizeSettings(values);

    if (isSameSettings(initialSettings, normalizedValues)) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      if (hasExistingSettings) {
        await tenantService.updatePaymentSettings(tenant.id, normalizedValues);
      } else {
        await tenantService.createPaymentSettings(tenant.id, normalizedValues);
      }

      setHasExistingSettings(true);
      setInitialSettings(normalizedValues);
      message.success(t("dashboard.settings.notifications.success_update"));
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showNoPaymentInfoToast();
      }

      try {
        if (
          error?.response?.status === 400 ||
          error?.response?.status === 404 ||
          error?.response?.status === 409
        ) {
          if (hasExistingSettings) {
            await tenantService.createPaymentSettings(
              tenant.id,
              normalizedValues,
            );
          } else {
            await tenantService.updatePaymentSettings(
              tenant.id,
              normalizedValues,
            );
          }
          setHasExistingSettings(true);
          setInitialSettings(normalizedValues);
          message.success(t("dashboard.settings.notifications.success_update"));
          onClose();
          return;
        }
      } catch (fallbackError: any) {
        if (fallbackError?.response?.status === 404) {
          showNoPaymentInfoToast();
        }
        console.error("Fallback save payment settings failed:", fallbackError);
      }

      console.error("Failed to save payment settings:", error);
      message.error(t("dashboard.settings.notifications.error_update"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${t("dashboard.settings.payment.title")} - ${tenant?.businessName || tenant?.name || ""}`}
      open={open}
      onCancel={saving ? undefined : onClose}
      footer={null}
      destroyOnHidden
      mask
      maskClosable={!saving}
      keyboard={!saving}
      closable={!saving}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="tenant-form">
        <Form.Item
          label={t("dashboard.settings.payment.fields.client_id")}
          name="clientId"
          rules={[
            {
              required: true,
              message: t(
                "dashboard.settings.payment.validation.client_id_required",
              ),
            },
          ]}>
          <Input size="large" disabled={loading || saving} />
        </Form.Item>

        <Form.Item
          label={t("dashboard.settings.payment.fields.api_key")}
          name="apiKey"
          rules={[
            {
              required: true,
              message: t(
                "dashboard.settings.payment.validation.api_key_required",
              ),
            },
          ]}>
          <Input.Password size="large" disabled={loading || saving} />
        </Form.Item>

        <Form.Item
          label={t("dashboard.settings.payment.fields.checksum_key")}
          name="checksumKey"
          rules={[
            {
              required: true,
              message: t(
                "dashboard.settings.payment.validation.checksum_key_required",
              ),
            },
          ]}>
          <Input.Password size="large" disabled={loading || saving} />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} disabled={saving || loading}>
            {t("dashboard.settings.buttons.cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving || loading}
            disabled={saving || loading}>
            {t("dashboard.settings.payment.actions.save_settings")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
