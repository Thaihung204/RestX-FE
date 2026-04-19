"use client";

import AIStrategyListItem from "@/components/admin/analytics/AIStrategyListItem";
import AIStrategySection from "@/components/admin/analytics/AIStrategySection";
import AIStrategySummaryCard from "@/components/admin/analytics/AIStrategySummaryCard";
import MenuStrategyCard from "@/components/admin/analytics/MenuStrategyCard";
import { ButtonDropDown } from "@/components/ui/DropDown";
import { Tabs } from "antd";
import NextImage from "next/image";
import { useTranslation } from "react-i18next";

// Interfaces 
export interface AIInsightItem {
  title: string;
  insight: string;
  action: string;
  when: string;
  impact: "high" | "medium" | "low";
}

export interface AIOpportunityItem extends AIInsightItem {
  type: string;
}

export interface AIStrategyReport {
  id: string;
  generatedAt: string;
  summary: string;
  alertCount: number;
  hiddenRisks: AIInsightItem[];
  hiddenOpportunities: AIOpportunityItem[];
  menuStrategy: {
    trendingDish?: { dishName: string; whyTrending: string; action: string };
    timeBasedDishes?: Array<{ context: string; dishName: string; reason: string }>;
    suggestedAdditions?: Array<{ dishName: string; reason: string; action: string }>;
    comboSuggestions?: Array<{ dishes: string[]; suggestedPrice: number; aovIncrease: number; reason: string }>;
  };
  marketingStrategy: {
    trend: string;
    promoStrategy: string;
    upcomingActions: Array<{ title: string; reason: string; action: string; when: string; impact: "high" | "medium" | "low" }>;
  };
  customerStrategy: {
    actions: Array<{ title: string; reason: string; action: string; when: string; impact: "high" | "medium" | "low" }>;
  };
  actionPlan: Array<{ title: string; reason: string; action: string; when: string; impact: "high" | "medium" | "low" }>;
}

export type AIReportFilterOption = "month" | "quarter" | "year";

export interface AIPanelDashboardProps {
  report: AIStrategyReport | null;
  loading: boolean;
  onGenerate: (filter: AIReportFilterOption) => void;
  currentFilter: AIReportFilterOption;
}

// Pure helper 
const IMPACT_ORDER: Record<"high" | "medium" | "low", number> = { high: 0, medium: 1, low: 2 };

export function getTopInsights<T extends { impact: "high" | "medium" | "low" }>(
  items: T[],
  maxCount = 3,
): T[] {
  return [...items].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]).slice(0, maxCount);
}

// Skeleton 
function AIPanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse pt-4">
      <div className="h-28 rounded-2xl" style={{ background: "var(--surface)" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 rounded-xl" style={{ background: "var(--surface)" }} />
        <div className="h-40 rounded-xl" style={{ background: "var(--surface)" }} />
      </div>
    </div>
  );
}

