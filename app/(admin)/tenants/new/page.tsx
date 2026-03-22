"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
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
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// Custom styles for focus states and compact input
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
  const { language, changeLanguage } = useLanguage();
  const { message } = App.useApp();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [form] = Form.useForm<TenantCreateInput>();
  const [hostNameValue, setHostNameValue] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div
      className="min-h-screen font-sans"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <style>{customStyles}</style>
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* --- Header Section --- */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Breadcrumb
                items={[
                  { title: t("tenants.breadcrumb.admin") },
                  {
                    title: (
                      <a onClick={() => router.push("/tenants")}>
                        {t("tenants.breadcrumb.tenants")}
                      </a>
                    ),
                  },
                  {
                    title: t("tenants.create.breadcrumb_create"),
                  },
                ]}
                className="text-xs font-medium mb-1"
              />
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "var(--text)",
                }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  {t("tenants.create.title")}
                </span>
              </Title>
              <Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}>
                {t("tenants.create.subtitle")}
              </Paragraph>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 rounded-lg transition-colors group flex items-center gap-2.5 h-10"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                  }}>
                  {language === "vi" ? (
                    <svg
                      className="w-6 h-4 rounded-[2px] shadow-sm"
                      viewBox="0 0 3 2"
                      xmlns="http://www.w3.org/2000/svg">
                      <rect width="3" height="2" fill="#DA251D" />
                      <polygon
                        points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                        fill="#FF0"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-4 rounded-[2px] shadow-sm"
                      viewBox="0 0 60 30"
                      xmlns="http://www.w3.org/2000/svg">
                      <clipPath id="s">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <clipPath id="t">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                      </clipPath>
                      <g clipPath="url(#s)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path
                          d="M0,0 L60,30 M60,0 L0,30"
                          stroke="#fff"
                          strokeWidth="6"
                        />
                        <path
                          d="M0,0 L60,30 M60,0 L0,30"
                          clipPath="url(#t)"
                          stroke="#C8102E"
                          strokeWidth="4"
                        />
                        <path
                          d="M30,0 v30 M0,15 h60"
                          stroke="#fff"
                          strokeWidth="10"
                        />
                        <path
                          d="M30,0 v30 M0,15 h60"
                          stroke="#C8102E"
                          strokeWidth="6"
                        />
                      </g>
                    </svg>
                  )}
                  <span className="text-sm font-medium uppercase group-hover:text-orange-500 leading-none pt-[1px]">
                    {language}
                  </span>
                  <svg
                    className="w-3 h-3 text-[var(--text-muted)] opacity-70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isLangMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsLangMenuOpen(false)}
                    />
                    <div
                      className="absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border p-1 z-40 transition-all"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}>
                      <button
                        onClick={() => {
                          changeLanguage("en");
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                          language === "en"
                            ? "bg-orange-500/10 text-orange-500"
                            : "hover:bg-[var(--bg-base)]"
                        }`}
                        style={{
                          color: language === "en" ? undefined : "var(--text)",
                        }}>
                        <svg
                          className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                          viewBox="0 0 60 30"
                          xmlns="http://www.w3.org/2000/svg">
                          <clipPath id="s2">
                            <path d="M0,0 v30 h60 v-30 z" />
                          </clipPath>
                          <clipPath id="t2">
                            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                          </clipPath>
                          <g clipPath="url(#s2)">
                            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                            <path
                              d="M0,0 L60,30 M60,0 L0,30"
                              stroke="#fff"
                              strokeWidth="6"
                            />
                            <path
                              d="M0,0 L60,30 M60,0 L0,30"
                              clipPath="url(#t2)"
                              stroke="#C8102E"
                              strokeWidth="4"
                            />
                            <path
                              d="M30,0 v30 M0,15 h60"
                              stroke="#fff"
                              strokeWidth="10"
                            />
                            <path
                              d="M30,0 v30 M0,15 h60"
                              stroke="#C8102E"
                              strokeWidth="6"
                            />
                          </g>
                        </svg>
                        <span className="font-medium">English</span>
                        {language === "en" && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage("vi");
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                          language === "vi"
                            ? "bg-orange-500/10 text-orange-500"
                            : "hover:bg-[var(--bg-base)]"
                        }`}
                        style={{
                          color: language === "vi" ? undefined : "var(--text)",
                        }}>
                        <svg
                          className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                          viewBox="0 0 3 2"
                          xmlns="http://www.w3.org/2000/svg">
                          <rect width="3" height="2" fill="#DA251D" />
                          <polygon
                            points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                            fill="#FF0"
                          />
                        </svg>
                        <span className="font-medium">Tiếng Việt</span>
                        {language === "vi" && (
                          <svg
                            className="w-4 h-4 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <ThemeToggle />
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/tenants")}>
                {t("tenants.create.back")}
              </Button>
            </div>
          </div>

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

                  <Form.Item
                    name="addressLine2"
                    rules={[
                      {
                        required: true,
                        message: t(
                          "tenants.create.validation.street_name_required",
                        ),
                      },
                    ]}>
                    <Input
                      size="large"
                      placeholder={t(
                        "tenants.create.fields.address_line2_placeholder",
                      )}
                    />
                  </Form.Item>

                  <Form.Item
                    name="addressLine3"
                    rules={[
                      {
                        required: true,
                        message: t("tenants.create.validation.city_required"),
                      },
                    ]}>
                    <Input
                      size="large"
                      placeholder={t(
                        "tenants.create.fields.address_line3_placeholder",
                      )}
                    />
                  </Form.Item>

                  <Form.Item
                    name="addressLine4"
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
    </div>
  );
};

export default TenantCreatePage;
