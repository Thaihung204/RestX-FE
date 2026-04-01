"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import { tenantService } from "@/lib/services/tenantService";
import { CreditCardOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, Input, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface PaymentGatewaySettings {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  returnUrl: string;
  cancelUrl: string;
}

export default function PaymentSettings() {
  const { t } = useTranslation("common");
  const { tenant } = useTenant();
  const { message } = App.useApp();
  const [form] = Form.useForm<PaymentGatewaySettings>();
  const lastFetchedDomainRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [resolvedTenantDomain, setResolvedTenantDomain] = useState<string | null>(null);

  // Helper to extract hostname/domain from tenant obj safely
  const resolveTenantDomain = (tData: any): string | undefined => {
    if (!tData) return undefined;
    return tData.hostname || tData.hostName || tData.Hostname || tData.HostName;
  };

  const resolveTenantDomainForAdmin = useCallback(async (): Promise<string | null> => {
    const directDomain = resolveTenantDomain(tenant);
    if (directDomain) return directDomain;

    try {
      const host = window.location.host;
      const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
      let hostname = hostWithoutPort;

      if (
        hostWithoutPort === "admin.localhost" ||
        hostWithoutPort === "localhost" ||
        hostWithoutPort === "127.0.0.1"
      ) {
        hostname = "demo.restx.food";
      } else if (hostWithoutPort.endsWith(".localhost")) {
        const subdomain = hostWithoutPort.replace(".localhost", "");
        hostname = subdomain && subdomain !== "admin" ? `${subdomain}.restx.food` : "demo.restx.food";
      }

      const tenantConfig = await tenantService.getTenantConfig(hostname);
      const resolved = tenantConfig ? resolveTenantDomain(tenantConfig) : undefined;
      return resolved || hostname || null;
    } catch (error) {
      console.error("Failed to resolve tenant domain for payment settings:", error);
      return null;
    }
  }, [tenant]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);

      const tenantDomain = resolvedTenantDomain || (await resolveTenantDomainForAdmin());
      if (!tenantDomain) {
        setHasExistingSettings(false);
        setLoading(false);
        return;
      }

      if (lastFetchedDomainRef.current === tenantDomain) {
        setLoading(false);
        return;
      }

      lastFetchedDomainRef.current = tenantDomain;
      setResolvedTenantDomain(tenantDomain);

      try {
        const data = await tenantService.getPaymentSettings(tenantDomain);
        if (data) {
          form.setFieldsValue(data);
          setHasExistingSettings(true);
        } else {
          form.resetFields();
          setHasExistingSettings(false);
        }
      } catch (error) {
        console.error("Failed to fetch payment settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [resolvedTenantDomain, resolveTenantDomainForAdmin, form]);

  const onFinish = async (values: PaymentGatewaySettings) => {
    const tenantDomain = resolvedTenantDomain || (await resolveTenantDomainForAdmin());
    if (!tenantDomain) {
      message.error(t("dashboard.settings.appearance.no_tenant_id"));
      return;
    }

    setResolvedTenantDomain(tenantDomain);

    setSaving(true);
    try {
      if (hasExistingSettings) {
        await tenantService.updatePaymentSettings(tenantDomain, values);
      } else {
        await tenantService.createPaymentSettings(tenantDomain, values);
      }

      setHasExistingSettings(true);
      message.success(t("dashboard.settings.notifications.success_update"));
    } catch (error: any) {
      // Fallback for cases where FE state is out-of-sync with BE:
      // - POST may fail if settings already exist
      // - PUT may fail if settings do not exist yet
      try {
        if (error?.response?.status === 400 || error?.response?.status === 404 || error?.response?.status === 409) {
          if (hasExistingSettings) {
            await tenantService.createPaymentSettings(tenantDomain, values);
          } else {
            await tenantService.updatePaymentSettings(tenantDomain, values);
          }
          setHasExistingSettings(true);
          message.success(t("dashboard.settings.notifications.success_update"));
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback save payment settings failed:", fallbackError);
      }
      console.error("Failed to save payment settings:", error);
      message.error(t("dashboard.settings.notifications.error_update"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
      }}
      title={
        <div className="flex items-center gap-2" style={{ color: "var(--text)" }}>
          <CreditCardOutlined className="text-orange-500" />
          <span>{t("dashboard.settings.payment.title")}</span>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="tenant-form"
      >
        {!hasExistingSettings && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={t("dashboard.settings.payment.empty_state.message")}
            description={t("dashboard.settings.payment.empty_state.description")}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label={<span style={{ color: "var(--text)" }}>{t("dashboard.settings.payment.fields.client_id")}</span>}
            name="clientId"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.client_id_required") }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "var(--text)" }}>{t("dashboard.settings.payment.fields.api_key")}</span>}
            name="apiKey"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.api_key_required") }]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "var(--text)" }}>{t("dashboard.settings.payment.fields.checksum_key")}</span>}
            name="checksumKey"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.checksum_key_required") }]}
          >
            <Input.Password size="large" />
          </Form.Item>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            size="large"
            className="shadow-orange-900/20 shadow-lg border-none"
          >
            {t("dashboard.settings.payment.actions.save_settings") }
          </Button>
        </div>
      </Form>
    </Card>
  );
}
