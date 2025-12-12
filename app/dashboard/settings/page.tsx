"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "appearance" | "notifications" | "security"
  >("general");

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Settings
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Manage your restaurant preferences and configurations
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                {
                  id: "general" as const,
                  label: "General",
                  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                },
                {
                  id: "appearance" as const,
                  label: "Appearance",
                  icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
                },
                {
                  id: "notifications" as const,
                  label: "Notifications",
                  icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                },
                {
                  id: "security" as const,
                  label: "Security",
                  icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id ? "text-orange-500 border-b-2 border-orange-500" : ""
                  }`}
                  style={
                    activeTab !== tab.id
                      ? {
                          color: 'var(--text-muted)',
                        }
                      : undefined
                  }
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
                    Restaurant Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Restaurant Name
                      </label>
                      <input
                        type="text"
                        defaultValue="RestX Premium Restaurant"
                        className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue="contact@restx.com"
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          defaultValue="+1 (555) 123-4567"
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Address
                      </label>
                      <input
                        type="text"
                        defaultValue="123 Main Street, Downtown, City 12345"
                        className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Opening Time
                        </label>
                        <input
                          type="time"
                          defaultValue="09:00"
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Closing Time
                        </label>
                        <input
                          type="time"
                          defaultValue="23:00"
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning
                        />
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
                    Business Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Currency
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning>
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>GBP (£)</option>
                          <option>VND (₫)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          defaultValue="10"
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Time Zone
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                          suppressHydrationWarning>
                          <option>UTC-5 (EST)</option>
                          <option>UTC-8 (PST)</option>
                          <option>UTC+7 (ICT)</option>
                          <option>UTC+0 (GMT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Date Format
                        </label>
                        <select
                          className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
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
                    Theme
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
                        className={`p-4 bg-gradient-to-br ${
                          theme.color
                        } border-2 ${
                          theme.name === "Dark"
                            ? "border-orange-500"
                            : "border-gray-700"
                        } rounded-xl hover:border-orange-500 transition-all`}
                        suppressHydrationWarning>
                        <div className="text-center">
                          <p
                            className={`font-bold ${
                              theme.name === "Light"
                                ? "text-gray-900"
                                : "text-white"
                            }`}>
                            {theme.name}
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
                    Accent Color
                  </h3>
                  <div className="grid grid-cols-6 gap-4">
                    {["orange", "blue", "green", "purple", "pink", "red"].map(
                      (color) => (
                        <button
                          key={color}
                          className={`h-12 bg-${color}-500 rounded-lg hover:scale-110 transition-transform ${
                            color === "orange"
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
                    Display Options
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>
                          Compact Mode
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Reduce spacing between elements
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
                          Show Animations
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Enable interface animations
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
                    Order Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "New Orders",
                        desc: "Get notified when new orders arrive",
                      },
                      {
                        title: "Order Updates",
                        desc: "Updates on order status changes",
                      },
                      {
                        title: "Order Completion",
                        desc: "When orders are completed",
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
                    System Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Table Updates",
                        desc: "Changes in table status",
                      },
                      {
                        title: "Staff Alerts",
                        desc: "Staff check-in/out notifications",
                      },
                      { title: "Inventory Alerts", desc: "Low stock warnings" },
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
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 rounded-lg focus:border-orange-500 focus:outline-none"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        suppressHydrationWarning
                      />
                    </div>
                    <button
                      className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-400 transition-all"
                      suppressHydrationWarning>
                      Update Password
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
                    Two-Factor Authentication
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>
                          Enable 2FA
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Add an extra layer of security
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
                  </div>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}>
                  <h3 className="text-xl font-bold text-red-500 mb-4">
                    Danger Zone
                  </h3>
                  <div className="space-y-4">
                    <button
                      className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-medium hover:bg-red-500 hover:text-white transition-all"
                      suppressHydrationWarning>
                      Delete Account
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
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                suppressHydrationWarning>
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-400 transition-all"
                suppressHydrationWarning>
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
