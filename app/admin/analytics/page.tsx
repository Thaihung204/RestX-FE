"use client";

import AIStrategyListItem from "@/components/admin/analytics/AIStrategyListItem";
import AIStrategySection from "@/components/admin/analytics/AIStrategySection";
import AIStrategySummaryCard from "@/components/admin/analytics/AIStrategySummaryCard";
import MenuStrategyCard from "@/components/admin/analytics/MenuStrategyCard";
import aiService from "@/lib/services/aiService";
import { Drawer, Tabs, Dropdown, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ReportFilterOption = "day" | "week" | "month" | "year";

interface AIStrategyReport {
  id: string;
  generatedAt: string;
  summary: string;
  alertCount: number;
  hiddenOpportunities: Array<{
    type: string;
    title: string;
    insight: string;
    action: string;
    when: string;
    impact: "high" | "medium" | "low";
  }>;
  hiddenRisks: Array<{
    title: string;
    insight: string;
    action: string;
    when: string;
    impact: "high" | "medium" | "low";
  }>;
  menuStrategy: {
    trendingDish?: {
      dishName: string;
      whyTrending: string;
      action: string;
    };
    timeBasedDishes?: Array<{
      context: string;
      dishName: string;
      reason: string;
    }>;
    suggestedAdditions?: Array<{
      dishName: string;
      reason: string;
      action: string;
    }>;
    comboSuggestions?: Array<{
      dishes: string[];
      suggestedPrice: number;
      aovIncrease: number;
      reason: string;
    }>;
  };
  marketingStrategy: {
    trend: string;
    promoStrategy: string;
    upcomingActions: Array<{
      title: string;
      reason: string;
      action: string;
      when: string;
      impact: "high" | "medium" | "low";
    }>;
  };
  customerStrategy: {
    actions: Array<{
      title: string;
      reason: string;
      action: string;
      when: string;
      impact: "high" | "medium" | "low";
    }>;
  };
  actionPlan: Array<{
    title: string;
    reason: string;
    action: string;
    when: string;
    impact: "high" | "medium" | "low";
  }>;
}

export default function AnalyticsPage() {
  const { t } = useTranslation("common");
  const [reports, setReports] = useState<AIStrategyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AIStrategyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<ReportFilterOption>("week");

  const filterOptions: ReportFilterOption[] = ["day", "week", "month", "year"];

  const generateReport = async (filter?: ReportFilterOption) => {
    const activeFilter = filter || reportFilter;
    if (filter) setReportFilter(filter);
    
    setLoading(true);
    try {
      const response = await aiService.analyzeDashboard({ filterType: activeFilter });
      
      // Ensure the generatedAt has a consistent value or use the one from response if exists
      const reportData: AIStrategyReport = {
        ...response,
        id: response.id || `report-${Date.now()}`,
        generatedAt: response.generatedAt || new Date().toISOString()
      };

      setReports((prev) => [reportData, ...prev]);
      setSelectedReport(reportData);
      message.success(t('dashboard.analytics.success.generate'));
    } catch (error) {
      console.error("Lỗi khi tạo báo cáo AI:", error);
      message.error(t('dashboard.analytics.error.generate'));
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (selectedReport?.id === id) {
      const remaining = reports.filter((r) => r.id !== id);
      setSelectedReport(remaining[0] || null);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('dashboard.analytics.time.justNow');
    if (diffMins < 60) return `${diffMins} ${t('dashboard.analytics.time.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('dashboard.analytics.time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('dashboard.analytics.time.daysAgo')}`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <main className="flex-1 p-6 lg:p-8">


      <div className="space-y-6">
        {/* Page Header */}
        <div
          className="rounded-2xl p-6 shadow-xl relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,56,11,0.18) 0%, rgba(255,56,11,0.08) 100%), var(--card)",
            border: "1px solid rgba(255,56,11,0.22)",
          }}>
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{
              background: "var(--primary)",
              filter: "blur(80px)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
                  {t('dashboard.analytics.title')}
                </h2>
                <p style={{ color: "var(--text-muted)" }}>
                  {t('dashboard.analytics.subtitle')}
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                <Dropdown
                  menu={{
                    items: filterOptions.map((option) => ({
                      key: option,
                      label: (
                        <span className="font-medium px-1">
                          {t('dashboard.analytics.filter.by')} {t(`dashboard.filters.${option}`).toLowerCase()}
                        </span>
                      ),
                      onClick: () => generateReport(option),
                    })),
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                  disabled={loading}>
                  <button
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    style={{
                      background: loading ? "var(--surface)" : "var(--primary)",
                      color: loading ? "var(--text-muted)" : "var(--on-primary)",
                      border: loading ? "1px solid var(--border)" : "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1,
                      boxShadow: loading ? "none" : "0 4px 20px var(--primary-glow)",
                    }}>
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('dashboard.analytics.generating')}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        {t('dashboard.analytics.createNew')}
                        <svg
                          className="w-4 h-4 ml-1 opacity-70"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {selectedReport ? (
          <div className="animate-fadeIn pb-10">
            <Tabs
              defaultActiveKey="overview"
              size="large"
              items={[
                {
                  key: "overview",
                  label: t('dashboard.analytics.tabs.overview'),
                  children: (
                    <div className="space-y-6 pt-4">
                      <AIStrategySummaryCard
                        summary={selectedReport.summary}
                        alertCount={selectedReport.alertCount}
                        generatedAt={selectedReport.generatedAt}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedReport.hiddenRisks.length > 0 && (
                          <AIStrategySection
                            title={t('dashboard.analytics.sections.risks')}
                            variant="warning"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {selectedReport.hiddenRisks.map((risk, index) => (
                                <AIStrategyListItem
                                  key={index}
                                  title={risk.title}
                                  insight={risk.insight}
                                  action={risk.action}
                                  when={risk.when}
                                  impact={risk.impact}
                                  variant="risk"
                                />
                              ))}
                            </div>
                          </AIStrategySection>
                        )}
                        {selectedReport.hiddenOpportunities.length > 0 && (
                          <AIStrategySection
                            title={t('dashboard.analytics.sections.opportunities')}
                            variant="success"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {selectedReport.hiddenOpportunities.map((opportunity, index) => (
                                <AIStrategyListItem
                                  key={index}
                                  title={opportunity.title}
                                  insight={opportunity.insight}
                                  action={opportunity.action}
                                  when={opportunity.when}
                                  impact={opportunity.impact}
                                  type={opportunity.type}
                                  variant="opportunity"
                                />
                              ))}
                            </div>
                          </AIStrategySection>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "menu",
                  label: t('dashboard.analytics.tabs.menu'),
                  children: (
                    <div className="pt-4">
                      <AIStrategySection
                        title={t('dashboard.analytics.sections.menuOptimization')}
                        variant="primary"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        }>
                        <MenuStrategyCard menuStrategy={selectedReport.menuStrategy} />
                      </AIStrategySection>
                    </div>
                  ),
                },
                {
                  key: "marketing_customer",
                  label: t('dashboard.analytics.tabs.marketing'),
                  children: (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      <AIStrategySection
                        title={t('dashboard.analytics.sections.marketingStrategy')}
                        variant="primary"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        }>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t('dashboard.analytics.sections.currentTrend')}</h5>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selectedReport.marketingStrategy.trend}</p>
                          </div>
                          <div>
                            <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t('dashboard.analytics.sections.promoStrategy')}</h5>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selectedReport.marketingStrategy.promoStrategy}</p>
                          </div>
                          {selectedReport.marketingStrategy.upcomingActions.length > 0 && (
                            <div>
                              <h5 className="font-bold text-sm mb-2 mt-4" style={{ color: "var(--text)" }}>{t('dashboard.analytics.sections.upcomingEvents')}</h5>
                              <div className="space-y-2">
                                {selectedReport.marketingStrategy.upcomingActions.map((action, index) => (
                                  <AIStrategyListItem
                                    key={index}
                                    title={action.title}
                                    reason={action.reason}
                                    action={action.action}
                                    when={action.when}
                                    impact={action.impact}
                                    variant="default"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </AIStrategySection>

                      {selectedReport.customerStrategy.actions.length > 0 && (
                        <AIStrategySection
                          title={t('dashboard.analytics.sections.customerStrategy')}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {selectedReport.customerStrategy.actions.map((action, index) => (
                              <AIStrategyListItem
                                key={index}
                                title={action.title}
                                reason={action.reason}
                                action={action.action}
                                when={action.when}
                                impact={action.impact}
                                variant="default"
                              />
                            ))}
                          </div>
                        </AIStrategySection>
                      )}
                    </div>
                  ),
                },
                {
                  key: "action_plan",
                  label: t('dashboard.analytics.tabs.actionPlan'),
                  children: (
                    <div className="pt-4">
                      {selectedReport.actionPlan.length > 0 && (
                        <AIStrategySection
                          title={t('dashboard.analytics.sections.executionPlan')}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {selectedReport.actionPlan
                              .sort((a, b) => {
                                const impactOrder = { high: 0, medium: 1, low: 2 };
                                return impactOrder[a.impact] - impactOrder[b.impact];
                              })
                              .map((action, index) => (
                                <AIStrategyListItem
                                  key={index}
                                  title={action.title}
                                  reason={action.reason}
                                  action={action.action}
                                  when={action.when}
                                  impact={action.impact}
                                  variant="action"
                                />
                              ))}
                          </div>
                        </AIStrategySection>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          /* Empty State */
          <div
            className="rounded-xl p-12 text-center"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(255,56,11,0.12)" }}>
              <svg
                className="w-10 h-10"
                style={{ color: "var(--primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
              {t('dashboard.analytics.empty.title')}
            </h3>
            <p className="mb-4" style={{ color: "var(--text-muted)" }}>
              {t('dashboard.analytics.empty.subtitle')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
