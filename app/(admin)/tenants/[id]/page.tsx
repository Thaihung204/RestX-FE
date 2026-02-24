"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
import { tenantService } from "@/lib/services/tenantService";
import { TenantUpdateInput } from "@/lib/types/tenant";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { FormProps } from "antd";
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
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

const TenantEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const { message } = App.useApp();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [form] = Form.useForm<TenantUpdateInput>();
  const [formData, setFormData] = useState<Partial<TenantUpdateInput>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const tenantId = params.id as string;

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setInitialLoading(true);
      const data = await tenantService.getTenantConfig(tenantId);

      if (!data) {
        message.error(t("tenants.toasts.detail_error_message"));
        router.push("/tenants");
        return;
      }

      const displayValue = data.networkIp || data.hostname;
      const cleanHostname = displayValue?.replace(/\.restx\.food$/i, "") || "";

      const formValues: Partial<TenantUpdateInput> = {
        name: data.name,
        hostname: cleanHostname,
        prefix: data.prefix,
        
        // Branding
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        backgroundUrl: data.backgroundUrl,
        
        // Theme Colors
        primaryColor: data.primaryColor,
        baseColor: data.baseColor,
        secondaryColor: data.secondaryColor,
        headerColor: data.headerColor,
        footerColor: data.footerColor,
        lightBaseColor: data.lightBaseColor,
        lightSurfaceColor: data.lightSurfaceColor,
        lightCardColor: data.lightCardColor,
        darkBaseColor: data.darkBaseColor,
        darkSurfaceColor: data.darkSurfaceColor,
        darkCardColor: data.darkCardColor,
        
        // Network
        networkIp: data.networkIp,
        connectionString: data.connectionString,
        status: data.status,
        expiredAt: data.expiredAt,
        
        // Business Info
        businessName: data.businessName,
        aboutUs: data.aboutUs,
        aboutUsType: data.aboutUsType,
        overview: data.overview,
        businessAddressLine1: data.businessAddressLine1,
        businessAddressLine2: data.businessAddressLine2,
        businessAddressLine3: data.businessAddressLine3,
        businessAddressLine4: data.businessAddressLine4,
        businessCounty: data.businessCounty,
        businessPostCode: data.businessPostCode,
        businessCountry: data.businessCountry,
        businessPrimaryPhone: data.businessPrimaryPhone,
        businessSecondaryPhone: data.businessSecondaryPhone,
        businessEmailAddress: data.businessEmailAddress,
        businessCompanyNumber: data.businessCompanyNumber,
        businessOpeningHours: data.businessOpeningHours,
      };

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

  const onFinish: FormProps<TenantUpdateInput>["onFinish"] = async (values) => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const hostname = formData.hostname
        ? `${formData.hostname}.restx.food`
        : undefined;

      const requestData: any = {
        ...values,
        id: tenantId,
        hostname: hostname,
        networkIp: hostname,
      };

      await tenantService.upsertTenant(requestData);
      message.success(t("tenants.toasts.update_success_message"));
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

  const handleDeleteClick = () => {
    setDeleteModalVisible(true);
    setConfirmInput("");
  };

  const handleDeleteConfirm = async () => {
    if (confirmInput !== formData.name) {
      message.error("Tenant name does not match. Please try again.");
      return;
    }

    setDeleting(true);
    try {
      await tenantService.deleteTenant(tenantId);
      message.success(t("tenants.toasts.delete_success_message") || "Tenant deleted successfully");
      router.push("/tenants");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("tenants.toasts.delete_error_message") ||
        "Failed to delete tenant";
      message.error(errorMessage);
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setConfirmInput("");
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
                    title: t("tenants.edit.breadcrumb_edit"),
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
                  {t("tenants.edit.title")}
                </span>
              </Title>
              <Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}>
                {t("tenants.edit.subtitle")}
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
                {t("tenants.edit.back")}
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
                        placeholder={t(
                          "tenants.create.fields.name_placeholder",
                        )}
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
                      extra={
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-muted)" }}>
                          {t("tenants.create.fields.hostname_disabled_text")}
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
                          value={formData.hostname || ""}
                          disabled={true}
                          style={{
                            fontSize: "14px",
                            color: "var(--text)",
                            cursor: "not-allowed",
                            opacity: 1,
                          }}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "");
                            form.setFieldValue("hostname", value);
                            setFormData({ ...formData, hostname: value });
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
                          placeholder={t(
                            "tenants.create.fields.business_name_placeholder",
                          )}
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
                        name="businessPrimaryPhone"
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
                          placeholder={t(
                            "tenants.create.fields.phone_placeholder",
                          )}
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
                        placeholder={t(
                          "tenants.create.fields.mail_restaurant_placeholder",
                        )}
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
                        name="businessAddressLine1"
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
                          placeholder={t(
                            "tenants.create.fields.address_line1_placeholder",
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        name="businessAddressLine2"
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
                          placeholder={t(
                            "tenants.create.fields.address_line2_placeholder",
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        name="businessAddressLine3"
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
                          placeholder={t(
                            "tenants.create.fields.address_line3_placeholder",
                          )}
                        />
                      </Form.Item>

                      <Form.Item
                        name="businessAddressLine4"
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
                          placeholder={t(
                            "tenants.create.fields.address_line4_placeholder",
                          )}
                        />
                      </Form.Item>
                    </div>

                    {/* Extended Business Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.county")}
                          </span>
                        }
                        name="businessCounty">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.county_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.post_code")}
                          </span>
                        }
                        name="businessPostCode">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.post_code_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.country")}
                          </span>
                        }
                        name="businessCountry">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.country_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.company_number")}
                          </span>
                        }
                        name="businessCompanyNumber">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.company_number_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.secondary_phone")}
                          </span>
                        }
                        name="businessSecondaryPhone">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.secondary_phone_placeholder")}
                          prefix={
                            <PhoneOutlined className="text-gray-400 mr-1" />
                          }
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.opening_hours")}
                          </span>
                        }
                        name="businessOpeningHours">
                        <Input
                          className="text-sm"
                          placeholder={t("tenants.edit.fields.opening_hours_placeholder")}
                        />
                      </Form.Item>
                    </div>

                    {/* About Us & Overview */}
                    <div className="space-y-3 mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                      <Form.Item
                        label={
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.about_us")}
                          </span>
                        }
                        name="aboutUs">
                        <TextArea
                          className="text-sm"
                          rows={4}
                          placeholder={t("tenants.edit.fields.about_us_placeholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-muted)" }}>
                            {t("tenants.edit.fields.overview")}
                          </span>
                        }
                        name="overview">
                        <TextArea
                          className="text-sm"
                          rows={3}
                          placeholder={t("tenants.edit.fields.overview_placeholder")}
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
                            {t("tenants.create.fields.mail_restaurant")}
                          </span>
                        }
                        name="businessEmailAddress"
                        rules={[
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
                          placeholder={t(
                            "tenants.create.fields.mail_restaurant_placeholder",
                          )}
                          prefix={
                            <MailOutlined className="text-gray-400 mr-1" />
                          }
                        />
                      </Form.Item>
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
                          placeholder={t(
                            "tenants.create.fields.plan_placeholder",
                          )}>
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
                        {/* Save Changes */}
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          disabled={loading}
                          size="large"
                          block
                          className="shadow-orange-900/20 shadow-lg border-none h-12 text-base font-medium">
                        {t("tenants.edit.buttons.update")}
                        </Button>

                        {/* Delete Tenant */}
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleDeleteClick}
                          size="large"
                          block
                          className="mt-2 border-red-500 text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950">
                          {t("tenants.edit.buttons.delete")}
                        </Button>

                        {/* Cancel */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-red-500 text-2xl" />
            <span className="text-lg font-semibold">{t("tenants.edit.delete_modal.title")}</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <Button key="cancel" onClick={handleDeleteCancel} size="large">
            {t("tenants.edit.delete_modal.button_cancel")}
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleting}
            disabled={confirmInput !== formData.name || deleting}
            onClick={handleDeleteConfirm}
            size="large"
            icon={<DeleteOutlined />}>
            {t("tenants.edit.delete_modal.button_delete")}
          </Button>,
        ]}
        width={520}>
        <div className="py-4 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              {t("tenants.edit.delete_modal.warning_title")}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {t("tenants.edit.delete_modal.warning_description")}
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside mt-2 space-y-1">
              <li>{t("tenants.edit.delete_modal.warning_items.data")}</li>
              <li>{t("tenants.edit.delete_modal.warning_items.users")}</li>
              <li>{t("tenants.edit.delete_modal.warning_items.transactions")}</li>
              <li>{t("tenants.edit.delete_modal.warning_items.assets")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {t("tenants.edit.delete_modal.confirm_instruction")}
            </p>
            <p className="text-base font-semibold px-3 py-2 rounded" style={{ backgroundColor: "var(--bg-base)", color: "var(--text)" }}>
              {formData.name}
            </p>
          </div>

          <Input
            placeholder={t("tenants.edit.delete_modal.input_placeholder")}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            size="large"
            autoFocus
            onPressEnter={() => {
              if (confirmInput === formData.name) {
                handleDeleteConfirm();
              }
            }}
          />

          {confirmInput && confirmInput !== formData.name && (
            <p className="text-sm text-red-500 mt-1">
              {t("tenants.edit.delete_modal.name_mismatch")}
            </p>
          )}
          {confirmInput === formData.name && (
            <p className="text-sm text-green-500 mt-1">
              {t("tenants.edit.delete_modal.name_match")}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TenantEditPage;
