"use client";

import { AdminSelect } from "@/components/ui/AdminSelect";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  area: string;
  floorId?: string;
  currentOrder?: string;
  reservationTime?: string;
  shape?: "Square" | "Circle" | "Rectangle" | "Oval";
  width?: number;
  height?: number;
  rotation?: number;
  qrCodeUrl?: string;
}

interface FloorOption {
  id: string;
  name: string;
}

interface TableDetailsDrawerProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
  onSave: (values: Partial<Table>) => void;
  onDelete?: () => void;
  floors?: FloorOption[];
}

const STATUS_OPTIONS = [
  {
    labelKey: "status_available",
    value: "available",
    color: "#52c41a",
    gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
  },
  {
    labelKey: "status_occupied",
    value: "occupied",
    color: "var(--primary)",
    gradient:
      "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
  },
  {
    labelKey: "status_reserved",
    value: "reserved",
    color: "#1890ff",
    gradient: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
  },
  {
    labelKey: "status_cleaning",
    value: "cleaning",
    color: "#faad14",
    gradient: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
  },
];

const SHAPE_OPTIONS = [
  { labelKey: "shape_square", value: "Square" },
  { labelKey: "shape_circle", value: "Circle" },
  { labelKey: "shape_rectangle", value: "Rectangle" },
  { labelKey: "shape_oval", value: "Oval" },
];

