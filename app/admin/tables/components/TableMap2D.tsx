'use client';

import React, { useState } from 'react';
import { DraggableTable, TableData } from './DraggableTable';

interface TableMap2DProps {
    tables: TableData[];
    onTableClick: (table: TableData) => void;
    onTablePositionChange: (tableId: string, position: { x: number; y: number }) => void;
    height?: number;
    showGrid?: boolean;
}

export const TableMap2D: React.FC<TableMap2DProps> = ({
    tables,
    onTableClick,
    onTablePositionChange,
    height = 600,
    showGrid: initialShowGrid = true,
}) => {
    const [showGrid, setShowGrid] = useState(initialShowGrid);

    return (
        <div>
            {/* Grid Toggle */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 12,
                }}
            >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Show Grid
                    </span>
                </label>
            </div>

            {/* Canvas */}
            <div
                style={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                    position: 'relative',
                    height,
                    background: showGrid
                        ? `
                linear-gradient(90deg, var(--border) 1px, transparent 1px),
                linear-gradient(180deg, var(--border) 1px, transparent 1px),
                var(--card)
              `
                        : 'var(--card)',
                    backgroundSize: showGrid ? '20px 20px' : 'auto',
                    backgroundPosition: '0 0',
                }}
            >
                {tables.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text-muted)"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="10" width="18" height="10" rx="2" />
                            <path d="M7 10 V6 M17 10 V6" />
                        </svg>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            No tables added yet
                        </p>
                    </div>
                ) : (
                    tables.map((table) => (
                        <DraggableTable
                            key={table.id}
                            table={table}
                            onDragEnd={onTablePositionChange}
                            onClick={onTableClick}
                        />
                    ))
                )}
            </div>

            {/* Instructions */}
            <div
                style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: 'rgba(24, 144, 255, 0.1)',
                    border: '1px solid rgba(24, 144, 255, 0.3)',
                    borderRadius: 8,
                }}
            >
                <p style={{ fontSize: 12, color: '#1890ff', margin: 0 }}>
                    💡 <strong>Tip:</strong> Drag tables to arrange your floor plan. Click on a table to view details.
                </p>
            </div>
        </div>
    );
};
