'use client';

import { TableData } from '@/app/admin/tables/components/DraggableTable';
import { Layout, TableMap2D } from '@/app/admin/tables/components/TableMap2D';
import { FloorLayoutTableItem, floorService, tableService, TableStatus } from '@/lib/services/tableService';
import { useEffect, useState } from 'react';
import { LB, LeBonBooking, LeBonSelectedTable } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeShape = (s: string): 'Circle' | 'Rectangle' | 'Square' | 'Oval' => {
  if (s === 'Round' || s === 'Circle') return 'Circle';
  if (s === 'Oval') return 'Oval';
  if (s === 'Square') return 'Square';
  return 'Rectangle';
};

const parseStatus = (s: string): 'AVAILABLE' | 'OCCUPIED' => {
  const n = String(s ?? '').trim().toLowerCase();
  if (n === '1' || n === 'occupied' || n === 'reserved' || n === 'booked' || n === 'busy') return 'OCCUPIED';
  return 'AVAILABLE';
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  booking: LeBonBooking;
  tenantId?: string;
  selected: LeBonSelectedTable[];
  onSelect: (tables: LeBonSelectedTable[]) => void;
}

export default function LeBonTableStep({ booking, tenantId, selected, onSelect }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load floor layout ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const at = `${booking.date}T${booking.time}:59.999`;

    const load = async () => {
      try {
        // Primary: floors API
        const floors = await floorService.getAllFloors();
        const active = floors.filter(f => f.isActive !== false);

        if (active.length > 0) {
          const results = await Promise.allSettled(
            active.map(f => floorService.getFloorLayout(f.id, at))
          );

          const builtFloors = active.map((fs, idx) => {
            const res = results[idx];
            const data = res.status === 'fulfilled' ? res.value : null;
            const tables: TableData[] = (data?.tables ?? []).map((t: FloorLayoutTableItem) => ({
              id: t.id,
              tenantId: tenantId ?? 'default',
              name: t.code,
              seats: t.seatingCapacity,
              status: parseStatus(t.status),
              area: fs.name,
              position: { x: Number(t.layout.x), y: Number(t.layout.y) },
              shape: normalizeShape(t.layout.shape),
              width: Number(t.layout.width) || 100,
              height: Number(t.layout.height) || 100,
              rotation: Number(t.layout.rotation) || 0,
              zoneId: fs.name,
            }));
            return {
              id: fs.id,
              name: fs.name,
              width: Number(data?.floor.width ?? fs.width ?? 1400),
              height: Number(data?.floor.height ?? fs.height ?? 900),
              backgroundImage: data?.floor.backgroundImageUrl ?? fs.imageUrl ?? undefined,
              tables,
            };
          });

          if (!cancelled) {
            setLayout({ id: 'be-layout', name: 'Main Layout', activeFloorId: builtFloors[0]?.id ?? '', floors: builtFloors });
          }
          return;
        }
      } catch {
        // fallback below
      }

      // Fallback: getAllTables
      try {
        const items = await tableService.getAllTables();
        const active = items.filter(t => t.isActive);
        if (!active.length) { if (!cancelled) setError('Không có bàn khả dụng.'); return; }

        const groups = Array.from(new Set(active.map(t => t.type || 'Indoor')));
        const builtFloors = groups.map(type => {
          const group = active.filter(t => (t.type || 'Indoor') === type);
          const tables: TableData[] = group.map(t => ({
            id: t.id,
            tenantId: tenantId ?? 'default',
            name: t.code,
            seats: t.seatingCapacity,
            status: t.tableStatusId === TableStatus.Occupied ? 'OCCUPIED' : 'AVAILABLE',
            area: type,
            position: { x: t.positionX ?? 0, y: t.positionY ?? 0 },
            shape: normalizeShape(t.shape),
            width: t.width ?? 100,
            height: t.height ?? 100,
            rotation: t.rotation ?? 0,
            zoneId: type,
          }));
          return {
            id: type,
            name: type,
            width: Math.max(...group.map(t => (t.positionX ?? 0) + (t.width ?? 100)), 800) + 100,
            height: Math.max(...group.map(t => (t.positionY ?? 0) + (t.height ?? 100)), 600) + 100,
            tables,
          };
        });

        if (!cancelled) {
          setLayout({ id: 'fallback-layout', name: 'Main Layout', activeFloorId: builtFloors[0]?.id ?? '', floors: builtFloors });
        }
      } catch {
        if (!cancelled) setError('Không thể tải sơ đồ bàn. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [booking.date, booking.time, tenantId]);

  // ── Handle table click ─────────────────────────────────────────────────────
  const handleTableClick = (table: TableData) => {
    if (table.status === 'OCCUPIED') return;
    const alreadySelected = selected.some(t => t.id === table.id);
    if (alreadySelected) {
      onSelect(selected.filter(t => t.id !== table.id));
    } else {
      onSelect([...selected, {
        id: table.id,
        code: table.name,
        capacity: table.seats,
        zone: table.area,
      }]);
    }
  };

  const selectedIds = selected.map(t => t.id);

  // ── Legend item ────────────────────────────────────────────────────────────
  const Legend = ({ color, label }: { color: string; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 12, height: 12, background: color, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
      <span style={{ fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 1.5, color: LB.color.textMuted, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Legend color="#f6ffed" label="Trống" />
        <Legend color="var(--primary-soft, #e6f4ff)" label="Đã chọn" />
        <Legend color="#fff1f0" label="Đã đặt" />
      </div>

      {/* Map */}
      <div style={{
        position: 'relative',
        height: 380,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${LB.color.goldBorder}`,
        overflow: 'hidden',
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,30,16,0.7)', gap: 12,
          }}>
            <div style={{
              width: 32, height: 32,
              border: `2px solid ${LB.color.goldBorder}`,
              borderTopColor: LB.color.gold,
              borderRadius: '50%',
              animation: 'lb-spin 0.8s linear infinite',
            }} />
            <span style={{ fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 3, color: LB.color.goldSoft, textTransform: 'uppercase' }}>
              Đang tải sơ đồ...
            </span>
          </div>
        )}

        {error && !loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ fontFamily: LB.font.serif, fontSize: 16, fontStyle: 'italic', color: LB.color.error }}>{error}</p>
          </div>
        )}

        {layout && !loading && (
          <TableMap2D
            layout={layout}
            onLayoutChange={setLayout}
            onTableClick={handleTableClick}
            onTablePositionChange={() => undefined}
            readOnly
            selectedTableIds={selectedIds}
          />
        )}
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: LB.color.goldFaint,
          border: `1px solid ${LB.color.goldBorder}`,
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontFamily: LB.font.sans, fontSize: 9, letterSpacing: 2, color: LB.color.goldSoft, textTransform: 'uppercase' }}>
            Đã chọn:
          </span>
          {selected.map(t => (
            <span key={t.id} style={{
              fontFamily: LB.font.serif, fontSize: 15, color: LB.color.gold,
              padding: '2px 10px',
              border: `1px solid ${LB.color.goldBorder}`,
              background: 'rgba(201,168,76,0.08)',
            }}>
              #{t.code} <span style={{ fontSize: 12, color: LB.color.textMuted }}>({t.capacity} chỗ)</span>
            </span>
          ))}
          <button
            onClick={() => onSelect([])}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: LB.color.textMuted, cursor: 'pointer', fontSize: 11,
              fontFamily: LB.font.sans, letterSpacing: 1,
            }}
          >
            Bỏ chọn tất cả
          </button>
        </div>
      )}

      {selected.length === 0 && !loading && !error && (
        <p style={{
          fontFamily: LB.font.serif, fontSize: 15, fontStyle: 'italic',
          color: LB.color.textMuted, textAlign: 'center', margin: 0,
        }}>
          Nhấn vào bàn trên sơ đồ để chọn
        </p>
      )}

      {/* Spin keyframe injected once */}
      <style>{`@keyframes lb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
