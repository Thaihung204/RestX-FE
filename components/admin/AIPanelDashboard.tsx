"use client";

import AIStrategyListItem from "@/components/admin/analytics/AIStrategyListItem";
import AIStrategySection from "@/components/admin/analytics/AIStrategySection";
import AIStrategySummaryCard from "@/components/admin/analytics/AIStrategySummaryCard";
import { ButtonDropDown } from "@/components/ui/DropDown";
import { DownloadOutlined } from "@ant-design/icons";
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

type AIReportImpact = "high" | "medium" | "low";

export interface AIStrategyReport {
  id?: string;
  generatedAt?: string;
  summary?: string;
  alertCount?: number;
  insights?: Array<{
    category?: "risk" | "opportunity" | string;
    title?: string;
    evidence?: string;
    analysis?: string;
    action?: string;
    impact?: AIReportImpact;
  }>;
  menu?: {
    topDishes?: Array<{
      rank?: number;
      dishName?: string;
      evidence?: string;
      reason?: string;
      action?: string;
    }>;
    suggestedDishes?: Array<{
      rank?: number;
      dishName?: string;
      evidence?: string;
      reason?: string;
      action?: string;
    }>;
    combosToCreate?: Array<{
      rank?: number;
      dishes?: string[];
      suggestedPrice?: number;
      evidence?: string;
      reason?: string;
    }>;
  };
  customers?: {
    evidence?: string;
    insight?: string;
    action?: string;
  };
  actionPlan?: Array<{
    priority?: number;
    title?: string;
    evidence?: string;
    action?: string;
    impact?: AIReportImpact;
  }>;
  hiddenRisks?: AIInsightItem[];
  hiddenOpportunities?: AIOpportunityItem[];
  menuStrategy?: {
    trendingDish?: { dishName: string; whyTrending: string; action: string };
    timeBasedDishes?: Array<{ context: string; dishName: string; reason: string }>;
    suggestedAdditions?: Array<{ dishName: string; reason: string; action: string }>;
    comboSuggestions?: Array<{ dishes: string[]; suggestedPrice: number; aovIncrease: number; reason: string }>;
  };
  marketingStrategy?: {
    trend: string;
    promoStrategy: string;
    upcomingActions: Array<{ title: string; reason: string; action: string; when: string; impact: AIReportImpact }>;
  };
  customerStrategy?: {
    actions: Array<{ title: string; reason: string; action: string; when: string; impact: AIReportImpact }>;
  };
}

export type AIReportFilterOption = "month" | "quarter" | "year";

export interface AIPanelDashboardProps {
  report: AIStrategyReport | null;
  loading: boolean;
  onGenerate: (filter: AIReportFilterOption) => void;
  onDownload: () => void;
  downloading: boolean;
  currentFilter: AIReportFilterOption;
}

// Pure helper 
const IMPACT_ORDER: Record<AIReportImpact, number> = { high: 0, medium: 1, low: 2 };

const safeArray = <T,>(items?: T[]) => items ?? [];

