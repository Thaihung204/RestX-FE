"use client";

import VnAddressSelect from "@/components/ui/VnAddressSelect";
import { tenantService } from "@/lib/services/tenantService";
import { TenantCreateInput } from "@/lib/types/tenant";
import {
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { FormProps } from "antd";
import { App, Breadcrumb, Button, Card, Form, Input, Typography } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Custom styles for focus states and compact input
const TENANTS_BRAND_LOGO = "https://res.cloudinary.com/dzz8yqhcr/image/upload/v1773461233/DemoRestaurant/LogoUrl/logo.png";

const customStyles = `
  .tenant-form .ant-input-affix-wrapper,
  .tenant-form .ant-input:not(.url-bar .ant-input) {
    border-radius: 6px !important;
    background: var(--card) !important;
    font-size: 14px !important;
  }

  .tenant-form .ant-input-affix-wrapper .ant-input {
    background: transparent !important;
    font-size: 14px !important;
  }

  .tenant-form .ant-input-affix-wrapper:focus,
  .tenant-form .ant-input-affix-wrapper-focused,
  .tenant-form .ant-input-affix-wrapper:hover,
  .tenant-form .ant-input:focus,
  .tenant-form .ant-input-focused,
  .tenant-form .ant-input:hover {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1) !important;
  }
  
  .url-bar {
    display: flex;
    align-items: center;
    border: 1px solid var(--ant-color-border, #d9d9d9);
    border-radius: 6px;
    height: 40px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    padding: 0 12px;
    gap: 2px;
    cursor: text;
  }

  .url-bar:focus-within {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1) !important;
  }

  .url-bar .ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    height: 100%;
    border-radius: 0 !important;
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }

  .url-bar .ant-input-prefix {
    margin-inline-end: 4px;
  }

  .url-bar .url-segment {
    font-size: 14px;
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
  }

  .url-bar .url-scheme {
    color: #6b7280;
  }

  .url-bar .url-suffix {
    color: #6b7280;
  }
`;

const { Title, Paragraph } = Typography;

const TenantCreatePage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantCreateInput>();
  const [hostNameValue, setHostNameValue] = useState("");
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
      await tenantService.createTenant(values);
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

    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(
        new Error(t("tenants.create.validation.slug_invalid")),
      );
    }
    return Promise.resolve();
  };

  return (
    <>
      <style>{customStyles}</style>
      <main
        className="px-6 lg:px-8 py-8 flex-1"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* --- Main Form --- */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="tenant-form">
            <div className="max-w-2xl mx-auto">
              <Card
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                title={
                  <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                    {t("tenants.create.restaurant_info")}
                  </Title>
                }>
                <Form.Item
                  label={
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}>
                      {t("tenants.create.fields.name")}
                    </span>
                  }
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: t("tenants.create.validation.name_required"),
                    },
                  ]}>
                  <Input
                    size="large"
                    placeholder={t("tenants.create.fields.name_placeholder")}
                    prefix={<ShopOutlined className="text-gray-400 mr-1" />}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}>
                      {t("tenants.create.fields.host_name")}
                    </span>
                  }
                  name="hostName"
                  rules={[{ validator: validateSlug }]}
                  extra={
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}>
                      {`${t("tenants.create.fields.access_url")} hostname.restx.food`}
                    </span>
                  }>
                  <div className="url-bar">
                    <span className="url-segment url-scheme">https://</span>
                    <Input
                      placeholder={t(
                        "tenants.create.fields.host_name",
                      )}
                      value={hostNameValue}
                      onChange={(e) => {
                        const value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        form.setFieldValue("hostName", value);
                        setHostNameValue(value);
                      }}
                    />
                    <span className="url-segment url-suffix">.restx.food</span>
                  </div>
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label={
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}>
                        {t("tenants.create.fields.business_name")}
                      </span>
                    }
                    name="businessName"
                    rules={[
                      {
                        required: true,
                        message: t(
                          "tenants.create.validation.business_name_required",
                        ),
                      },
                    ]}>
                    <Input
                      size="large"
                      placeholder={t(
                        "tenants.create.fields.business_name_placeholder",
                      )}
                      prefix={<ShopOutlined className="text-gray-400 mr-1" />}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}>
                        {t("tenants.create.fields.phone_number")}
                      </span>
                    }
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
                      placeholder={t("tenants.create.fields.phone_placeholder")}
                      prefix={<PhoneOutlined className="text-gray-400 mr-1" />}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label={
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}>
                      {t("tenants.create.fields.mail_restaurant")}
                    </span>
                  }
                  name="mailRestaurant"
                  rules={[
                    {
                      required: true,
                      message: t(
                        "tenants.create.validation.restaurant_email_required",
                      ),
                    },
                    {
                      type: "email",
                      message: t("tenants.create.validation.email_invalid"),
                    },
                  ]}>
                  <Input
                    size="large"
                    type="email"
                    placeholder={t(
                      "tenants.create.fields.mail_restaurant_placeholder",
                    )}
                    prefix={<MailOutlined className="text-gray-400 mr-1" />}
                  />
                </Form.Item>

                <div className="space-y-3">
                  <label
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("tenants.create.fields.address")}
                  </label>

                  <Form.Item
                    name="addressLine1"
                    rules={[
                      {
                        required: true,
                        message: t(
                          "tenants.create.validation.street_number_required",
                        ),
                      },
                    ]}>
                    <Input
                      size="large"
                      placeholder={t(
                        "tenants.create.fields.address_line1_placeholder",
                      )}
                    />
                  </Form.Item>

                  <VnAddressSelect
                    form={form}
                    cityFieldName="addressLine3"
                    districtWardFieldName="addressLine2"
                    stateProvinceFieldName="addressLine4"
                    required
                    cityRequiredMessage={t("tenants.create.validation.city_required")}
                    districtRequiredMessage={t("tenants.create.validation.street_name_required")}
                    wardRequiredMessage={t("tenants.create.validation.street_name_required")}
                  />

                  <Form.Item
                    name="addressLine4"
                    initialValue="Việt Nam"
                    rules={[
                      {
                        required: true,
                        message: t(
                          "tenants.create.validation.country_required",
                        ),
                      },
                    ]}>
                    <Input
                      size="large"
                      placeholder={t(
                        "tenants.create.fields.address_line4_placeholder",
                      )}
                    />
                  </Form.Item>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading}
                  size="large"
                  block
                  className="shadow-orange-900/20 shadow-lg border-none h-12 text-base font-medium">
                  {t("tenants.create.buttons.create")}
                </Button>
                <Button
                  onClick={handleCancel}
                  size="large"
                  block
                  type="default"
                  className="h-12 text-base font-medium">
                  {t("tenants.create.buttons.cancel")}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </main>
    </>
  );
};

export default TenantCreatePage;
