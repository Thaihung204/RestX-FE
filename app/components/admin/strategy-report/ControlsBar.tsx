'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PeriodType, CustomDateRange } from '@/app/lib/types/snapshot.types';

interface ControlsBarProps {
  periodType: PeriodType;
  selectedTenantId: string | null;
  isLoading: boolean;
  onPeriodChange: (period: PeriodType, customRange?: CustomDateRange) => void;
  onBackToAll: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  periodType,
  selectedTenantId,
  isLoading,
  onPeriodChange,
  onBackToAll,
}) => {
  const { t } = useTranslation();
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePeriodSelect = (period: PeriodType) => {
    if (period === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      onPeriodChange(period);
    }
  };

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      onPeriodChange('custom', {
        start: customStart,
        end: customEnd,
      });
      setShowCustomRange(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Period Tabs */}
        <div className="flex gap-2 border-r border-gray-200 pr-4">
          {(['weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodSelect(period)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                periodType === period
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t(`strategyReport.period.${period}`)}
            </button>
          ))}

          <button
            onClick={() => handlePeriodSelect('custom')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              periodType === 'custom'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t('strategyReport.period.custom')}
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomRange && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder={t('strategyReport.startDate')}
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder={t('strategyReport.endDate')}
            />
            <button
              onClick={handleApplyCustomRange}
              disabled={!customStart || !customEnd || isLoading}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('strategyReport.apply')}
            </button>
          </div>
        )}
      </div>

      {/* Back Button */}
      {selectedTenantId && (
        <button
          onClick={onBackToAll}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>←</span>
          {t('strategyReport.backToOverview')}
        </button>
      )}
    </div>
  );
};
