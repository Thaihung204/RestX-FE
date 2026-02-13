"use client";

import {
  THEME_COLOR_FIELDS,
  THEME_COLOR_MAP,
  type ThemeColorField,
  getThemeDefaults,
} from "@/lib/constants/themeDefaults";
import { useTenant } from "@/lib/contexts/TenantContext";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import { App } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/** Convert camelCase to snake_case for i18n key lookup */
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Reusable color picker with hex text input */
function ColorPickerField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4">
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="flex gap-3 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 rounded border cursor-pointer"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        />
      </div>
    </div>
  );
}

/** Resolve tenant ID from various API response shapes */
function resolveTenantId(tenant: TenantConfig): string | undefined {
  return (
    tenant.id ||
    (tenant as any).Id ||
    (tenant as any).tenant?.id ||
    (tenant as any).tenant?.Id
  );
}

export default function TenantBrandingSettings() {
  const { t } = useTranslation("common");
  const { tenant, loading: tenantLoading, refreshTenant } = useTenant();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    logoUrl: "",
    backgroundUrl: "",
    logoFile: null as File | null,
    bannerFile: null as File | null,
  });

  const [colors, setColors] = useState<Record<ThemeColorField, string>>(
    getThemeDefaults(),
  );

  const updateColor = (field: ThemeColorField, value: string) =>
    setColors((prev) => ({ ...prev, [field]: value }));

  /** Validate and set an image file with preview */
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoFile" | "bannerFile",
    setPreview: (url: string) => void,
    maxMB: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error(t("dashboard.settings.appearance.invalid_image", { defaultValue: "Please select a valid image file" }));
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      message.error(t("dashboard.settings.appearance.file_too_large", { defaultValue: `File size must be less than ${maxMB}MB` }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Preview URLs for uploaded files
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");

  useEffect(() => {
    if (tenant) {
      const tenantId = resolveTenantId(tenant);
      if (tenantId) {
        setResolvedTenantId(tenantId);
      } else if (tenant.hostname) {
        tenantService.getAllTenantsForAdmin().then((all) => {
          const match = all.find((t) => t.hostName === tenant.hostname);
          if (match) setResolvedTenantId(match.id);
        }).catch(() => {});
      }

      setFormData((prev) => ({
        ...prev,
        logoUrl: tenant.logoUrl || "",
        backgroundUrl: tenant.backgroundUrl || "",
      }));

      // Use DB colors, fallback to globals.css defaults for empty fields
      const defaults = getThemeDefaults();
      const tenantColors = { ...defaults };
      for (const field of THEME_COLOR_FIELDS) {
        const dbVal = (tenant as any)[field] as string;
        if (dbVal?.trim()) tenantColors[field] = dbVal;
      }
      setColors(tenantColors);
      setLogoPreview(tenant.logoUrl || "");
      setBannerPreview(tenant.backgroundUrl || "");
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) {
      message.warning(t("dashboard.settings.appearance.no_tenant", { defaultValue: "No tenant configuration available" }));
      return;
    }

    const tenantId = resolvedTenantId || resolveTenantId(tenant);
    if (!tenantId) {
      message.error(t("dashboard.settings.appearance.no_tenant_id", { defaultValue: "Tenant ID is missing" }));
      return;
    }

    setLoading(true);
    try {
      const updatedTenant: TenantConfig = {
        ...tenant,
        id: tenantId,
        logoUrl: formData.logoUrl,
        backgroundUrl: formData.backgroundUrl,
        ...colors,
      };

      await tenantService.upsertTenant(updatedTenant, {
        logo: formData.logoFile,
        background: formData.bannerFile,
      });

      message.success(t("dashboard.settings.notifications.success_update", { defaultValue: "Branding updated successfully!" }));
      setFormData((prev) => ({ ...prev, logoFile: null, bannerFile: null }));
      await refreshTenant?.();
    } catch (error) {
      console.error("Failed to update branding:", error);
      message.error(t("dashboard.settings.notifications.error_update", { defaultValue: "Failed to update branding" }));
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="animate-pulse h-40 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
    );
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}>
      <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
        {t("dashboard.settings.appearance.branding_title", {
          defaultValue: "Store Branding",
        })}
      </h3>

      <div className="space-y-6">
        {/* Logo Section */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.appearance.logo", { defaultValue: "Logo" })}
          </label>
          <div className="flex gap-4 items-start">
            {/* Logo Preview */}
            <div
              className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-[var(--primary)] group"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
              onClick={() => logoInputRef.current?.click()}>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full h-full object-contain p-2"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "/images/logo/restx-removebg-preview.png")
                  }
                />
              ) : (
                <div className="text-center p-2">
                  <svg
                    className="w-8 h-8 mx-auto mb-1 text-gray-400 group-hover:text-[var(--primary)] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-gray-400 group-hover:text-[var(--primary)] transition-colors">
                    {t("dashboard.settings.appearance.click_upload", {
                      defaultValue: "Click to upload",
                    })}
                  </span>
                </div>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "logoFile", setLogoPreview, 5)}
              className="hidden"
            />

            <div className="flex-1">
              <p className="text-sm mb-2" style={{ color: "var(--text)" }}>
                {t("dashboard.settings.appearance.logo_help", {
                  defaultValue: "Upload your restaurant logo",
                })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.appearance.logo_format", {
                  defaultValue: "Recommended: 512x512px, PNG or SVG. Max 5MB.",
                })}
              </p>
              {formData.logoFile && (
                <p className="text-xs mt-1 text-green-500">
                  ✓ {formData.logoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.appearance.banner", {
              defaultValue: "Banner / Hero Image",
            })}
          </label>
          <div className="space-y-3">
            {/* Banner Preview */}
            <div
              className="w-full h-40 rounded-lg border-2 border-dashed overflow-hidden relative cursor-pointer transition-all hover:border-[var(--primary)] group"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
              onClick={() => bannerInputRef.current?.click()}>
              {bannerPreview ? (
                <>
                  <img
                    src={bannerPreview}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "/images/restaurant/banner.png")
                    }
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">
                      {t("dashboard.settings.appearance.click_change", {
                        defaultValue: "Click to change",
                      })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    className="w-12 h-12 mb-2 text-gray-400 group-hover:text-[var(--primary)] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-400 group-hover:text-[var(--primary)] transition-colors">
                    {t("dashboard.settings.appearance.click_upload_banner", {
                      defaultValue: "Click to upload banner image",
                    })}
                  </span>
                </div>
              )}
            </div>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "bannerFile", setBannerPreview, 10)}
              className="hidden"
            />

            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.appearance.banner_format", {
                  defaultValue:
                    "Recommended: 1920x600px, JPG or PNG. Max 10MB.",
                })}
              </p>
              {formData.bannerFile && (
                <p className="text-xs text-green-500">
                  ✓ {formData.bannerFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Theme Colors Section */}
        <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
          <h4
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text)" }}>
            {t("dashboard.settings.appearance.theme_colors", {
              defaultValue: "Theme Colors",
            })}
          </h4>

          <div className="space-y-4">
            {/* Primary Color */}
            <ColorPickerField
              label={t("dashboard.settings.appearance.primary_color", {
                defaultValue: "Primary Color",
              })}
              value={colors.primaryColor}
              fallback={THEME_COLOR_MAP.primaryColor.fallback}
              onChange={(v) => updateColor("primaryColor", v)}
            />
            <p
              className="text-xs -mt-3 mb-4"
              style={{ color: "var(--text-muted)" }}>
              {t("dashboard.settings.appearance.primary_color_help", {
                defaultValue:
                  "Main brand color for buttons, links, and accents.",
              })}
            </p>

            {/* Light & Dark Mode Color Groups */}
            {([
              {
                titleKey: "light_mode_colors",
                defaultTitle: "Light Mode Colors",
                fields: [
                  "lightBaseColor",
                  "lightSurfaceColor",
                  "lightCardColor",
                ] as ThemeColorField[],
              },
              {
                titleKey: "dark_mode_colors",
                defaultTitle: "Dark Mode Colors",
                fields: [
                  "darkBaseColor",
                  "darkSurfaceColor",
                  "darkCardColor",
                ] as ThemeColorField[],
              },
            ] as const).map(({ titleKey, defaultTitle, fields }) => (
              <div key={titleKey} className="mt-6">
                <h5
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--text)" }}>
                  {t(`dashboard.settings.appearance.${titleKey}`, {
                    defaultValue: defaultTitle,
                  })}
                </h5>
                {fields.map((field) => (
                  <ColorPickerField
                    key={field}
                    label={t(
                      `dashboard.settings.appearance.${camelToSnake(field)}`,
                      { defaultValue: THEME_COLOR_MAP[field].label },
                    )}
                    value={colors[field]}
                    fallback={THEME_COLOR_MAP[field].fallback}
                    onChange={(v) => updateColor(field, v)}
                  />
                ))}
              </div>
            ))}

            {/* Info */}
            <div
              className="p-4 rounded-lg mt-4"
              style={{
                background: "var(--surface)",
                border: "1px dashed var(--border)",
              }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                ℹ️{" "}
                {t("dashboard.settings.appearance.color_customization_info", {
                  defaultValue:
                    "Colors are synced from database. Empty fields use defaults from the global theme.",
                })}
              </p>
            </div>
          </div>

          {/* Live Preview */}
          <div
            className="mt-6 p-4 rounded-lg"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}>
            <p
              className="text-xs font-medium mb-3"
              style={{ color: "var(--text-muted)" }}>
              {t("dashboard.settings.appearance.preview", {
                defaultValue: "Preview",
              })}
            </p>
            <div className="flex gap-3 flex-wrap">
              <div
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: colors.primaryColor }}>
                Primary Button
              </div>
              <div
                className="px-4 py-2 rounded-lg border-2 font-medium"
                style={{
                  borderColor: colors.primaryColor,
                  color: colors.primaryColor,
                }}>
                Outlined Button
              </div>
              <div
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  background: `${colors.primaryColor}15`,
                  color: colors.primaryColor,
                }}>
                Soft Button
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={loading || !tenant}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-all ${loading || !tenant ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
            style={{
              background:
                "linear-gradient(to right, var(--primary), var(--primary-hover))",
            }}>
            {loading
              ? t("dashboard.settings.buttons.saving", {
                  defaultValue: "Saving...",
                })
              : t("dashboard.settings.buttons.save_branding", {
                  defaultValue: "Save Changes",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
