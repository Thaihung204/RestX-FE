"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CategorySettings from "./components/CategorySettings";

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<
    "general" | "appearance" | "notifications" | "security" | "categories"
  >("general");

  return (
    <main className="p-6 lg:p-8">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {t("dashboard.settings.title")}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {t("dashboard.settings.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
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
            {
              id: "categories" as const,
              label: t("dashboard.settings.tabs.categories"),
              icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 font-medium transition-all flex items-center gap-2"
              style={{
                color: activeTab === tab.id ? '#FF380B' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid #FF380B' : 'none',
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
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.general.restaurant_info")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.settings.general.restaurant_name")}
                  </label>
                  <input
                    type="text"
                    defaultValue="RestX Premium Restaurant"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    suppressHydrationWarning
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.email")}
                    </label>
                    <input
                      type="email"
                      defaultValue="contact@restx.com"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }} onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.phone")}
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }} onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} suppressHydrationWarning
                    />
                  </div>
                </div>
<<<<<<< HEAD
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.settings.general.address")}
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Main Street, Downtown, City 12345"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }} onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} suppressHydrationWarning
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.opening_time")}
                    </label>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }} onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'} suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.closing_time")}
                    </label>
                    <input
                      type="time"
                      defaultValue="23:00"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      suppressHydrationWarning
                    />
=======

                <div
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                    {t("dashboard.settings.general.business_settings")}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          {t("dashboard.settings.general.currency")}
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          disabled
                          defaultValue="VND (₫)"
                          suppressHydrationWarning>
                          <option value="VND (₫)">VND (₫)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          {t("dashboard.settings.general.tax_rate")}
                        </label>
                        <input
                          type="number"
                          defaultValue="10"
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          {t("dashboard.settings.general.timezone")}
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          suppressHydrationWarning>
                          <option>UTC-5 (EST)</option>
                          <option>UTC-8 (PST)</option>
                          <option>UTC+7 (ICT)</option>
                          <option>UTC+0 (GMT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          {t("dashboard.settings.general.date_format")}
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          suppressHydrationWarning>
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
>>>>>>> 94d9ab9be690a46cbd51f3c1ec575f8ca86e575d
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.general.business_settings")}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.currency")}
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      suppressHydrationWarning>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>VND (₫)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.tax_rate")}
                    </label>
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.timezone")}
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      suppressHydrationWarning>
                      <option>UTC-5 (EST)</option>
                      <option>UTC-8 (PST)</option>
                      <option>UTC+7 (ICT)</option>
                      <option>UTC+0 (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.general.date_format")}
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      suppressHydrationWarning>
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
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
                      borderColor: theme.name === "Dark" ? '#FF380B' : '#374151'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.name === "Dark" ? '#FF380B' : '#374151'}
                    suppressHydrationWarning>
                    <div className="text-center">
                      <p
                        className={`font-bold ${theme.name === "Light"
                          ? "text-gray-900"
                          : "text-white"
                          }`}>
                        {t(`dashboard.settings.appearance.themes.${theme.name.toLowerCase()}`)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
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
                  )
                )}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.appearance.display_options")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {t("dashboard.settings.appearance.compact_mode")}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {t("dashboard.settings.appearance.show_animations")}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                    <div className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'rgb(55, 65, 81)', '--tw-ring-color': '#FF380B' } as any}></div>
                    <style jsx>{`
                          .peer:checked ~ div {
                            background-color: #FF380B !important;
                          }
                        `}</style>
                    <style jsx>{`
                          .peer:checked + div {
                            background-color: #FF380B;
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
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.notifications.order_notifications")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: t("dashboard.settings.notifications.items.new_orders"),
                    desc: t("dashboard.settings.notifications.items.new_orders_desc"),
                  },
                  {
                    title: t("dashboard.settings.notifications.items.order_updates"),
                    desc: t("dashboard.settings.notifications.items.order_updates_desc"),
                  },
                  {
                    title: t("dashboard.settings.notifications.items.order_completion"),
                    desc: t("dashboard.settings.notifications.items.order_completion_desc"),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.notifications.system_notifications")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: t("dashboard.settings.notifications.items.table_updates"),
                    desc: t("dashboard.settings.notifications.items.table_updates_desc"),
                  },
                  {
                    title: t("dashboard.settings.notifications.items.staff_alerts"),
                    desc: t("dashboard.settings.notifications.items.staff_alerts_desc"),
                  },
                  { title: t("dashboard.settings.notifications.items.inventory_alerts"), desc: t("dashboard.settings.notifications.items.inventory_alerts_desc") },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>
                        {item.title}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.security.change_password")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.settings.security.current_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.settings.security.new_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {t("dashboard.settings.security.confirm_new_password")}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF380B'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    suppressHydrationWarning
                  />
                </div>
                <button
                  className="px-6 py-2 text-white rounded-lg font-medium transition-all"
                  style={{ background: 'linear-gradient(to right, #FF380B, #CC2D08)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #CC2D08, #B32607)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #FF380B, #CC2D08)'}
                  suppressHydrationWarning>
                  {t("dashboard.settings.security.update_password")}
                </button>
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.security.two_factor")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text)' }}>
                      {t("dashboard.settings.security.enable_2fa")}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t("dashboard.settings.security.enable_2fa_desc")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      suppressHydrationWarning
                    />
                    <div className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'rgb(55, 65, 81)', '--tw-ring-color': '#FF380B' } as any}></div>
                  </label>
                </div>
              </div>
            </div>
            <style jsx>{`
                  .peer:checked ~ div {
                    background-color: #FF380B !important;
                  }
                `}</style>

            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
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

        {/* Categories Settings */}
        {activeTab === "categories" && (
          <CategorySettings />
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            className="px-6 py-2 rounded-lg transition-all"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
            suppressHydrationWarning>
            {t("dashboard.settings.buttons.cancel")}
          </button>
          <button
            style={{
              background: 'linear-gradient(to right, #FF380B, #FF380B)',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #CC2D08, #CC2D08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #FF380B, #FF380B)'}
            suppressHydrationWarning>
            {t("dashboard.settings.buttons.save_changes")}
          </button>
        </div>
      </div>
    </main>
  );
}
