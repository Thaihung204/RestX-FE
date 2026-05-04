"use client";

import VnAddressSelect from "@/components/ui/VnAddressSelect";
import VnStreetAutocomplete from "@/components/ui/VnStreetAutocomplete";
import { tenantService } from "@/lib/services/tenantService";
import { TenantCreateInput } from "@/lib/types/tenant";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import type { FormProps } from "antd";
import { Alert, App, Button, Checkbox, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const TENANTS_BRAND_LOGO = "https://res.cloudinary.com/dzz8yqhcr/image/upload/v1773461233/DemoRestaurant/LogoUrl/logo.png";

const TenantCreatePage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantCreateInput>();
  const [hostNameValue, setHostNameValue] = useState("");
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const setOrCreateLink = (rel: string) => {
      let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = TENANTS_BRAND_LOGO;
    };

    setOrCreateLink("icon");
    setOrCreateLink("shortcut icon");
    setOrCreateLink("apple-touch-icon");
  }, []);

  const onFinish: FormProps<TenantCreateInput>["onFinish"] = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      await tenantService.createTenant({ ...values, isCustomDomain });
      message.success(t("tenants.toasts.create_success_message"));
      router.push("/tenants");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("tenants.toasts.save_error_message");
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/tenants");
  };

  const validateSlug = (_: unknown, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    const regex = isCustomDomain ? /^[a-z0-9-\.]+$/ : /^[a-z0-9-]+$/;

    if (!regex.test(value)) {
      return Promise.reject(
        new Error(isCustomDomain ? t("tenants.create.validation.domain_invalid", "Tên miền không hợp lệ") : t("tenants.create.validation.slug_invalid")),
      );
    }
    return Promise.resolve();
  };

  return (
    <main className="tc-page">
      {/* ── Sticky Header ── */}
      <div className="tc-header">
        <div className="tc-header-left">
          <button
            className="tc-back-btn"
            onClick={handleCancel}
            title={t("tenants.create.buttons.cancel")}>
            <ArrowLeftOutlined />
          </button>
          <h1 className="tc-header-title">{t("tenants.create.page_title")}</h1>
        </div>
        <div className="tc-header-right">
          <Button
            onClick={handleCancel}
            className="tc-cancel-btn">
            {t("tenants.create.buttons.cancel")}
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            disabled={loading}
            className="tc-create-btn">
            {t("tenants.create.buttons.create")}
          </Button>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="tc-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="tc-form"
          requiredMark={false}>
          <div className="tc-card">
            {/* Section 1: Restaurant Identity */}
            <div className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-icon">
                  <ShopOutlined />
                </span>
                <span className="tc-section-title">{t("tenants.create.restaurant_info")}</span>
              </div>

              <Form.Item
                label={t("tenants.create.fields.name")}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t("tenants.create.validation.name_required"),
                  },
                ]}>
                <Input
                  size="large"
                  prefix={<ShopOutlined className="tc-input-icon" />}
                  className="tc-input"
                />
              </Form.Item>

              <Form.Item
                label={t("tenants.create.fields.host_name")}
                name="hostName"
                rules={[{ validator: validateSlug }]}
                extra={
                  <div className="flex flex-col gap-2 mt-2">
                    <Checkbox
                      checked={isCustomDomain}
                      onChange={(e) => {
                        setIsCustomDomain(e.target.checked);
                        form.validateFields(['hostName']);
                      }}
                    >
                      {t("tenants.create.fields.allow_custom_domain", "Sử dụng tên miền riêng")}
                    </Checkbox>
                    {!isCustomDomain && (
                      <span className="tc-field-hint">
                        {t("tenants.create.fields.access_url")} hostname.restx.food
                      </span>
                    )}
                    {isCustomDomain && (
                      <Alert
                        title={t("tenants.edit.custom_domain_notice.title")}
                        description={t("tenants.edit.custom_domain_notice.description")}
                        type="info"
                        showIcon
                        className="bg-sky-500/10 border-sky-500/20 [&_.ant-alert-message]:text-sky-600 dark:[&_.ant-alert-message]:text-sky-400 [&_.ant-alert-description]:text-slate-600 dark:[&_.ant-alert-description]:text-slate-300 [&_.ant-alert-icon]:text-sky-600 dark:[&_.ant-alert-icon]:text-sky-400 mt-2"
                      />
                    )}
                  </div>
                }>
                {isCustomDomain ? (
                  <Input
                    prefix={<GlobalOutlined className="tc-input-icon" />}
                    value={hostNameValue}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-\.]/g, "");
                      form.setFieldValue("hostName", value);
                      setHostNameValue(value);
                    }}
                    className="tc-input"
                    size="large"
                  />
                ) : (
                  <div className="tc-url-bar">
                    <span className="tc-url-scheme">https://</span>
                    <Input
                      value={hostNameValue}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        form.setFieldValue("hostName", value);
                        setHostNameValue(value);
                      }}
                      className="tc-url-input"
                    />
                    <span className="tc-url-suffix">.restx.food</span>
                  </div>
                )}
              </Form.Item>

              <div className="tc-grid-2">
                <Form.Item
                  label={t("tenants.create.fields.business_name")}
                  name="businessName"
                  rules={[
                    {
                      required: true,
                      message: t("tenants.create.validation.business_name_required"),
                    },
                  ]}>
                  <Input
                    size="large"
                    prefix={<ShopOutlined className="tc-input-icon" />}
                    className="tc-input"
                  />
                </Form.Item>

                <Form.Item
                  label={t("tenants.create.fields.phone_number")}
                  name="phoneNumber"
                  rules={[
                    {
                      required: true,
                      message: t("tenants.create.validation.phone_required"),
                    },
                    {
                      pattern: /^[0-9]{10,11}$/,
                      message: t("tenants.create.validation.phone_invalid"),
                    },
                  ]}>
                  <Input
                    size="large"
                    prefix={<PhoneOutlined className="tc-input-icon" />}
                    className="tc-input"
                  />
                </Form.Item>
              </div>

              <Form.Item
                label={t("tenants.create.fields.mail_restaurant")}
                name="mailRestaurant"
                rules={[
                  {
                    required: true,
                    message: t("tenants.create.validation.restaurant_email_required"),
                  },
                  {
                    type: "email",
                    message: t("tenants.create.validation.email_invalid"),
                  },
                ]}>
                <Input
                  size="large"
                  type="email"
                  prefix={<MailOutlined className="tc-input-icon" />}
                  className="tc-input"
                />
              </Form.Item>
            </div>

            {/* Divider */}
            <div className="tc-divider" />

            {/* Section 2: Location */}
            <div className="tc-section">
              <div className="tc-section-header">
                <span className="tc-section-icon">
                  <EnvironmentOutlined />
                </span>
                <span className="tc-section-title">{t("tenants.create.fields.address")}</span>
              </div>

              <Form.Item
                name="addressLine1"
                label={t("tenants.create.fields.street_address")}
                rules={[
                  {
                    required: true,
                    message: t("tenants.create.validation.street_number_required"),
                  },
                ]}>
                <VnStreetAutocomplete
                  form={form}
                  fieldName="addressLine1"
                  cityFieldName="addressLine3"
                  districtWardFieldName="addressLine2"
                />
              </Form.Item>

              <VnAddressSelect
                form={form}
                cityFieldName="addressLine3"
                districtWardFieldName="addressLine2"
                countryFieldName="country"
                required
                cityRequiredMessage={t("tenants.create.validation.city_required")}
                districtRequiredMessage={t("tenants.create.validation.street_name_required")}
                wardRequiredMessage={t("tenants.create.validation.street_name_required")}
              />
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
};

export default TenantCreatePage;
