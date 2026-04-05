'use client';

/**
 * ContentAreaLoader — inline skeleton loader for admin content area.
 * Shows a shimmer skeleton ONLY inside the content panel (right of sidebar, below header).
 * Does NOT cover the sidebar or header.
 *
 * Usage:
 *   {loading && <ContentAreaLoader />}
 *   {!loading && <ActualContent />}
 */
export default function ContentAreaLoader() {
  return (
    <div className="content-area-loader">
      {/* Shimmer overlay */}
      <div className="content-area-loader__shimmer" />

      {/* Skeleton layout */}
      <div className="content-area-loader__skeleton">
        {/* Title skeleton */}
        <div className="content-area-loader__row" style={{ gap: '16px', marginBottom: '24px' }}>
          <div className="content-area-loader__block" style={{ width: '260px', height: '28px', borderRadius: '8px' }} />
          <div style={{ flex: 1 }} />
          <div className="content-area-loader__block" style={{ width: '120px', height: '36px', borderRadius: '8px' }} />
        </div>

        {/* Subtitle skeleton */}
        <div className="content-area-loader__block" style={{ width: '340px', height: '16px', borderRadius: '6px', marginBottom: '28px' }} />

        {/* Stats cards skeleton */}
        <div className="content-area-loader__row" style={{ gap: '16px', marginBottom: '28px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="content-area-loader__card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="content-area-loader__block" style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
              <div className="content-area-loader__block" style={{ width: '40%', height: '28px', borderRadius: '6px' }} />
            </div>
          ))}
        </div>

        {/* Table / content skeleton */}
        <div className="content-area-loader__table">
          {/* Table header */}
          <div className="content-area-loader__table-header">
            {[90, 120, 70, 60, 80, 70, 80].map((w, i) => (
              <div
                key={i}
                className="content-area-loader__block"
                style={{ width: `${w}px`, height: '12px', borderRadius: '4px' }}
              />
            ))}
          </div>

          {/* Table rows */}
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="content-area-loader__table-row"
              style={{ animationDelay: `${row * 60}ms` }}
            >
              {[90, 120, 70, 60, 80, 70, 80].map((w, col) => (
                <div
                  key={col}
                  className="content-area-loader__block"
                  style={{ width: `${w}px`, height: '14px', borderRadius: '4px' }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
