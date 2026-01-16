"use client";

type TableStatus = "serving" | "available" | "reserved" | "cleaning";

interface Table {
  id: string;
  status: TableStatus;
  seats: number;
  area: "VIP" | "Indoor" | "Outdoor";
}

const tables: Table[] = [
  { id: "V1", status: "serving", seats: 4, area: "VIP" },
  { id: "V2", status: "reserved", seats: 6, area: "VIP" },
  { id: "V3", status: "available", seats: 4, area: "VIP" },
  { id: "I1", status: "serving", seats: 2, area: "Indoor" },
  { id: "I2", status: "serving", seats: 4, area: "Indoor" },
  { id: "I3", status: "available", seats: 2, area: "Indoor" },
  { id: "I4", status: "cleaning", seats: 4, area: "Indoor" },
  { id: "I5", status: "reserved", seats: 6, area: "Indoor" },
  { id: "I6", status: "available", seats: 4, area: "Indoor" },
  { id: "O1", status: "serving", seats: 4, area: "Outdoor" },
  { id: "O2", status: "available", seats: 2, area: "Outdoor" },
  { id: "O3", status: "available", seats: 4, area: "Outdoor" },
];

const statusConfig: Record<
  TableStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  serving: {
    bg: "",
    bgStyle: { backgroundColor: '#FF380B' },
    border: "",
    borderStyle: { borderColor: '#FF380B' },
    text: "",
    textStyle: { color: '#FF380B' },
    label: "Serving",
  },
  available: {
    bg: "bg-gray-600",
    border: "border-gray-600",
    text: "text-gray-400",
    label: "Available",
  },
  reserved: {
    bg: "",
    bgStyle: { backgroundColor: '#FF6B3B' },
    border: "",
    borderStyle: { borderColor: '#FF6B3B' },
    text: "",
    textStyle: { color: '#FF6B3B' },
    label: "Reserved",
  },
  cleaning: {
    bg: "bg-red-400",
    border: "border-red-400",
    text: "text-red-400",
    label: "Cleaning",
  },
};

export default function TableStatusMap() {
  const vipTables = tables.filter((t) => t.area === "VIP");
  const indoorTables = tables.filter((t) => t.area === "Indoor");
  const outdoorTables = tables.filter((t) => t.area === "Outdoor");

  const renderTable = (table: Table) => {
    const config = statusConfig[table.status];
    return (
      <div
        key={table.id}
        className="group relative cursor-pointer transition-all duration-300 hover:scale-110">
        <div
          className={`w-16 h-16 ${
            config.bg
          } rounded-lg flex flex-col items-center justify-center border-2 ${
            config.border
          } shadow-lg transition-all
          ${table.status === "serving" ? "animate-pulse-slow" : ""}`}>
          <span className="text-white font-bold text-sm">{table.id}</span>
          <span className="text-white text-xs">{table.seats} seats</span>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-10 border border-gray-700">
          <div className="font-semibold">{table.id}</div>
          <div className="text-gray-300">Status: {config.label}</div>
          <div className="text-gray-300">Seats: {table.seats}</div>
          <div className="text-gray-300">Area: {table.area}</div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
          Real-time Table Status
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Live floor plan overview
        </p>
      </div>

      {/* Floor Plan */}
      <div className="space-y-6 mb-6">
        {/* VIP Area */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#FF380B' }}>
            VIP Area
          </h4>
          <div className="flex gap-4 flex-wrap">
            {vipTables.map(renderTable)}
          </div>
        </div>

        {/* Indoor Area */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#FF380B' }}>
            Indoor Area
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {indoorTables.map(renderTable)}
          </div>
        </div>

        {/* Outdoor Area */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#FF380B' }}>
            Outdoor Area
          </h4>
          <div className="flex gap-4 flex-wrap">
            {outdoorTables.map(renderTable)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${config.bg} rounded`}></div>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {config.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
