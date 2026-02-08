"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
import { tenantService } from "@/lib/services/tenantService";
import { TenantCreateInput } from "@/lib/types/tenant";
import {
  ArrowLeftOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { FormProps } from "antd";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const TenantFormPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [form] = Form.useForm<TenantCreateInput>();
  const [formData, setFormData] = useState<Partial<TenantCreateInput>>({
    plan: "basic",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const tenantId = params.id as string;
  const isEditMode = tenantId !== "create";

  useEffect(() => {
    if (isEditMode) {
      fetchTenantDetails();
    } else {
      setInitialLoading(false);
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setInitialLoading(true);
      const data = await tenantService.getTenantById(tenantId);

      const displayValue = data.networkIp || data.hostName;
      const cleanHostname = displayValue.replace(/\.restx\.food$/i, "");

      const formValues = {
        name: data.name,
        hostName: cleanHostname,
        businessName: data.businessName,
        phoneNumber: data.phoneNumber,
        mailRestaurant: data.mailRestaurant,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        addressLine3: data.addressLine3,
        addressLine4: data.addressLine4,
        ownerEmail: data.ownerEmail,
        plan: data.plan || "basic",
      };

      // Set both form and state to ensure controlled input works correctly
      form.setFieldsValue(formValues);
      setFormData(formValues);
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
      message.error(t("tenants.toasts.detail_error_message"));
      router.push("/tenants");
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish: FormProps<TenantCreateInput>["onFinish"] = async (values) => {
    // Prevent duplicate submissions
    if (loading) {
      console.warn("Form submission already in progress");
      return;
    }

    console.log('[onFinish] Form values:', values);
    console.log('[onFinish] Is edit mode:', isEditMode);
    console.log('[onFinish] Tenant ID:', tenantId);

    setLoading(true);

    try {
      // Prepare the full hostname with .restx.food suffix
      // In edit mode, use formData.hostName (from disabled field)
      // In create mode, use values.hostName (from form input)
      const hostnameValue = isEditMode ? formData.hostName : values.hostName;
      const hostname = hostnameValue ? `${hostnameValue}.restx.food` : undefined;
      
      const requestData = {
        ...values,
        hostName: hostname,
        networkIp: hostname,
      };

      console.log('[onFinish] Request data with full hostname:', requestData);

      if (isEditMode) {
        console.log('[onFinish] Calling updateTenant...');
        const result = await tenantService.updateTenant(tenantId, requestData);
        console.log('[onFinish] Update successful, result:', result);
        message.success(t("tenants.toasts.update_success_message"));
      } else {
        console.log('[onFinish] Calling createTenant...');
        const result = await tenantService.createTenant(requestData);
        console.log('[onFinish] Create successful, result:', result);
        message.success(t("tenants.toasts.create_success_message"));
      }
      router.push("/tenants");
    } catch (error: any) {
      console.error("Failed to save tenant:", error);
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

  // Slug validation: only lowercase letters, numbers, and hyphens
  const validateSlug = (_: unknown, value: string) => {
    // Skip validation in edit mode (field is disabled)
    if (isEditMode) {
      return Promise.resolve();
    }
    
    // In create mode, hostname is optional
    if (!value) {
      return Promise.resolve();
    }
    
    // If provided, must follow slug format
    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(
        new Error(t("tenants.create.validation.slug_invalid")),
      );
    }
    return Promise.resolve();
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
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
                    title: isEditMode
                      ? t("tenants.edit.breadcrumb_edit")
                      : t("tenants.create.breadcrumb_create"),
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
                  {isEditMode
                    ? t("tenants.edit.title")
                    : t("tenants.create.title")}
                </span>
              </Title>
              <Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}>
                {isEditMode
                  ? t("tenants.edit.subtitle")
                  : t("tenants.create.subtitle")}
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
                {isEditMode ? t("tenants.edit.back") : t("tenants.create.back")}
              </Button>
            </div>
          </div>

          {/* --- Main Form --- */}
          <Spin spinning={initialLoading} size="large">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={formData}
              requiredMark="optional"
              style={{ opacity: initialLoading ? 0 : 1 }}>
              <Row gutter={[24, 24]}>
                {/* Left Column: Restaurant Info */}
                <Col xs={24} lg={14}>
                  <Card
                    variant="borderless"
                    className="shadow-md h-full"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                    title={
                      <Title
                        level={5}
                        style={{ margin: 0, color: "var(--text)" }}>
                        {t("tenants.create.restaurant_info")}
                      </Title>
                    }>
                    <Form.Item
                      label={
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
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
                        className="text-sm"
                        placeholder={t("tenants.create.fields.name_placeholder")}
                        prefix={<ShopOutlined className="text-gray-400 mr-1" />}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {t("tenants.create.fields.host_name")} (optional)
                        </span>
                      }
                      name="hostName"
                      rules={[{ validator: validateSlug }]}
                      extra={
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-muted)" }}>
                          {isEditMode
                            ? t("tenants.create.fields.hostname_disabled_text")
                            : `${t("tenants.create.fields.access_url")} hostname.restx.food`}
                        </span>
                      }>
                      <Space.Compact className="w-full" size="large">
                        <Input
                          disabled
                          value="https://"
                          className="text-center flex-none"
                          style={{
                            background: "var(--bg-base)",
                            color: "var(--text-muted)",
                            cursor: "default",
                            width: "90px",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        />
                        <Input
                          placeholder={t(
                            "tenants.create.fields.host_name_placeholder",
                          )}
                          prefix={
                            <GlobalOutlined className="text-gray-400 mr-1" />
                          }
                          value={formData.hostName || ""}
                          disabled={isEditMode}
                          style={{
                            fontSize: "14px",
                            ...(isEditMode && {
                              color: "var(--text)",
                              cursor: "not-allowed",
                              opacity: 1,
                            }),
                          }}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "");
                            form.setFieldValue("hostName", value);
                            setFormData({ ...formData, hostName: value });
                          }}
                        />
                        <Input
                          disabled
                          value=".restx.food"
                          className="text-center flex-none"
                          style={{
                            background: "var(--bg-base)",
                            color: "var(--text-muted)",
                            cursor: "default",
                            width: "120px",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        />
                      </Space.Compact>
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
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
                          className="text-sm"
                          placeholder={t("tenants.create.fields.business_name_placeholder")}
                          prefix={
                            <ShopOutlined className="text-gray-400 mr-1" />
                          }
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.create.fields.phone_number")}
                          </span>
                        }
                        name="phoneNumber"
                        rules={[
                          {
                            required: true,
                            message: t(
                              "tenants.create.validation.phone_required",
                            ),
                          },
                          {
                            pattern: /^[0-9]{10,11}$/,
                            message: t(
                              "tenants.create.validation.phone_invalid",
                            ),
                          },
                        ]}>
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.create.fields.phone_placeholder")}
                          prefix={
                            <PhoneOutlined className="text-gray-400 mr-1" />
                          }
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      label={
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
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
                        className="text-sm"
                        type="email"
                        placeholder={t("tenants.create.fields.mail_restaurant_placeholder")}
                        prefix={<MailOutlined className="text-gray-400 mr-1" />}
                      />
                    </Form.Item>

                    <div className="space-y-3">
                      <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}>
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
                          className="text-sm"
                          placeholder={t("tenants.create.fields.address_line1_placeholder")}
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
                          className="text-sm"
                          placeholder={t("tenants.create.fields.address_line2_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        name="addressLine3"
                        rules={[
                          {
                            required: true,
                            message: t(
                              "tenants.create.validation.city_required",
                            ),
                          },
                        ]}>
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.create.fields.address_line3_placeholder")}
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
                          className="text-sm"
                          placeholder={t("tenants.create.fields.address_line4_placeholder")}
                        />
                      </Form.Item>
                    </div>
                  </Card>
                </Col>

                {/* Right Column: Owner & Plan */}
                <Col xs={24} lg={10}>
                  <div className="flex flex-col gap-6 h-full">
                    {/* Owner Info Card */}
                    <Card
                      variant="borderless"
                      className="shadow-md"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                      title={
                        <Title
                          level={5}
                          style={{ margin: 0, color: "var(--text)" }}>
                          {t("tenants.create.owner_info")}
                        </Title>
                      }>
                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.create.fields.owner_email")}
                          </span>
                        }
                        name="ownerEmail"
                        rules={[
                          {
                            required: !isEditMode,
                            message: t(
                              "tenants.create.validation.email_required",
                            ),
                          },
                          {
                            type: "email",
                            message: t(
                              "tenants.create.validation.email_invalid",
                            ),
                          },
                        ]}>
                        <Input
                          className="text-sm"
                          type="email"
                          placeholder={t("tenants.create.fields.owner_email_placeholder")}
                          prefix={
                            <MailOutlined className="text-gray-400 mr-1" />
                          }
                        />
                      </Form.Item>

                      {!isEditMode && (
                        <Form.Item
                          label={
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}>
                              {t("tenants.create.fields.owner_password")}
                            </span>
                          }
                          name="ownerPassword"
                          rules={[
                            {
                              required: true,
                              message: t(
                                "tenants.create.validation.password_required",
                              ),
                            },
                            {
                              min: 6,
                              message: t(
                                "tenants.create.validation.password_min",
                              ),
                            },
                          ]}>
                          <Input.Password
                            className="text-sm"
                            placeholder={t("tenants.create.fields.password_placeholder")}
                          />
                        </Form.Item>
                      )}
                    </Card>

                    {/* Plan Selection Card */}
                    <Card
                      variant="borderless"
                      className="shadow-md flex-1"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                      title={
                        <Title
                          level={5}
                          style={{ margin: 0, color: "var(--text)" }}>
                          {t("tenants.create.subscription_plan")}
                        </Title>
                      }>
                      <Form.Item
                        name="plan"
                        rules={[
                          {
                            required: true,
                            message: t(
                              "tenants.create.validation.plan_required",
                            ),
                          },
                        ]}>
                        <Select
                          className="text-sm"
                          placeholder={t("tenants.create.fields.plan_placeholder")}>
                          <Select.Option value="basic">
                            <span className="font-medium text-emerald-500 text-sm">
                              {t("tenants.create.plan_options.basic")}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-2">
                              {t("tenants.create.plan_options.basic_desc")}
                            </span>
                          </Select.Option>
                          <Select.Option value="pro">
                            <span className="font-medium text-blue-500 text-sm">
                              {t("tenants.create.plan_options.pro")}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-2">
                              {t("tenants.create.plan_options.pro_desc")}
                            </span>
                          </Select.Option>
                          <Select.Option value="enterprise">
                            <span className="font-medium text-purple-500 text-sm">
                              {t("tenants.create.plan_options.enterprise")}
                            </span>
                            <span className="text-gray-400 text-[11px] ml-2">
                              {t("tenants.create.plan_options.enterprise_desc")}
                            </span>
                          </Select.Option>
                        </Select>
                      </Form.Item>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-auto border-t border-dashed border-gray-200 dark:border-gray-700">
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          disabled={loading}
                          size="large"
                          block
                          className="shadow-orange-900/20 shadow-lg border-none h-12 text-base font-medium">
                          {isEditMode
                            ? t("tenants.edit.buttons.update")
                            : t("tenants.create.buttons.create")}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          size="large"
                          block
                          type="text"
                          className="mt-2 text-gray-500">
                          {t("tenants.create.buttons.cancel")}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </Col>
              </Row>
            </Form>
          </Spin>
        </div>
      </main>
    </div>
  );
};

export default TenantFormPage;
