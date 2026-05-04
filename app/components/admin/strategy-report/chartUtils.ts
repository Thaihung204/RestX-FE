/**
 * SVG Chart Utilities for Restaurant Statistics Dashboard
 * Generates SVG charts with responsive design and smooth animations
 */

export interface LineChartSeries {
  data: number[];
  color: string;
  fill?: boolean;
}

export interface BarChartData {
  values: number[];
  color: string;
}

export interface AreaChartData {
  values: number[];
  color: string;
}

/**
 * Draw a line/area chart with smooth paths and fills
 */
export function drawLineChart(
  series: LineChartSeries[],
  w: number = 600,
  h: number = 220,
  showGrid: boolean = true
): string {
  const pad = { t: 8, r: 4, b: 18, l: 4 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals, 1);

  let html = `<defs>`;
  series.forEach((s, si) => {
    html += `<linearGradient id="lg_${si}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${s.color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${s.color}" stop-opacity="0"/>
    </linearGradient>`;
  });
  html += `</defs>`;

  // Grid lines
  if (showGrid) {
    [0, 0.5, 1].forEach(r => {
      const y = pad.t + H * r;
      html += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + W}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`;
    });
  }

  series.forEach((s, si) => {
    const n = s.data.length;
    const pts = s.data.map((v, i) => {
      const x = pad.l + (i / (n - 1)) * W;
      const y = pad.t + H - (v / max) * H;
      return `${x},${y}`;
    });

    if (s.fill) {
      const last = pts[pts.length - 1].split(',');
      const first = pts[0].split(',');
      html += `<polygon points="${pts.join(' ')} ${last[0]},${pad.t + H} ${first[0]},${pad.t + H}" fill="url(#lg_${si})"/>`;
    }

    html += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  });

  // X-axis labels
  const n = series[0].data.length;
  [0, Math.floor(n / 2), n - 1].forEach(i => {
    const x = pad.l + (i / (n - 1)) * W;
    html += `<text x="${x}" y="${h - 2}" fill="var(--text-muted)" font-size="12" font-weight="500" text-anchor="middle">${i + 1}</text>`;
  });

  return html;
}

/**
 * Draw a bar chart
 */
export function drawBarChart(
  data: number[],
  color: string,
  w: number = 600,
  h: number = 220,
  showGrid: boolean = true
): string {
  const pad = { t: 8, r: 4, b: 18, l: 4 };
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  const max = Math.max(...data, 1);
  const bw = Math.max(2, W / data.length - 2);

  let html = '';

  if (showGrid) {
    [0, 0.5, 1].forEach(r => {
      const y = pad.t + H * r;
      html += `<line x1="${pad.l}" y1="${y}" x2="${pad.l + W}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`;
    });
  }

  data.forEach((v, i) => {
    const x = pad.l + (i / data.length) * W + 1;
    const barH = (v / max) * H;
    const y = pad.t + H - barH;
    html += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(barH, 1)}" rx="3" fill="${color}" opacity="0.85"/>`;
  });

  // X-axis labels
  [0, Math.floor(data.length / 2), data.length - 1].forEach(i => {
    const x = pad.l + (i / data.length) * W + bw / 2;
    html += `<text x="${x}" y="${h - 2}" fill="var(--text-muted)" font-size="12" font-weight="500" text-anchor="middle">${i + 1}</text>`;
  });

  return html;
}

/**
 * Draw an area chart (filled line chart)
 */
export function drawAreaChart(
  data: number[],
  color: string,
  w: number = 600,
  h: number = 220,
  showGrid: boolean = true
): string {
  return drawLineChart([{ data, color, fill: true }], w, h, showGrid);
}

/**
 * Format a number for display in charts
 */
export function formatChartValue(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}