// Main component 
export default function AIPanelDashboard({
  report,
  loading,
  onGenerate,
  currentFilter,
}: AIPanelDashboardProps) {
  const { t } = useTranslation("common");

  const filterOptions: AIReportFilterOption[] = ["month", "quarter", "year"];

  const dropdownOptions = filterOptions.map((option) => ({
    key: option,
    label: `${t("dashboard.analytics.filter.by")} ${t(`dashboard.analytics.filter.${option}`).toLowerCase()}`,
  }));

  const triggerContent = loading ? (
    <span className="inline-flex items-center gap-2">
      <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {t("dashboard.analytics.generating")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2">
      <NextImage src="/images/ai/AI_strategy.png" alt="" width={15} height={15} className="ai-icon flex-shrink-0" />
      {t("dashboard.analytics.createNew")}
    </span>
  );

  return (
    <div
      className="rounded-lg p-5 border"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--surface)" }}>
            <NextImage
              src="/images/ai/AI_strategy.png"
              alt="AI Strategy"
              width={18}
              height={18}
              className="ai-icon"
            />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {t("dashboard.analytics.title")}
            {report && (
              <span
                className="font-normal"
                style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 6 }}>
                — {t(`dashboard.analytics.filter.subtitle.${currentFilter}`)}
              </span>
            )}
          </h3>
        </div>

        <ButtonDropDown
          trigger={triggerContent}
          options={dropdownOptions}
          onSelect={(key) => onGenerate(key as AIReportFilterOption)}
          disabled={loading}
          width={200}
        />
      </div>

      {/* Loading */}
      {loading && <AIPanelSkeleton />}

      {/* Empty state */}
      {!loading && !report && (
        <div
          className="text-center py-10 rounded-lg"
          style={{ background: "var(--surface)" }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--primary-soft)" }}>
            <NextImage
              src="/images/ai/AI_strategy.png"
              alt="AI Strategy"
              width={28}
              height={28}
              className="ai-icon"
            />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
            {t("dashboard.analytics.empty.title")}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.analytics.empty.subtitle")}
          </p>
        </div>
      )}

      {/* Report with Tabs */}
      {!loading && report && (
        <div className="animate-fadeIn">
          <Tabs
            defaultActiveKey="overview"
            size="small"
            items={[
                {
                  key: "overview",
                  label: t("dashboard.analytics.tabs.overview"),
                  children: (
                    <div className="space-y-6 pt-4">
                      <AIStrategySummaryCard
                        summary={report.summary}
                        alertCount={report.alertCount}
                        generatedAt={report.generatedAt}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {report.hiddenRisks.length > 0 && (
                          <AIStrategySection
                            title={t("dashboard.analytics.sections.risks")}
                            variant="warning"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {report.hiddenRisks.map((risk, i) => (
                                <AIStrategyListItem key={i} title={risk.title} insight={risk.insight} action={risk.action} when={risk.when} impact={risk.impact} variant="risk" />
                              ))}
                            </div>
                          </AIStrategySection>
                        )}
                        {report.hiddenOpportunities.length > 0 && (
                          <AIStrategySection
                            title={t("dashboard.analytics.sections.opportunities")}
                            variant="success"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {report.hiddenOpportunities.map((opp, i) => (
                                <AIStrategyListItem key={i} title={opp.title} insight={opp.insight} action={opp.action} when={opp.when} impact={opp.impact} type={opp.type} variant="opportunity" />
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
                  label: t("dashboard.analytics.tabs.menu"),
                  children: (
                    <div className="pt-4">
                      <AIStrategySection
                        title={t("dashboard.analytics.sections.menuOptimization")}
                        variant="primary"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        }>
                        <MenuStrategyCard menuStrategy={report.menuStrategy} />
                      </AIStrategySection>
                    </div>
                  ),
                },
                {
                  key: "marketing_customer",
                  label: t("dashboard.analytics.tabs.marketing"),
                  children: (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      <AIStrategySection
                        title={t("dashboard.analytics.sections.marketingStrategy")}
                        variant="primary"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        }>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("dashboard.analytics.sections.currentTrend")}</h5>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.marketingStrategy.trend}</p>
                          </div>
                          <div>
                            <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("dashboard.analytics.sections.promoStrategy")}</h5>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.marketingStrategy.promoStrategy}</p>
                          </div>
                          {report.marketingStrategy.upcomingActions.length > 0 && (
                            <div>
                              <h5 className="font-bold text-sm mb-2 mt-4" style={{ color: "var(--text)" }}>{t("dashboard.analytics.sections.upcomingEvents")}</h5>
                              <div className="space-y-2">
                                {report.marketingStrategy.upcomingActions.map((action, i) => (
                                  <AIStrategyListItem key={i} title={action.title} reason={action.reason} action={action.action} when={action.when} impact={action.impact} variant="default" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </AIStrategySection>

                      {report.customerStrategy.actions.length > 0 && (
                        <AIStrategySection
                          title={t("dashboard.analytics.sections.customerStrategy")}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {report.customerStrategy.actions.map((action, i) => (
                              <AIStrategyListItem key={i} title={action.title} reason={action.reason} action={action.action} when={action.when} impact={action.impact} variant="default" />
                            ))}
                          </div>
                        </AIStrategySection>
                      )}
                    </div>
                  ),
                },
                {
                  key: "action_plan",
                  label: t("dashboard.analytics.tabs.actionPlan"),
                  children: (
                    <div className="pt-4">
                      {report.actionPlan.length > 0 && (
                        <AIStrategySection
                          title={t("dashboard.analytics.sections.executionPlan")}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {[...report.actionPlan]
                              .sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact])
                              .map((action, i) => (
                                <AIStrategyListItem key={i} title={action.title} reason={action.reason} action={action.action} when={action.when} impact={action.impact} variant="action" />
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
        )}
    </div>
  );
}
