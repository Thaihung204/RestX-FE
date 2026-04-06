"use client";

import VnAddressSelect from "@/components/ui/VnAddressSelect";
import VnStreetAutocomplete from "@/components/ui/VnStreetAutocomplete";
import { tenantService } from "@/lib/services/tenantService";
import { TenantUpdateInput } from "@/lib/types/tenant";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined
} from "@ant-design/icons";
import type { FormProps, UploadFile } from "antd";
import {
  App,
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  Modal,
  Spin,
  Switch,
  Typography,
  Upload
} from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;
const TENANTS_BRAND_LOGO = "https://res.cloudinary.com/dzz8yqhcr/image/upload/v1773461233/DemoRestaurant/LogoUrl/logo.png";

const customStyles = `
  .tenant-delete-modal .ant-modal-root,
  .tenant-delete-modal .ant-modal-mask,
  .tenant-delete-modal .ant-modal-wrap {
    position: fixed !important;
    inset: 0 !important;
  }

  .tenant-delete-modal .ant-modal-wrap {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

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

  .tenant-form .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):focus,
  .tenant-form .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover,
  .tenant-form .ant-input-affix-wrapper-focused,
  .tenant-form .ant-input:not([disabled]):focus,
  .tenant-form .ant-input:not([disabled]):hover {
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
  }

  .url-bar-disabled {
    background: var(--ant-color-bg-container-disabled, rgba(0,0,0,0.04)) !important;
    cursor: not-allowed;
    opacity: 0.7;
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

  .url-bar .url-segment {
    font-size: 14px;
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
    color: #6b7280;
  }

  .branding-upload-box {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
  }

  .branding-preview {
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--card);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .tenant-image-dragger.ant-upload-wrapper .ant-upload-drag {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    border-radius: 10px;
  }

  .tenant-image-dragger.ant-upload-wrapper .ant-upload-btn {
    padding: 0 !important;
  }

  .tenant-image-dragger:hover .branding-preview {
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.25);
  }

  .tenant-form .ant-color-picker {
    width: 100% !important;
  }

  .tenant-form .ant-color-picker-trigger {
    width: 100% !important;
    background: var(--card) !important;
    border: 1px solid var(--border) !important;
    height: 44px !important;
    padding: 0 16px !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
  }

  .tenant-form .ant-color-picker-trigger .ant-color-picker-color-block {
    width: 24px !important;
    height: 24px !important;
    border-radius: 6px !important;
  }

  .tenant-form .ant-color-picker-trigger .ant-color-picker-trigger-text {
    color: var(--text) !important;
    margin-left: 12px !important;
  }

  .tenant-form .ant-color-picker-trigger:hover {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1) !important;
  }

  .branding-preview-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 12px;
  }
`;

const COLOR_FIELD_NAMES: Array<keyof TenantUpdateInput> = [
  "primaryColor",
  "lightBaseColor",
  "lightSurfaceColor",
  "lightCardColor",
  "darkBaseColor",
  "darkSurfaceColor",
  "darkCardColor",
];

const TenantEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantUpdateInput>();
  const [formData, setFormData] = useState<Partial<TenantUpdateInput>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<boolean>(true);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);
  const [backgroundFileList, setBackgroundFileList] = useState<UploadFile[]>([]);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string>("");
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string>("");
  const tenantId = params.id as string;

  const getRawFile = (fileList: UploadFile[]): File | null => {
    const raw = fileList?.[0]?.originFileObj;
    return raw instanceof File ? raw : null;
  };

  const toDataUrl = (file: File, setter: (url: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setter((reader.result as string) || "");
    reader.readAsDataURL(file);
  };

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

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  useEffect(() => {
    if (!deleteModalVisible) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [deleteModalVisible]);


  const fetchTenantDetails = async () => {
    try {
      setInitialLoading(true);
      const data = await tenantService.getTenantConfig(tenantId);

      if (!data) {
        message.error(t("tenants.toasts.detail_error_message"));
        router.push("/tenants");
        return;
      }

      const cleanHostname =
        data.hostname?.replace(/\.restx\.food$/i, "") || "";

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
        tenantSettings: JSON.stringify(data.tenantSettings ?? [], null, 2),
        createdDate: data.createdDate,
        modifiedDate: data.modifiedDate,
        createdBy: data.createdBy,
        modifiedBy: data.modifiedBy,
      };

      form.setFieldsValue(formValues);
      setFormData(formValues);
      setLogoPreviewUrl(formValues.logoUrl || "");
      setFaviconPreviewUrl(formValues.faviconUrl || "");
      setBackgroundPreviewUrl(formValues.backgroundUrl || "");

      setTenantStatus(
        typeof data.status === "boolean" ? data.status : data.status === true,
      );
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
      const hostname = values.hostname
        ? `${values.hostname}.restx.food`
        : undefined;

      const colorValues = COLOR_FIELD_NAMES.reduce(
        (acc, field) => ({ ...acc, [field]: form.getFieldValue(field) }),
        {} as Partial<TenantUpdateInput>,
      );

      const requestData: TenantUpdateInput = {
        ...values,
        ...colorValues,
        id: tenantId,
        hostname,
        networkIp: formData.networkIp || hostname,
        connectionString: formData.connectionString,
        expiredAt: formData.expiredAt,
        status: tenantStatus,
        tenantSettings: undefined,
        createdDate: undefined,
        modifiedDate: undefined,
        createdBy: undefined,
        modifiedBy: undefined,
      };

      await tenantService.upsertTenant(requestData, {
        logo: getRawFile(logoFileList),
        favicon: getRawFile(faviconFileList),
        background: getRawFile(backgroundFileList),
      });
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
      message.error(t("tenants.edit.delete_modal.name_mismatch"));
      return;
    }

    setDeleting(true);
    try {
      await tenantService.deleteTenant(tenantId);
      message.success(t("tenants.toasts.delete_success_message"));
      router.push("/tenants");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("tenants.toasts.delete_error_message");
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
    <>
      <style>{customStyles}</style>
      <main
        className="px-6 lg:px-8 py-8 flex-1"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* --- Main Form --- */}
          <Spin spinning={initialLoading} size="large">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={formData}
              className="tenant-form"
              style={{ opacity: initialLoading ? 0 : 1 }}>
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Restaurant Information */}
                <Card
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.create.fields.prefix")}
                        </span>
                      }
                      name="prefix">
                      <Input
                        size="large"
                        placeholder={t("tenants.create.fields.prefix_placeholder")}
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
                      name="hostname"
                      extra={
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-muted)" }}>
                          {t("tenants.create.fields.hostname_disabled_text")}
                        </span>
                      }>
                      <div className="url-bar url-bar-disabled">
                        <span className="url-segment">https://</span>
                        <Input
                          disabled
                          value={formData.hostname || ""}
                          placeholder={t(
                            "tenants.create.fields.host_name_placeholder",
                          )}
                        />
                        <span className="url-segment">.restx.food</span>
                      </div>
                    </Form.Item>
                  </div>

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
                          message: t("tenants.create.validation.phone_invalid"),
                        },
                      ]}>
                      <Input
                        size="large"
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
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}>
                        {t("tenants.create.fields.mail_restaurant")}
                      </span>
                    }
                    name="businessEmailAddress"
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
                      name="businessAddressLine1"
                      rules={[
                        {
                          required: true,
                          message: t(
                            "tenants.create.validation.street_number_required",
                          ),
                        },
                      ]}>
                      <VnStreetAutocomplete
                        form={form}
                        fieldName="businessAddressLine1"
                        cityFieldName="businessAddressLine3"
                        districtWardFieldName="businessAddressLine2"
                        countryFieldName="businessCountry"
                        placeholder={t("tenants.create.fields.address_line1_placeholder")}
                      />
                    </Form.Item>
                    <VnAddressSelect
                      form={form}
                      cityFieldName="businessAddressLine3"
                      districtWardFieldName="businessAddressLine2"
                      required
                      cityRequiredMessage={t("tenants.create.validation.city_required")}
                      districtRequiredMessage={t("tenants.create.validation.street_name_required")}
                      wardRequiredMessage={t("tenants.create.validation.street_name_required")}
                    />
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-dashed"
                    style={{ borderColor: "var(--border)" }}>

                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.post_code")}
                        </span>
                      }
                      name="businessPostCode">
                      <Input
                        size="large"
                        placeholder={t(
                          "tenants.edit.fields.post_code_placeholder",
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.country")}
                        </span>
                      }
                      name="businessCountry">
                      <Input
                        size="large"
                        placeholder={t(
                          "tenants.edit.fields.country_placeholder",
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.company_number")}
                        </span>
                      }
                      name="businessCompanyNumber">
                      <Input
                        size="large"
                        placeholder={t(
                          "tenants.edit.fields.company_number_placeholder",
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.secondary_phone")}
                        </span>
                      }
                      name="businessSecondaryPhone">
                      <Input
                        size="large"
                        placeholder={t(
                          "tenants.edit.fields.secondary_phone_placeholder",
                        )}
                        prefix={
                          <PhoneOutlined className="text-gray-400 mr-1" />
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.opening_hours")}
                        </span>
                      }
                      name="businessOpeningHours">
                      <Input
                        size="large"
                        placeholder={t("tenants.edit.fields.opening_hours")}
                      />
                    </Form.Item>
                  </div>

                  <div
                    className="mt-6 pt-6 border-t border-dashed"
                    style={{ borderColor: "var(--border)" }}>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.fields.about_us")}
                        </span>
                      }
                      name="aboutUs">
                      <TextArea
                        rows={4}
                        placeholder={t(
                          "tenants.edit.fields.about_us_placeholder",
                        )}
                      />
                    </Form.Item>
                  </div>
                </Card>

                <Card
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                  title={
                    <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                      {t("tenants.edit.tenant_settings.title")}
                    </Title>
                  }>
                  <Form.Item name="tenantSettings">
                    <TextArea
                      rows={4}
                      placeholder={t("tenants.edit.tenant_settings.placeholder")}
                    />
                  </Form.Item>
                </Card>

                <Card
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                  title={
                    <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                      {t("tenants.edit.system_fields.title")}
                    </Title>
                  }>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.system_fields.created_date")}
                        </span>
                      }
                      name="createdDate">
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.system_fields.modified_date")}
                        </span>
                      }
                      name="modifiedDate">
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.system_fields.created_by")}
                        </span>
                      }
                      name="createdBy">
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.system_fields.modified_by")}
                        </span>
                      }
                      name="modifiedBy">
                      <Input size="large" disabled />
                    </Form.Item>
                  </div>
                </Card>

                {/* Branding & Theme */}
                <Card
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                  title={
                    <Title
                      level={5}
                      style={{ margin: 0, color: "var(--text)" }}>
                      {t("tenants.edit.branding.title")}
                    </Title>
                  }>
                  <div className="grid grid-cols-1 gap-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label={
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--text)" }}>
                            {t("tenants.edit.branding.logo_url")}
                          </span>
                        }>
                        <div className="branding-upload-box">
                          <Upload.Dragger
                            className="tenant-image-dragger"
                            accept="image/*"
                            maxCount={1}
                            beforeUpload={() => false}
                            showUploadList={false}
                            fileList={logoFileList}
                            onChange={({ fileList }) => {
                              setLogoFileList(fileList);
                              const file = fileList?.[0]?.originFileObj;
                              if (file instanceof File) {
                                toDataUrl(file, setLogoPreviewUrl);
                              }
                            }}>
                            <div className="branding-preview h-32 flex items-center justify-center">
                              {logoPreviewUrl ? (
                                <img
                                  src={logoPreviewUrl}
                                  alt="logo preview"
                                  className="h-24 w-24 object-contain"
                                />
                              ) : (
                                <div className="branding-preview-empty h-full w-full">
                                  {t("tenants.edit.branding.logo_upload_hint")}
                                </div>
                              )}
                            </div>
                          </Upload.Dragger>
                        </div>
                      </Form.Item>

                      <Form.Item
                        label={
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--text)" }}>
                            {t("tenants.edit.branding.favicon_url")}
                          </span>
                        }>
                        <div className="branding-upload-box">
                          <Upload.Dragger
                            className="tenant-image-dragger"
                            accept="image/*"
                            maxCount={1}
                            beforeUpload={() => false}
                            showUploadList={false}
                            fileList={faviconFileList}
                            onChange={({ fileList }) => {
                              setFaviconFileList(fileList);
                              const file = fileList?.[0]?.originFileObj;
                              if (file instanceof File) {
                                toDataUrl(file, setFaviconPreviewUrl);
                              }
                            }}>
                            <div className="branding-preview h-32 flex items-center justify-center">
                              {faviconPreviewUrl ? (
                                <img
                                  src={faviconPreviewUrl}
                                  alt="favicon preview"
                                  className="h-16 w-16 object-contain"
                                />
                              ) : (
                                <div className="branding-preview-empty h-full w-full">
                                  {t("tenants.edit.branding.favicon_upload_hint")}
                                </div>
                              )}
                            </div>
                          </Upload.Dragger>
                        </div>
                      </Form.Item>
                    </div>

                    <Form.Item
                      label={
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}>
                          {t("tenants.edit.branding.background_url")}
                        </span>
                      }>
                      <div className="branding-upload-box">
                        <Upload.Dragger
                          className="tenant-image-dragger"
                          accept="image/*"
                          maxCount={1}
                          beforeUpload={() => false}
                          showUploadList={false}
                          fileList={backgroundFileList}
                          onChange={({ fileList }) => {
                            setBackgroundFileList(fileList);
                            const file = fileList?.[0]?.originFileObj;
                            if (file instanceof File) {
                              toDataUrl(file, setBackgroundPreviewUrl);
                            }
                          }}>
                          <div className="branding-preview h-44 w-full">
                            {backgroundPreviewUrl ? (
                              <img
                                src={backgroundPreviewUrl}
                                alt="background preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="branding-preview-empty h-full w-full">
                                {t("tenants.edit.branding.background_upload_hint")}
                              </div>
                            )}
                          </div>
                        </Upload.Dragger>
                      </div>
                    </Form.Item>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2">
                        <Form.Item
                          label={
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "var(--text)" }}>
                              {t("tenants.edit.branding.primary_color")}
                            </span>
                          }
                          name="primaryColor"
                          className="md:col-span-1">
                          <ColorPicker
                            showText
                            size="large"
                            format="hex"
                            className="w-full justify-start rounded-xl"
                          />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.light_base_color")}
                              </span>
                            }
                            name="lightBaseColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.light_surface_color")}
                              </span>
                            }
                            name="lightSurfaceColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.light_card_color")}
                              </span>
                            }
                            name="lightCardColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                        </div>

                        <div className="space-y-4">
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.dark_base_color")}
                              </span>
                            }
                            name="darkBaseColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.dark_surface_color")}
                              </span>
                            }
                            name="darkSurfaceColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                          <Form.Item
                            label={
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--text)" }}>
                                {t("tenants.edit.branding.dark_card_color")}
                              </span>
                            }
                            name="darkCardColor">
                            <ColorPicker
                              showText
                              size="large"
                              format="hex"
                              className="w-full justify-start rounded-xl"
                            />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  {/* Status Toggle */}
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}>
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text)" }}>
                        {t("tenants.edit.fields.status")}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}>
                        {tenantStatus
                          ? t("tenants.edit.fields.status_active")
                          : t("tenants.edit.fields.status_inactive")}
                      </span>
                    </div>
                    <Switch
                      checked={tenantStatus}
                      onChange={setTenantStatus}
                      checkedChildren={t("tenants.filter.active")}
                      unCheckedChildren={t("tenants.filter.inactive")}
                    />
                  </div>
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
                  <div className="flex gap-3">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDeleteClick}
                      size="large"
                      block
                      className="h-12 text-base font-medium">
                      {t("tenants.edit.buttons.delete")}
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
              </div>
            </Form>
          </Spin>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        getContainer={() => document.body}
        rootClassName="tenant-delete-modal"
        centered
        maskClosable={!deleting}
        keyboard={!deleting}
        title={
          <div className="flex items-center gap-3">
            <ExclamationCircleOutlined className="text-red-500 text-2xl" />
            <span className="text-lg font-semibold">
              {t("tenants.edit.delete_modal.title")}
            </span>
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
        width={520}
        styles={{
          mask: {
            backdropFilter: "blur(10px)",
            background: "var(--modal-overlay)",
          },
        }}>

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
              <li>
                {t("tenants.edit.delete_modal.warning_items.transactions")}
              </li>
              <li>{t("tenants.edit.delete_modal.warning_items.assets")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {t("tenants.edit.delete_modal.confirm_instruction")}
            </p>
            <p
              className="text-base font-semibold px-3 py-2 rounded"
              style={{
                backgroundColor: "var(--bg-base)",
                color: "var(--text)",
              }}>
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
    </>
  );
};

export default TenantEditPage;