const parseReportItems = (report: AIStrategyReport | null) => {
  const insights = safeArray(report?.insights);
  const fallbackRisks = safeArray(report?.hiddenRisks);
  const fallbackOpportunities = safeArray(report?.hiddenOpportunities);

  const risks = insights.filter((item) => item.category === "risk");
  const opportunities = insights.filter((item) => item.category === "opportunity");

  return {
    risks: risks.length ? risks : fallbackRisks,
    opportunities: opportunities.length ? opportunities : fallbackOpportunities,
    topDishes: safeArray(report?.menu?.topDishes),
    suggestedDishes: safeArray(report?.menu?.suggestedDishes),
    combosToCreate: safeArray(report?.menu?.combosToCreate),
    actionPlan: safeArray(report?.actionPlan),
  };
};

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
  onDownload,
  downloading,
  currentFilter,
}: AIPanelDashboardProps) {
  const { t } = useTranslation("common");

  const filterOptions: AIReportFilterOption[] = ["month", "quarter", "year"];

  const dropdownOptions = filterOptions.map((option) => ({
    key: option,
    label: `${t("dashboard.analytics.filter.by")} ${t(`dashboard.analytics.filter.${option}`).toLowerCase()}`,
  }));

  const filterLabelByOption: Record<AIReportFilterOption, string> = {
    month: "tháng",
    quarter: "quý",
    year: "năm",
  };

  const downloadLabel = `Tải chiến lược ${filterLabelByOption[currentFilter]}`;

  const parsed = parseReportItems(report);

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

        <div className="flex items-center gap-2">
          {report && (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary)",
              }}>
              <DownloadOutlined />
              {downloading
                ? t("common.actions.exporting", { defaultValue: "Exporting..." })
                : downloadLabel}
            </button>
          )}

          <ButtonDropDown
            trigger={triggerContent}
            options={dropdownOptions}
            onSelect={(key) => onGenerate(key as AIReportFilterOption)}
            disabled={loading}
            width={200}
          />
        </div>
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
                        summary={report.summary ?? t("dashboard.analytics.empty.subtitle")}
                        alertCount={report.alertCount ?? parsed.risks.length}
                        generatedAt={report.generatedAt ?? new Date().toISOString()}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {parsed.risks.length > 0 && (
                          <AIStrategySection
                            title={t("dashboard.analytics.sections.risks")}
                            variant="warning"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {parsed.risks.map((risk, i) => (
                                <AIStrategyListItem key={i} title={(risk as any).title ?? t("dashboard.analytics.labels.risk", { defaultValue: "Rủi ro" })} insight={(risk as any).analysis ?? (risk as any).insight ?? ""} evidence={(risk as any).evidence ?? ""} action={(risk as any).action ?? ""} when={(risk as any).when ?? t("dashboard.analytics.labels.now", { defaultValue: "Hiện tại" })} impact={(risk as any).impact ?? "medium"} variant="risk" />
                              ))}
                            </div>
                          </AIStrategySection>
                        )}
                        {parsed.opportunities.length > 0 && (
                          <AIStrategySection
                            title={t("dashboard.analytics.sections.opportunities")}
                            variant="success"
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            }>
                            <div className="space-y-3">
                              {parsed.opportunities.map((opp, i) => (
                                <AIStrategyListItem key={i} title={(opp as any).title ?? t("dashboard.analytics.labels.opportunity", { defaultValue: "Cơ hội" })} insight={(opp as any).analysis ?? (opp as any).insight ?? ""} evidence={(opp as any).evidence ?? ""} action={(opp as any).action ?? ""} when={(opp as any).when ?? t("dashboard.analytics.labels.now", { defaultValue: "Hiện tại" })} impact={(opp as any).impact ?? "medium"} type={(opp as any).type} variant="opportunity" />
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
                        <div className="space-y-4">
                          {parsed.topDishes.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {parsed.topDishes.map((dish, index) => (
                                <div key={index} className="rounded-lg p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                                    {t("dashboard.analytics.menu.topDish", { defaultValue: "Món chủ lực" })} {dish.rank ?? index + 1}
                                  </div>
                                  <div className="font-semibold" style={{ color: "var(--text)" }}>{dish.dishName}</div>
                                  {dish.reason && <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>{dish.reason}</p>}
                                  <div className="space-y-3 mt-4">
                                    {dish.evidence && (
                                      <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        <div>
                                          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t('dashboard.analytics.labels.evidence', { defaultValue: 'Cơ sở dữ liệu' })}</p>
                                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{dish.evidence}</p>
                                        </div>
                                      </div>
                                    )}
                                    {dish.action && (
                                      <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <div>
                                          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t('dashboard.analytics.labels.action', { defaultValue: 'Hành động' })}</p>
                                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{dish.action}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {parsed.suggestedDishes.length > 0 && (
                            <div>
                              <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("dashboard.analytics.menu.suggestedAdditions")}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {parsed.suggestedDishes.map((dish, index) => (
                                  <div key={index} className="rounded-lg p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                                    <div className="font-semibold" style={{ color: "var(--text)" }}>{dish.dishName}</div>
                                    {dish.reason && <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>{dish.reason}</p>}
                                    <div className="space-y-3 mt-4">
                                      {dish.evidence && (
                                        <div className="flex items-start gap-2">
                                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                          <div>
                                            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t('dashboard.analytics.labels.evidence', { defaultValue: 'Cơ sở dữ liệu' })}</p>
                                            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{dish.evidence}</p>
                                          </div>
                                        </div>
                                      )}
                                      {dish.action && (
                                        <div className="flex items-start gap-2">
                                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                          <div>
                                            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t('dashboard.analytics.labels.action', { defaultValue: 'Hành động' })}</p>
                                            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{dish.action}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsed.combosToCreate.length > 0 && (
                            <div>
                              <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("dashboard.analytics.menu.comboSuggestions")}</h5>
                              <div className="space-y-2">
                                {parsed.combosToCreate.map((combo, index) => (
                                  <div key={index} className="rounded-lg p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="font-semibold" style={{ color: "var(--text)" }}>
                                        {(combo.dishes ?? []).join(" + ")}
                                      </div>
                                      {typeof combo.suggestedPrice === "number" && (
                                        <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(combo.suggestedPrice)}</span>
                                      )}
                                    </div>
                                    {combo.reason && <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>{combo.reason}</p>}
                                    {combo.evidence && (
                                      <div className="flex items-start gap-2 mt-4">
                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        <div>
                                          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t('dashboard.analytics.labels.evidence', { defaultValue: 'Cơ sở dữ liệu' })}</p>
                                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{combo.evidence}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.marketingStrategy?.trend ?? report.summary ?? ""}</p>
                          </div>
                          <div>
                            <h5 className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>{t("dashboard.analytics.sections.promoStrategy")}</h5>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.marketingStrategy?.promoStrategy ?? ""}</p>
                          </div>
                          {safeArray(report.marketingStrategy?.upcomingActions).length > 0 && (
                            <div>
                              <h5 className="font-bold text-sm mb-2 mt-4" style={{ color: "var(--text)" }}>{t("dashboard.analytics.sections.upcomingEvents")}</h5>
                              <div className="space-y-2">
                                {safeArray(report.marketingStrategy?.upcomingActions).map((action, i) => (
                                  <AIStrategyListItem key={i} title={action.title} reason={action.reason} action={action.action} when={action.when ?? t("dashboard.analytics.labels.now", { defaultValue: "Hiện tại" })} impact={action.impact} variant="default" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </AIStrategySection>

                      {safeArray(report.customerStrategy?.actions).length > 0 && (
                        <AIStrategySection
                          title={t("dashboard.analytics.sections.customerStrategy")}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {safeArray(report.customerStrategy?.actions).map((action, i) => (
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
                      {parsed.actionPlan.length > 0 && (
                        <AIStrategySection
                          title={t("dashboard.analytics.sections.executionPlan")}
                          variant="primary"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          }>
                          <div className="space-y-3">
                            {[...parsed.actionPlan]
                              .sort((a, b) => IMPACT_ORDER[(a.impact ?? "medium")] - IMPACT_ORDER[(b.impact ?? "medium")])
                              .map((action, i) => (
                                <AIStrategyListItem key={i} title={action.title ?? `#{action.priority ?? i + 1}`} evidence={action.evidence ?? ""} action={action.action ?? ""} when={action.priority ? `Ưu tiên ${action.priority}` : t("dashboard.analytics.labels.now", { defaultValue: "Hiện tại" })} impact={action.impact ?? "medium"} variant="action" />
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
