"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import StatusToggle from "@/components/ui/StatusToggle";
import VnAddressSelect from "@/components/ui/VnAddressSelect";
import VnStreetAutocomplete from "@/components/ui/VnStreetAutocomplete";
import { tenantService } from "@/lib/services/tenantService";
import { TenantUpdateInput } from "@/lib/types/tenant";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { FormProps, UploadFile } from "antd";
import {
  Alert,
  App,
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  Spin,
  Upload,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;
const TENANTS_BRAND_LOGO =
  "https://res.cloudinary.com/dzz8yqhcr/image/upload/v1773461233/DemoRestaurant/LogoUrl/logo.png";

interface PaymentGatewaySettings {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

const COLOR_FIELD_NAMES: Array<keyof TenantUpdateInput> = [
  "primaryColor",
  "lightBaseColor",
  "lightSurfaceColor",
  "lightCardColor",
  "darkBaseColor",
  "darkSurfaceColor",
  "darkCardColor",
];

const toHexColorString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toHexString" in value &&
    typeof (value as { toHexString?: unknown }).toHexString === "function"
  ) {
    return (value as { toHexString: () => string }).toHexString();
  }
  return undefined;
};

const normalizePaymentSettings = (
  settings: PaymentGatewaySettings,
): PaymentGatewaySettings => ({
  clientId: settings.clientId?.trim() || "",
  apiKey: settings.apiKey?.trim() || "",
  checksumKey: settings.checksumKey?.trim() || "",
});

type DetailTab = "general" | "branding" | "payment" | "system";

const TenantEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantUpdateInput>();
  const [paymentForm] = Form.useForm<PaymentGatewaySettings>();
  const [formData, setFormData] = useState<Partial<TenantUpdateInput>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<boolean>(true);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);
  const [backgroundFileList, setBackgroundFileList] = useState<UploadFile[]>([]);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string>("");
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string>("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [hasExistingPaymentSettings, setHasExistingPaymentSettings] =
    useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("general");
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
      let link = document.querySelector(
        `link[rel='${rel}']`,
      ) as HTMLLinkElement | null;
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
      const cleanHostname = data.hostname?.replace(/\.restx\.food$/i, "") || "";
      const formValues: Partial<TenantUpdateInput> = {
        name: data.name,
        hostname: cleanHostname,
        prefix: data.prefix,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        backgroundUrl: data.backgroundUrl,
        primaryColor: data.primaryColor,
        lightBaseColor: data.lightBaseColor,
        lightSurfaceColor: data.lightSurfaceColor,
        lightCardColor: data.lightCardColor,
        darkBaseColor: data.darkBaseColor,
        darkSurfaceColor: data.darkSurfaceColor,
        darkCardColor: data.darkCardColor,
        networkIp: data.networkIp,
        connectionString: data.connectionString,
        status: data.status,
        expiredAt: data.expiredAt,
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
      await fetchPaymentSettings();
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
      message.error(t("tenants.toasts.detail_error_message"));
      router.push("/tenants");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      const settings = await tenantService.getPaymentSettings(tenantId);
      if (settings) {
        const normalized = normalizePaymentSettings({
          clientId: settings.clientId || "",
          apiKey: settings.apiKey || "",
          checksumKey: settings.checksumKey || "",
        });
        paymentForm.setFieldsValue(normalized);
        setHasExistingPaymentSettings(true);
      } else {
        const emptySettings = normalizePaymentSettings({
          clientId: "",
          apiKey: "",
          checksumKey: "",
        });
        paymentForm.setFieldsValue(emptySettings);
        setHasExistingPaymentSettings(false);
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
      setHasExistingPaymentSettings(false);
      message.error(t("dashboard.settings.notifications.error_update"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const onFinish: FormProps<TenantUpdateInput>["onFinish"] = async (values) => {
    if (loading) return;
    setLoading(true);
    try {
      const hostname = values.hostname
        ? `${values.hostname}.restx.food`
        : undefined;
      const colorValues = COLOR_FIELD_NAMES.reduce((acc, field) => {
        const rawValue = form.getFieldValue(field);
        const normalizedValue = toHexColorString(rawValue);
        const fallbackValue =
          typeof rawValue === "string" ? rawValue : undefined;
        return { ...acc, [field]: normalizedValue ?? fallbackValue };
      }, {} as Partial<TenantUpdateInput>);

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

      const paymentValues = normalizePaymentSettings(
        paymentForm.getFieldsValue(),
      );
      const hasAnyPaymentCredential = [
        paymentValues.clientId,
        paymentValues.apiKey,
        paymentValues.checksumKey,
      ].some(Boolean);
      const hasAllPaymentCredential = [
        paymentValues.clientId,
        paymentValues.apiKey,
        paymentValues.checksumKey,
      ].every(Boolean);

      if (hasAnyPaymentCredential && !hasAllPaymentCredential) {
        message.error(
          t("dashboard.settings.notifications.error_update", {
            defaultValue: "Please fill all payment credentials before saving.",
          }),
        );
        return;
      }

      await tenantService.upsertTenant(requestData, {
        logo: getRawFile(logoFileList),
        favicon: getRawFile(faviconFileList),
        background: getRawFile(backgroundFileList),
      });

      if (hasAllPaymentCredential) {
        try {
          if (hasExistingPaymentSettings) {
            await tenantService.updatePaymentSettings(tenantId, paymentValues);
          } else {
            await tenantService.createPaymentSettings(tenantId, paymentValues);
          }
          setHasExistingPaymentSettings(true);
        } catch (error: any) {
          let fallbackSucceeded = false;
          try {
            if (
              error?.response?.status === 400 ||
              error?.response?.status === 404 ||
              error?.response?.status === 409
            ) {
              if (hasExistingPaymentSettings) {
                await tenantService.createPaymentSettings(
                  tenantId,
                  paymentValues,
                );
              } else {
                await tenantService.updatePaymentSettings(
                  tenantId,
                  paymentValues,
                );
              }
              setHasExistingPaymentSettings(true);
              fallbackSucceeded = true;
            }
          } catch (fallbackError) {
            console.error(
              "Fallback save payment settings failed:",
              fallbackError,
            );
            message.error(t("dashboard.settings.notifications.error_update"));
            return;
          }
          if (!fallbackSucceeded) {
            console.error("Failed to save payment settings:", error);
            message.error(t("dashboard.settings.notifications.error_update"));
            return;
          }
        }
      }

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

  const handleCancel = () => router.push("/tenants");
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

  const handleStatusToggle = () => {
    if (tenantStatus) {
      setDeactivateModalVisible(true);
    } else {
      setActivateModalVisible(true);
    }
  };

  const TABS: { key: DetailTab; label: string }[] = [
    { key: "general", label: t("tenants.detail_tabs.general") },
    { key: "branding", label: t("tenants.detail_tabs.branding") },
    { key: "payment", label: t("tenants.detail_tabs.payment") },
    { key: "system", label: t("tenants.detail_tabs.system") },
  ];

  const labelStyle = "td-field-label";

  /* ΓöÇΓöÇΓöÇΓöÇΓöÇ TAB: General Info ΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const renderGeneralTab = () => (
    <div className="td-tab-content">
      {/* Hero Pulse Card */}
      <div className="td-hero-card">
        <div className="td-hero-glow" />
        <div className="td-hero-content">
          <div>
            <h2 className="td-hero-title">{t("tenants.detail_tabs.general_profile")}</h2>
            <p className="td-hero-desc">{t("tenants.detail_tabs.general_profile_desc")}</p>
          </div>
          <div className="td-hero-badge">
            <StatusToggle
              checked={tenantStatus}
              onChange={handleStatusToggle}
              ariaLabel={t("tenants.edit.fields.status")}
            />
            <span className="td-hero-badge-text">
              {tenantStatus ? t("tenants.edit.fields.status_active") : t("tenants.edit.fields.status_inactive")}
            </span>
          </div>
        </div>
      </div>

      {/* Form Grid Card */}
      <div className="td-glass-card">
        <div className="td-form-grid">
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.create.fields.name")}</span>}
            name="name"
            rules={[{ required: true, message: t("tenants.create.validation.name_required") }]}>
            <Input size="large" prefix={<ShopOutlined />} />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.create.fields.business_name")}</span>}
            name="businessName"
            rules={[{ required: true, message: t("tenants.create.validation.business_name_required") }]}>
            <Input size="large" prefix={<ShopOutlined />} />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.create.fields.prefix")}</span>}
            name="prefix">
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.create.fields.host_name")}</span>}
            name="hostname"
            extra={<span className="td-field-extra">{t("tenants.create.fields.hostname_disabled_text")}</span>}>
            <div className="flex flex-col gap-3">
              <div className="td-url-bar">
                <span className="td-url-segment">https://</span>
                <Input disabled value={formData.hostname || ""} />
                <span className="td-url-segment">.restx.food</span>
              </div>
              <Alert
                message={t("tenants.edit.custom_domain_notice.title")}
                description={t("tenants.edit.custom_domain_notice.description")}
                type="info"
                showIcon
                className="bg-sky-500/10 border-sky-500/20 [&_.ant-alert-message]:text-sky-600 dark:[&_.ant-alert-message]:text-sky-400 [&_.ant-alert-description]:text-slate-600 dark:[&_.ant-alert-description]:text-slate-300 [&_.ant-alert-icon]:text-sky-600 dark:[&_.ant-alert-icon]:text-sky-400"
              />
            </div>
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.create.fields.phone_number")}</span>}
            name="businessPrimaryPhone"
            rules={[
              { required: true, message: t("tenants.create.validation.phone_required") },
              { pattern: /^[0-9]{10,11}$/, message: t("tenants.create.validation.phone_invalid") },
            ]}>
            <Input size="large" prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("tenants.edit.fields.secondary_phone")}</span>}
            name="businessSecondaryPhone">
            <Input size="large" prefix={<PhoneOutlined />} />
          </Form.Item>

          <div className="td-col-span-2">
            <Form.Item
              label={<span className={labelStyle}>{t("tenants.create.fields.mail_restaurant")}</span>}
              name="businessEmailAddress"
              rules={[
                { required: true, message: t("tenants.create.validation.restaurant_email_required") },
                { type: "email", message: t("tenants.create.validation.email_invalid") },
              ]}>
              <Input size="large" type="email" prefix={<MailOutlined />} />
            </Form.Item>
          </div>

          <div className="td-col-span-2">
            <div className="space-y-3">
              <label className={labelStyle}>{t("tenants.create.fields.address")}</label>
              <Form.Item
                name="businessAddressLine1"
                rules={[{ required: true, message: t("tenants.create.validation.street_number_required") }]}>
                <VnStreetAutocomplete
                  form={form}
                  fieldName="businessAddressLine1"
                  cityFieldName="businessAddressLine3"
                  districtWardFieldName="businessAddressLine2"
                  countryFieldName="businessCountry"
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
          </div>

          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.fields.post_code")}</span>} name="businessPostCode">
            <Input size="large" />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.fields.country")}</span>} name="businessCountry">
            <Input size="large" />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.fields.company_number")}</span>} name="businessCompanyNumber">
            <Input size="large" />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.fields.opening_hours")}</span>} name="businessOpeningHours">
            <Input size="large" />
          </Form.Item>

          <div className="td-col-span-2">
            <Form.Item label={<span className={labelStyle}>{t("tenants.edit.fields.about_us")}</span>} name="aboutUs">
              <TextArea rows={4} />
            </Form.Item>
          </div>
        </div>
      </div>

      {/* Bottom Info Cards */}
      <div className="td-info-grid">
        <div className="td-info-card">
          <span className="td-info-label">{t("tenants.edit.system_fields.created_date")}</span>
          <span className="td-info-value">{formData.createdDate || "--"}</span>
        </div>
        <div className="td-info-card">
          <span className="td-info-label">{t("tenants.edit.system_fields.modified_date")}</span>
          <span className="td-info-value">{formData.modifiedDate || "--"}</span>
        </div>
        <div className="td-info-card">
          <span className="td-info-label">{t("tenants.edit.tenant_settings.title")}</span>
          <span className="td-info-value td-info-link" onClick={() => setActiveTab("system")}>{t("tenants.detail_tabs.view_details")}</span>
        </div>
      </div>
    </div>
  );

  /* ΓöÇΓöÇΓöÇΓöÇΓöÇ TAB: Branding & Theme ΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const renderBrandingTab = () => (
    <div className="td-tab-content">
      <div className="td-glass-card">
        <h3 className="td-section-title">{t("tenants.edit.branding.title")}</h3>
        <div className="td-form-grid">
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.logo_url")}</span>}>
            <div className="td-upload-zone">
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
                  if (file instanceof File) toDataUrl(file, setLogoPreviewUrl);
                }}>
                <div className="td-upload-preview">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="logo preview" className="h-24 w-24 object-contain" />
                  ) : (
                    <span className="td-upload-hint">{t("tenants.edit.branding.logo_upload_hint")}</span>
                  )}
                </div>
              </Upload.Dragger>
            </div>
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.favicon_url")}</span>}>
            <div className="td-upload-zone">
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
                  if (file instanceof File) toDataUrl(file, setFaviconPreviewUrl);
                }}>
                <div className="td-upload-preview">
                  {faviconPreviewUrl ? (
                    <img src={faviconPreviewUrl} alt="favicon preview" className="h-16 w-16 object-contain" />
                  ) : (
                    <span className="td-upload-hint">{t("tenants.edit.branding.favicon_upload_hint")}</span>
                  )}
                </div>
              </Upload.Dragger>
            </div>
          </Form.Item>

          <div className="td-col-span-2">
            <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.background_url")}</span>}>
              <div className="td-upload-zone">
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
                    if (file instanceof File) toDataUrl(file, setBackgroundPreviewUrl);
                  }}>
                  <div className="td-upload-preview td-upload-bg">
                    {backgroundPreviewUrl ? (
                      <img src={backgroundPreviewUrl} alt="background preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="td-upload-hint">{t("tenants.edit.branding.background_upload_hint")}</span>
                    )}
                  </div>
                </Upload.Dragger>
              </div>
            </Form.Item>
          </div>
        </div>
      </div>

      <div className="td-glass-card">
        <h3 className="td-section-title">{t("tenants.edit.branding.primary_color")}</h3>
        <div className="td-form-grid">
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.primary_color")}</span>} name="primaryColor">
            <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
          </Form.Item>
        </div>

        <div className="td-form-grid" style={{ marginTop: "2rem" }}>
          <div>
            <h4 className="td-color-section-title">{t("tenants.detail_tabs.light_mode")}</h4>
            <div className="space-y-3 mt-4">
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.light_base_color")}</span>} name="lightBaseColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.light_surface_color")}</span>} name="lightSurfaceColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.light_card_color")}</span>} name="lightCardColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
            </div>
          </div>
          <div>
            <h4 className="td-color-section-title">{t("tenants.detail_tabs.dark_mode")}</h4>
            <div className="space-y-3 mt-4">
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.dark_base_color")}</span>} name="darkBaseColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.dark_surface_color")}</span>} name="darkSurfaceColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className={labelStyle}>{t("tenants.edit.branding.dark_card_color")}</span>} name="darkCardColor">
                <ColorPicker showText size="large" format="hex" className="w-full justify-start rounded-xl" />
              </Form.Item>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ΓöÇΓöÇΓöÇΓöÇΓöÇ TAB: Payment Settings ΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const renderPaymentTab = () => (
    <div className="td-tab-content">
      <div className="td-glass-card">
        <h3 className="td-section-title">{t("dashboard.settings.payment.title")}</h3>
        <Form form={paymentForm} layout="vertical" component={false} className="tenant-form">
          <Form.Item
            label={<span className={labelStyle}>{t("dashboard.settings.payment.fields.client_id")}</span>}
            name="clientId"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.client_id_required") }]}>
            <Input size="large" disabled={paymentLoading || loading} />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("dashboard.settings.payment.fields.api_key")}</span>}
            name="apiKey"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.api_key_required") }]}>
            <Input.Password size="large" disabled={paymentLoading || loading} />
          </Form.Item>
          <Form.Item
            label={<span className={labelStyle}>{t("dashboard.settings.payment.fields.checksum_key")}</span>}
            name="checksumKey"
            rules={[{ required: true, message: t("dashboard.settings.payment.validation.checksum_key_required") }]}>
            <Input.Password size="large" disabled={paymentLoading || loading} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );

  /* ΓöÇΓöÇΓöÇΓöÇΓöÇ TAB: System Info ΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const renderSystemTab = () => (
    <div className="td-tab-content">
      <div className="td-glass-card">
        <h3 className="td-section-title">{t("tenants.edit.system_fields.title")}</h3>
        <div className="td-form-grid">
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.system_fields.created_date")}</span>} name="createdDate">
            <Input size="large" disabled />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.system_fields.modified_date")}</span>} name="modifiedDate">
            <Input size="large" disabled />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.system_fields.created_by")}</span>} name="createdBy">
            <Input size="large" disabled />
          </Form.Item>
          <Form.Item label={<span className={labelStyle}>{t("tenants.edit.system_fields.modified_by")}</span>} name="modifiedBy">
            <Input size="large" disabled />
          </Form.Item>
        </div>
      </div>

      <div className="td-glass-card">
        <h3 className="td-section-title">{t("tenants.edit.tenant_settings.title")}</h3>
        <Form.Item name="tenantSettings">
          <TextArea rows={6} />
        </Form.Item>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general": return renderGeneralTab();
      case "branding": return renderBrandingTab();
      case "payment": return renderPaymentTab();
      case "system": return renderSystemTab();
      default: return renderGeneralTab();
    }
  };

  return (
    <>
      <main className="td-page">
        {/* ΓöÇΓöÇΓöÇΓöÇΓöÇ STICKY HEADER BAR ΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <header className="td-topbar">
          <div className="td-topbar-left">
            <button className="td-back-btn" onClick={handleCancel}>
              <ArrowLeftOutlined />
            </button>
            <span className="td-topbar-divider" />
            <div className="td-topbar-identity">
              {logoPreviewUrl && (
                <img src={logoPreviewUrl} alt="" className="td-topbar-logo" />
              )}
              <div>
                <h1 className="td-topbar-name">{formData.name || t("tenants.detail_tabs.tenant_detail")}</h1>
                <span className="td-topbar-status">
                  <span className="td-status-beacon" />
                  {tenantStatus ? t("tenants.detail_tabs.active_tenant") : t("tenants.detail_tabs.inactive_tenant")}
                </span>
              </div>
            </div>
          </div>
          <div className="td-topbar-right">
            <Button onClick={handleCancel} type="text" className="td-cancel-btn">
              {t("tenants.create.buttons.cancel")}
            </Button>
            <Button danger className="td-delete-btn" onClick={handleDeleteClick}>
              {t("tenants.edit.buttons.delete")}
            </Button>
            <Button
              type="primary"
              loading={loading}
              disabled={loading}
              onClick={() => form.submit()}
              className="td-save-btn">
              {t("tenants.edit.buttons.update")}
            </Button>
          </div>
          <div className="td-topbar-glow" />
        </header>

        {/* ΓöÇΓöÇΓöÇΓöÇΓöÇ PAGE CANVAS ΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <div className="td-canvas">
          {/* Tabs */}
          <div className="td-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`td-tab ${activeTab === tab.key ? "td-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Spin spinning={initialLoading} size="large">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={formData}
              className="tenant-form td-form"
              style={{ opacity: initialLoading ? 0 : 1 }}>
              {renderActiveTab()}
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
        width={520}
        styles={{
          mask: { backdropFilter: "blur(10px)", background: "var(--modal-overlay)" },
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
              <li>{t("tenants.edit.delete_modal.warning_items.transactions")}</li>
              <li>{t("tenants.edit.delete_modal.warning_items.assets")}</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {t("tenants.edit.delete_modal.confirm_instruction")}
            </p>
            <p className="text-base font-semibold px-3 py-2 rounded"
              style={{ backgroundColor: "var(--bg-base)", color: "var(--text)" }}>
              {formData.name}
            </p>
          </div>
          <Input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            size="large"
            autoFocus
            onPressEnter={() => {
              if (confirmInput === formData.name) handleDeleteConfirm();
            }}
          />
          {confirmInput && confirmInput !== formData.name && (
            <p className="text-sm text-red-500 mt-1">{t("tenants.edit.delete_modal.name_mismatch")}</p>
          )}
          {confirmInput === formData.name && (
            <p className="text-sm text-green-500 mt-1">{t("tenants.edit.delete_modal.name_match")}</p>
          )}
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        open={deactivateModalVisible}
        title={t("tenants.deactivate_modal.title")}
        description={t("tenants.deactivate_modal.warning_description")}
        confirmText={t("tenants.deactivate_modal.button_confirm")}
        cancelText={t("tenants.edit.delete_modal.button_cancel")}
        variant="warning"
        onConfirm={() => {
          setTenantStatus(false);
          setDeactivateModalVisible(false);
        }}
        onCancel={() => setDeactivateModalVisible(false)}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmModal
        open={activateModalVisible}
        title={t("tenants.activate_modal.title")}
        description={t("tenants.activate_modal.description")}
        confirmText={t("common.activate")}
        cancelText={t("common.cancel")}
        variant="info"
        onConfirm={() => {
          setTenantStatus(true);
          setActivateModalVisible(false);
        }}
        onCancel={() => setActivateModalVisible(false)}
      />
    </>
  );
};

export default TenantEditPage;
