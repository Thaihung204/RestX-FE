/**
 * Format number as Vietnamese Dong (VND)
 * 1234567.89 → 1.234.567 ₫
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage with 1 decimal place
 * 0.714 → 71.4%
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format completion rate as "completed / total (percentage)"
 * 71, 100 → "71/100 (71%)"
 */
export const formatCompletionRate = (completed: number, total: number): string => {
  if (total === 0) return '0/0 (0%)';
  const percentage = (completed / total) * 100;
  return `${completed}/${total} (${percentage.toFixed(0)}%)`;
};

/**
 * Format date to locale string (vi-VN)
 * "2026-04-01" → "01/04/2026"
 */
export const formatDate = (dateString: string, locale: string = 'vi-VN'): string => {
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString(locale);
  } catch {
    return dateString;
  }
};

/**
 * Format date range for display
 * "2026-04-01", "2026-04-30" → "01/04 - 30/04/2026"
 */
export const formatDateRange = (
  startDate: string,
  endDate: string,
  locale: string = 'vi-VN'
): string => {
  try {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');

    const startDay = start.getDate();
    const startMonth = start.getMonth() + 1;
    const endDay = end.getDate();
    const endMonth = end.getMonth() + 1;
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${year}`;
    }
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${year}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
};

/**
 * Format large number with K/M suffix
 * 1000 → 1K
 * 1000000 → 1M
 */
export const formatShortNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Determine cancellation rate severity
 * Returns: 'normal' | 'warning' | 'danger'
 */
export const getCancellationSeverity = (cancelledCount: number, totalCount: number): string => {
  if (totalCount === 0) return 'normal';
  const rate = (cancelledCount / totalCount) * 100;
  if (rate > 10) return 'danger';
  if (rate > 5) return 'warning';
  return 'normal';
};
