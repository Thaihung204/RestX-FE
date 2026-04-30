"use client";

import { DropDown } from "@/components/ui/DropDown";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, message } from "antd";

import aiService from "@/lib/services/aiService";
import type { AIContentVariant } from "@/lib/types/ai";

import TenantBrandingSettings from "./components/TenantBrandingSettings";
import ReservationDepositConfigSection from "./components/ReservationDepositConfigSection";
import BusinessHourSettings from "./components/BusinessHourSettings";

const MAX_AI_PROMPT_LENGTH = 500;

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<
    "general" | "appearance" | "notifications" | "security"
  >("general");

  // AI Generator state
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantDescription, setRestaurantDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptModalOpen, setAiPromptModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentVariant[]>([]);

  const handleGenerateDescription = async () => {
    const normalizedPrompt = aiPrompt.trim();

    if (!normalizedPrompt) {
      message.warning(
        t("dashboard.settings.ai_content.empty_result", {
          defaultValue: "Please enter a prompt before generating AI content.",
        }),
      );
      return;
    }

    try {
      setAiGenerating(true);
      setAiSuggestions([]);

      const response = await aiService.generateContent({ prompt: normalizedPrompt });

      const variants = (response?.variants || []).filter(
        (item) => typeof item?.content === "string" && item.content.trim().length > 0,
      );

      if (variants.length === 0) {
        message.warning(
          t("dashboard.settings.ai_content.empty_result", {
            defaultValue: "AI did not return any content. Please try another prompt.",
          }),
        );
        return;
      }

      setAiSuggestions(variants);
      setAiPromptModalOpen(false);
      message.success(
        t("dashboard.settings.ai_content.generate_success", {
          defaultValue: "AI content generated. Choose one variant below.",
        }),
      );
    } catch (err) {
      message.error(
        t("dashboard.settings.ai_content.generate_failed", {
          defaultValue: "Failed to generate content with AI.",
        }),
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAIVariant = (variant: AIContentVariant) => {
    setRestaurantDescription(variant.content || "");
    message.success(
      t("dashboard.settings.ai_content.apply_success", {
        defaultValue: "Description updated from AI variant.",
      }),
    );
  };

  return (
    <main className="p-6 lg:p-8">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text)" }}>
            {t("dashboard.settings.title")}
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}>
          {[
            {
              id: "general" as const,
              label: t("dashboard.settings.tabs.general"),
              icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
            },
            {
              id: "appearance" as const,
              label: t("dashboard.settings.tabs.appearance"),
              icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
            },
            {
              id: "notifications" as const,
              label: t("dashboard.settings.tabs.notifications"),
              icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
            },
            {
              id: "security" as const,
              label: t("dashboard.settings.tabs.security"),
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 font-medium transition-all flex items-center gap-2"
              style={{
                color:
                  activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                borderBottom:
                  activeTab === tab.id ? "2px solid var(--primary)" : "none",
              }}
              suppressHydrationWarning>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={tab.icon}
                />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.general.restaurant_info")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.settings.general.restaurant_name")}
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.email")}
                    </label>
                    <input
                      type="email"
                      defaultValue="contact@restx.com"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.phone")}
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.settings.general.address")}
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Main Street, Downtown, City 12345"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label
                      className="block text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.description", { defaultValue: "Restaurant Description" })}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!aiPrompt) {
                          setAiPrompt(`Hãy tạo giới thiệu nhà hàng tối đa 200 từ cho nhà hàng ${restaurantName || ""}`.trim());
                        }
                        setAiPromptModalOpen(true);
                      }}
                      disabled={aiGenerating}
                      className="ai-generate-trigger-button px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
                      style={{
                        background: "var(--primary)",
                        border: "1px solid var(--primary)",
                        color: "#fff",
                      }}>
                      {aiGenerating
                        ? t("dashboard.settings.ai_content.generating", {
                          defaultValue: "Generating...",
                        })
                        : t("dashboard.settings.ai_content.generate", {
                          defaultValue: "Generate AI",
                        })}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={restaurantDescription}
                    onChange={(e) => setRestaurantDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none resize-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                  {aiSuggestions.length > 0 && (
                    <div
                      className="rounded-xl p-3 space-y-2 mt-3"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {t("dashboard.settings.ai_content.variants_title", {
                          defaultValue: "AI variants (click one to apply)",
                        })}
                      </p>

                      <div className="space-y-2">
                        {aiSuggestions.map((variant, index) => (
                          <button
                            key={`restaurant-ai-variant-${index}`}
                            type="button"
                            onClick={() => applyAIVariant(variant)}
                            className="w-full text-left rounded-lg px-3 py-2 transition-colors"
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                            }}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                {variant.headline ||
                                  t("dashboard.settings.ai_content.variant_label", {
                                    defaultValue: "Variant {{index}}",
                                    index: index + 1,
                                  })}
                              </p>

                              {typeof variant.score === "number" && (
                                <span
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    background: "rgba(0,0,0,0.08)",
                                    color: "var(--text-muted)",
                                  }}>
                                  {t("dashboard.settings.ai_content.score_label", {
                                    defaultValue: "Score: {{score}}",
                                    score: variant.score,
                                  })}
                                </span>
                              )}
                            </div>

                            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                              {variant.content}
                            </p>

                            {variant.scoreNote && (
                              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {variant.scoreNote}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <BusinessHourSettings />

            <ReservationDepositConfigSection />

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.general.business_settings")}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.currency")}
                    </label>
                    <DropDown className="py-2" suppressHydrationWarning>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>VND (₫)</option>
                    </DropDown>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.tax_rate")}
                    </label>
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.timezone")}
                    </label>
                    <DropDown className="py-2" suppressHydrationWarning>
                      <option>UTC-5 (EST)</option>
                      <option>UTC-8 (PST)</option>
                      <option>UTC+7 (ICT)</option>
                      <option>UTC+0 (GMT)</option>
                    </DropDown>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.general.date_format")}
                    </label>
                    <DropDown className="py-2" suppressHydrationWarning>
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </DropDown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <TenantBrandingSettings />

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.appearance.theme")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Dark", color: "from-gray-900 to-black" },
                  { name: "Light", color: "from-white to-gray-100" },
                  {
                    name: "Auto",
                    color: "from-gray-900 via-gray-700 to-white",
                  },
                ].map((theme) => (
                  <button
                    key={theme.name}
                    className={`p-4 bg-gradient-to-br ${theme.color
                      } border-2 rounded-xl transition-all`}
                    style={{
                      borderColor:
                        theme.name === "Dark" ? "var(--primary)" : "#374151",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      theme.name === "Dark" ? "var(--primary)" : "#374151")
                    }
                    suppressHydrationWarning>
                    <div className="text-center">
                      <p
                        className="font-bold"
                        style={{ color: "var(--text)" }}>
                        {t(
                          `dashboard.settings.appearance.themes.${theme.name.toLowerCase()}`,
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.appearance.accent_color")}
              </h3>
              <div className="grid grid-cols-6 gap-4">
                {["orange", "blue", "green", "purple", "pink", "red"].map(
                  (color) => (
                    <button
                      key={color}
                      className={`h-12 bg-${color}-500 rounded-lg hover:scale-110 transition-transform ${color === "orange"
                        ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                        : ""
                        }`}
                      suppressHydrationWarning
                    />
                  ),
                )}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.appearance.display_options")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text)" }}>
                      {t("dashboard.settings.appearance.compact_mode")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.appearance.compact_mode_desc")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      suppressHydrationWarning
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text)" }}>
                      {t("dashboard.settings.appearance.show_animations")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.appearance.show_animations_desc")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                      suppressHydrationWarning
                    />
                    <div
                      className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={
                        {
                          backgroundColor: "var(--border)",
                          "--tw-ring-color": "var(--primary)",
                        } as any
                      }></div>
                    <style jsx>{`
                      .peer:checked ~ div {
                        background-color: var(--primary) !important;
                      }
                    `}</style>
                    <style jsx>{`
                      .peer:checked + div {
                        background-color: var(--primary);
                      }
                    `}</style>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.notifications.order_notifications")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: t(
                      "dashboard.settings.notifications.items.new_orders",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.new_orders_desc",
                    ),
                  },
                  {
                    title: t(
                      "dashboard.settings.notifications.items.order_updates",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.order_updates_desc",
                    ),
                  },
                  {
                    title: t(
                      "dashboard.settings.notifications.items.order_completion",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.order_completion_desc",
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: "var(--text)" }}>
                        {item.title}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        {item.desc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                        suppressHydrationWarning
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.notifications.system_notifications")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: t(
                      "dashboard.settings.notifications.items.table_updates",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.table_updates_desc",
                    ),
                  },
                  {
                    title: t(
                      "dashboard.settings.notifications.items.staff_alerts",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.staff_alerts_desc",
                    ),
                  },
                  {
                    title: t(
                      "dashboard.settings.notifications.items.inventory_alerts",
                    ),
                    desc: t(
                      "dashboard.settings.notifications.items.inventory_alerts_desc",
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: "var(--text)" }}>
                        {item.title}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        {item.desc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                        suppressHydrationWarning
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.security.change_password")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.settings.security.current_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.settings.security.new_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.settings.security.confirm_new_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                    suppressHydrationWarning
                  />
                </div>
                <button
                  className="px-6 py-2 text-white rounded-lg font-medium transition-all"
                  style={{
                    background:
                      "linear-gradient(to right, var(--primary), var(--primary-hover))",
                  }}
                  onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, var(--primary-hover), var(--primary-border))")
                  }
                  onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, var(--primary), var(--primary-hover))")
                  }
                  suppressHydrationWarning>
                  {t("dashboard.settings.security.update_password")}
                </button>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.security.two_factor")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: "var(--text)" }}>
                      {t("dashboard.settings.security.enable_2fa")}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.settings.security.enable_2fa_desc")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      suppressHydrationWarning
                    />
                    <div
                      className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={
                        {
                          backgroundColor: "var(--border)",
                          "--tw-ring-color": "var(--primary)",
                        } as any
                      }></div>
                  </label>
                </div>
              </div>
            </div>
            <style jsx>{`
              .peer:checked ~ div {
                background-color: var(--primary) !important;
              }
            `}</style>

            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}>
              <h3 className="text-xl font-bold text-red-500 mb-4">
                {t("dashboard.settings.security.danger_zone")}
              </h3>
              <div className="space-y-4">
                <button
                  className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-medium hover:bg-red-500 hover:text-white transition-all"
                  suppressHydrationWarning>
                  {t("dashboard.settings.security.delete_account")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            className="px-6 py-2 rounded-lg transition-all"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
            suppressHydrationWarning>
            {t("dashboard.settings.buttons.cancel")}
          </button>
          <button
            style={{
              background:
                "linear-gradient(to right, var(--primary), var(--primary))",
              color: "white",
              padding: "8px 24px",
              borderRadius: "8px",
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "linear-gradient(to right, var(--primary-hover), var(--primary-hover))")
            }
            onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "linear-gradient(to right, var(--primary), var(--primary))")
            }
            suppressHydrationWarning>
            {t("dashboard.settings.buttons.save_changes")}
          </button>
        </div>
      </div>

      <Modal
        className="ai-generate-modal"
        open={aiPromptModalOpen}
        onCancel={() => {
          if (!aiGenerating) {
            setAiPromptModalOpen(false);
          }
        }}
        footer={null}
        centered
        destroyOnHidden>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            {t("dashboard.settings.ai_content.prompt_modal_title", {
              defaultValue: "Generate description with AI",
            })}
          </h3>

          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.ai_content.prompt_modal_hint", {
              defaultValue:
                "Enter optional instructions for AI.",
            })}
          </p>

          <label className="text-sm font-medium block" style={{ color: "var(--text)" }}>
            {t("dashboard.settings.ai_content.prompt_label", {
              defaultValue: "Prompt",
            })}
          </label>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value.slice(0, MAX_AI_PROMPT_LENGTH))}
            maxLength={MAX_AI_PROMPT_LENGTH}
            disabled={aiGenerating}
            rows={4}
            placeholder={t("dashboard.settings.ai_content.prompt_placeholder", {
              defaultValue: "Optional prompt (e.g., focus on family friendly atmosphere)",
            })}
            className="ai-prompt-textarea w-full px-3 py-2 rounded-lg outline-none resize-none border focus:ring-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAiPromptModalOpen(false)}
              disabled={aiGenerating}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>

            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiGenerating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{
                background: "var(--primary)",
                border: "1px solid var(--primary)",
                color: "#fff",
              }}>
              {aiGenerating
                ? t("dashboard.settings.ai_content.generating", {
                  defaultValue: "Generating...",
                })
                : t("dashboard.settings.ai_content.generate", {
                  defaultValue: "Generate AI",
                })}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