// ─── QR Code Section ───────────────────────────────────────────────────────────
function QRCodeSection({ qrCodeUrl, tableNumber, tableId }: { qrCodeUrl: string; tableNumber: string; tableId: string }) {
  const { t } = useTranslation();
  const tDetails = (key: string, options?: Record<string, unknown>) =>
    t(`tables.details.${key}`, { ns: "dashboard", ...options });
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = () => {
    const tableLink = typeof window !== "undefined"
      ? `${window.location.origin}/customer/${tableId}`
      : `/customer/${tableId}`;
    navigator.clipboard.writeText(tableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `table-${tableNumber}-qr.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.15 }}
      style={{
        marginBottom: 28,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {tDetails("qr_title", { number: tableNumber })}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '2px 8px',
        }}>
          {tDetails("qr_scan")}
        </span>
      </div>

      {/* QR Image */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '20px 18px',
      }}>
        {imgError ? (
          <div style={{
            width: 160, height: 160,
            borderRadius: 10,
            background: 'var(--card)',
            border: '2px dashed var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 12,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span style={{ textAlign: 'center' }}>{tDetails("qr_load_failed")}</span>
          </div>
        ) : (
          <div style={{
            padding: 12,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
            <img
              src={qrCodeUrl}
              alt={`QR Code bàn ${tableNumber}`}
              width={148}
              height={148}
              style={{ display: 'block', borderRadius: 4 }}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 8,
              border: '1.5px solid var(--border)',
              background: copied ? 'rgba(82,196,26,0.1)' : 'var(--card)',
              color: copied ? '#52c41a' : 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {tDetails("copied")}
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {tDetails("copy_link")}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 8px var(--primary-glow)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {tDetails("download_qr")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const TableDetailsDrawer: React.FC<TableDetailsDrawerProps> = ({
  open,
  table,
  onClose,
  onSave,
  onDelete,
  floors = [],
}) => {
  const { t } = useTranslation();
  const tDetails = (key: string, options?: Record<string, unknown>) =>
    t(`tables.details.${key}`, { ns: "dashboard", ...options });
  const [formData, setFormData] = React.useState({
    number: "",
    capacity: 4,
    area: "" as string,
    status: "available" as "available" | "occupied" | "reserved" | "cleaning",
    shape: "Square" as "Square" | "Circle" | "Rectangle" | "Oval",
    width: 80,
    height: 80,
    rotation: 0,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  useEffect(() => {
    if (table) {
      setFormData({
        number: table.number,
        capacity: table.capacity,
        area: table.floorId || floors[0]?.id || "",
        status: table.status,
        shape: table.shape || "Square",
        width: table.width || 80,
        height: table.height || 80,
        rotation: table.rotation || 0,
      });
      setErrors({});
    }
  }, [table]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.number.trim())
      newErrors.number = tDetails("errors.number_required");
    if (formData.capacity < 1)
      newErrors.capacity = t("table_form.errors.capacity_min");
    if (formData.capacity > 20)
      newErrors.capacity = t("table_form.errors.capacity_max");
    if (formData.width < 20) newErrors.width = tDetails("errors.width_too_small");
    if (formData.height < 20) newErrors.height = tDetails("errors.height_too_small");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === formData.status);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
            animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
            exit={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "520px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: "var(--card)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}>
            {/* Header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                padding: "28px",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}>
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 220,
                  height: 220,
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "50%",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 8,
                      }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2">
                          <rect x="3" y="10" width="18" height="10" rx="2" />
                          <path d="M7 10 V6 M17 10 V6" />
                        </svg>
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 24,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}>
                        {tDetails("title")}
                      </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                      {tDetails("subtitle")}
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      color: "#fff",
                      marginTop: -4,
                    }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                </div>


              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
              {table && (
                <form onSubmit={handleSubmit}>
                  {/* Current Status Card */}
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      background: currentStatus?.gradient,
                      padding: "24px",
                      borderRadius: 12,
                      marginBottom: 28,
                      textAlign: "center",
                      color: "#fff",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    }}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: 11,
                          opacity: 0.85,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          fontWeight: 600,
                        }}>
                        {tDetails("current_status")}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}>
                        {currentStatus ? tDetails(currentStatus.labelKey) : ""}
                      </p>
                    </div>
                  </motion.div>

                  {/* QR Code Section */}
                  {table.qrCodeUrl && (
                    <QRCodeSection qrCodeUrl={table.qrCodeUrl} tableNumber={table.number} tableId={table.id} />
                  )}

                  {/* Form Fields */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}>
                    {/* Table Number */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                            marginBottom: 8,
                          }}>
                          {tDetails("table_code")}
                        </label>
                        <input
                          type="text"
                          value={formData.number}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              number: e.target.value,
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                            marginBottom: 8,
                          }}>
                          {tDetails("seating_capacity")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.capacity}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              capacity: parseInt(e.target.value) || 0,
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Shape and Rotation */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("shape")}
                        </label>
                        <AdminSelect
                          value={formData.shape}
                          onChange={(e) => setFormData({ ...formData, shape: e.target.value as any })}
                          className="py-[14px]"
                          style={{
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                          }}
                        >
                          {SHAPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{tDetails(opt.labelKey)}</option>
                          ))}
                        </AdminSelect>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("rotation")}
                        </label>
                        <input
                          type="number"
                          value={formData.rotation}
                          onChange={(e) => setFormData({ ...formData, rotation: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("width")}
                        </label>
                        <input
                          type="number"
                          value={formData.width}
                          onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                          {tDetails("height")}
                        </label>
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "2px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Area */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 8,
                          letterSpacing: "-0.01em",
                        }}>
                        {tDetails("floor")}
                      </label>
                      <AdminSelect
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            area: e.target.value as any,
                          })
                        }
                        className="py-[14px] font-medium"
                        style={{
                          borderRadius: 10,
                          border: "2px solid var(--border)",
                        }}
                      >
                        {AREA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </AdminSelect>
                    </motion.div>

                    {/* Status */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 12,
                          letterSpacing: "-0.01em",
                        }}>
                        {tDetails("table_status")}
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}>
                        {STATUS_OPTIONS.map((status) => (
                          <motion.button
                            key={status.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                status: status.value as any,
                              })
                            }
                            style={{
                              padding: "14px",
                              borderRadius: 10,
                              border:
                                formData.status === status.value
                                  ? `2px solid ${status.color}`
                                  : "2px solid var(--border)",
                              background:
                                formData.status === status.value
                                  ? `${status.color}15`
                                  : "var(--surface)",
                              color:
                                formData.status === status.value
                                  ? status.color
                                  : "var(--text)",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              letterSpacing: "-0.01em",
                            }}>
                            {tDetails(status.labelKey)}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "20px 28px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                gap: 12,
              }}>
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDelete}
                  style={{
                    flex: 1,
                    padding: "13px 20px",
                    borderRadius: 10,
                    border: "2px solid #ff4d4f",
                    background: "transparent",
                    color: "#ff4d4f",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "-0.01em",
                  }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  {tDetails("delete")}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "2px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}>
                {tDetails("cancel")}
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 24px var(--primary-glow)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 16px var(--primary-glow)",
                  letterSpacing: "-0.01em",
                }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {tDetails("save_changes")}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
