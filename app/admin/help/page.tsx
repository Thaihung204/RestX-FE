"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs: FAQItem[] = [
    {
      question: "How do I add a new table?",
      answer:
        "Navigate to the Tables page and click the 'Add Table' button in the top right. Fill in the table details including number, capacity, and area, then save.",
      category: "tables",
    },
    {
      question: "How to process a new order?",
      answer:
        "Go to Orders page, click 'New Order', select the table, add menu items, and confirm. The order will be sent to the kitchen automatically.",
      category: "orders",
    },
    {
      question: "How do I manage staff schedules?",
      answer:
        "In the Staff section, click on a staff member's profile and select 'Schedule'. You can assign shifts, set working hours, and manage time-off requests.",
      category: "staff",
    },
    {
      question: "How to update menu items?",
      answer:
        "Go to Menu page, find the item you want to update, click the Edit button. You can change name, price, description, availability, and category.",
      category: "menu",
    },
    {
      question: "How do I generate reports?",
      answer:
        "Visit the Analytics page and select the type of report you need (sales, revenue, inventory). Choose the date range and click 'Generate Report'.",
      category: "analytics",
    },
    {
      question: "How to handle payment processing?",
      answer:
        "When an order is completed, click on the order and select 'Process Payment'. Choose payment method (cash, card, or digital) and confirm the transaction.",
      category: "orders",
    },
    {
      question: "How do I change my password?",
      answer:
        "Go to Settings > Security tab. Enter your current password, then your new password twice, and click 'Update Password'.",
      category: "account",
    },
    {
      question: "How to manage table reservations?",
      answer:
        "In the Tables page, click on a table and select 'Reserve'. Enter customer details, reservation time, and number of guests. The table status will update automatically.",
      category: "tables",
    },
  ];

  const categories = [
    {
      id: "all",
      name: "All Topics",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      id: "tables",
      name: "Tables",
      icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    {
      id: "orders",
      name: "Orders",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      id: "menu",
      name: "Menu",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      id: "staff",
      name: "Staff",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      id: "account",
      name: "Account",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Help Center
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Find answers to common questions and get support
              </p>
            </div>

            {/* Search */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none"
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

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border-2 transition-all`}
                  style={
                    selectedCategory === category.id
                      ? {background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)', borderColor: '#FF380B', color: 'white'}
                      : {
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }
                  }
                  suppressHydrationWarning>
                  <svg
                    className="w-6 h-6 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={category.icon}
                    />
                  </svg>
                  <p className="text-xs font-medium">{category.name}</p>
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                Frequently Asked Questions
              </h3>
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => (
                  <details
                    key={index}
                    className="rounded-xl overflow-hidden group"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}>
                    <summary
                      className="p-4 cursor-pointer list-none flex items-center justify-between transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                      suppressHydrationWarning>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {faq.question}
                      </span>
                      <svg
                        className="w-5 h-5 group-open:rotate-180 transition-transform"
                        style={{ color: 'var(--text-muted)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <p className="mt-4">{faq.answer}</p>
                    </div>
                  </details>
                ))
              ) : (
                <div
                  className="rounded-xl p-12 text-center"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}>
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    style={{ color: 'var(--text-muted)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p style={{ color: 'var(--text-muted)' }}>
                    No results found. Try a different search term or category.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-xl p-6 hover:border-orange-500/30 transition-all"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Documentation
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Comprehensive guides and tutorials
                </p>
                <button
                  className="font-medium text-sm transition-colors"
                  style={{color: '#FF380B'}}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                  suppressHydrationWarning>
                  View Docs →
                </button>
              </div>

              <div
                className="rounded-xl p-6 transition-all"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Video Tutorials
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Step-by-step video guides
                </p>
                <button
                  className="font-medium text-sm transition-colors"
                  style={{color: '#FF380B'}}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                  suppressHydrationWarning>
                  Watch Videos →
                </button>
              </div>

              <div
                className="rounded-xl p-6 transition-all"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Contact Support
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Get help from our support team
                </p>
                <button
                  className="font-medium text-sm transition-colors"
                  style={{color: '#FF380B'}}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                  suppressHydrationWarning>
                  Contact Us →
                </button>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <svg
                  className="w-6 h-6"
                  style={{color: '#FF380B'}}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { keys: ["Ctrl", "K"], action: "Quick Search" },
                  { keys: ["Ctrl", "N"], action: "New Order" },
                  { keys: ["Ctrl", "T"], action: "View Tables" },
                  { keys: ["Ctrl", "M"], action: "View Menu" },
                  { keys: ["Ctrl", ","], action: "Open Settings" },
                  { keys: ["Ctrl", "/"], action: "Show Help" },
                ].map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--surface)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{shortcut.action}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{
                              background: 'var(--card)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                            }}>
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span style={{ color: 'var(--text-muted)' }}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
