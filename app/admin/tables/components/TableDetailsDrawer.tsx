'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
    id: string;
    number: number;
    capacity: number;
    status: "available" | "occupied" | "reserved" | "cleaning";
    area: "VIP" | "Indoor" | "Outdoor";
    currentOrder?: string;
    reservationTime?: string;
}

interface TableDetailsDrawerProps {
    open: boolean;
    table: Table | null;
    onClose: () => void;
    onSave: (values: Partial<Table>) => void;
    onDelete?: () => void;
}

const STATUS_OPTIONS = [
    { label: 'Available', value: 'available', color: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' },
    { label: 'Occupied', value: 'occupied', color: '#FF380B', gradient: 'linear-gradient(135deg, #FF380B 0%, #ff6b3d 100%)' },
    { label: 'Reserved', value: 'reserved', color: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' },
    { label: 'Cleaning', value: 'cleaning', color: '#faad14', gradient: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' },
];

const AREA_OPTIONS = [
    { label: 'VIP Section', value: 'VIP' },
    { label: 'Indoor Dining', value: 'Indoor' },
    { label: 'Outdoor Terrace', value: 'Outdoor' },
];

export const TableDetailsDrawer: React.FC<TableDetailsDrawerProps> = ({
    open,
    table,
    onClose,
    onSave,
    onDelete,
}) => {
    const [formData, setFormData] = React.useState({
        number: 0,
        capacity: 4,
        area: 'Indoor' as "VIP" | "Indoor" | "Outdoor",
        status: 'available' as "available" | "occupied" | "reserved" | "cleaning",
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    useEffect(() => {
        if (table) {
            setFormData({
                number: table.number,
                capacity: table.capacity,
                area: table.area,
                status: table.status,
            });
            setErrors({});
        }
    }, [table]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.number < 1) newErrors.number = 'Table number must be at least 1';
        if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
        if (formData.capacity > 20) newErrors.capacity = 'Capacity cannot exceed 20';
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
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(6px)',
                            zIndex: 999,
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '480px',
                            maxWidth: '90vw',
                            background: 'var(--card)',
                            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: '1px solid var(--border)',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #FF380B 0%, #ff6b3d 100%)',
                                padding: '28px',
                                color: '#fff',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'rgba(255, 255, 255, 0.08)', borderRadius: '50%' }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 10,
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                backdropFilter: 'blur(10px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                                                    <rect x="3" y="10" width="18" height="10" rx="2" />
                                                    <path d="M7 10 V6 M17 10 V6" />
                                                </svg>
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                                                Table Details
                                            </h2>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                                            Manage and update table information
                                        </p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 8,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#fff',
                                            marginTop: -4,
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                        </svg>
                                    </motion.button>
                                </div>

                                {/* Table ID Badge */}
                                {table && (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                    }}>
                                        <span style={{ opacity: 0.75 }}>ID</span>
                                        <span style={{ opacity: 0.3 }}>•</span>
                                        <span>{table.id}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
                            {table && (
                                <form onSubmit={handleSubmit}>
                                    {/* Current Status Card */}
                                    <motion.div
                                        initial={{ scale: 0.96, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        style={{
                                            background: currentStatus?.gradient,
                                            padding: '24px',
                                            borderRadius: 12,
                                            marginBottom: 28,
                                            textAlign: 'center',
                                            color: '#fff',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                        }}
                                    >
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
                                                Current Status
                                            </p>
                                            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                                                {currentStatus?.label}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Form Fields */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        {/* Table Number */}
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                marginBottom: 8,
                                                letterSpacing: '-0.01em',
                                            }}>
                                                Table Number
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.number}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, number: parseInt(e.target.value) || 0 });
                                                    if (errors.number) setErrors({ ...errors, number: '' });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: 10,
                                                    border: errors.number ? '2px solid #ff4d4f' : '2px solid var(--border)',
                                                    background: 'var(--surface)',
                                                    color: 'var(--text)',
                                                    fontSize: 15,
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#FF380B'}
                                                onBlur={(e) => e.target.style.borderColor = errors.number ? '#ff4d4f' : 'var(--border)'}
                                            />
                                            {errors.number && (
                                                <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>
                                                    {errors.number}
                                                </p>
                                            )}
                                        </motion.div>

                                        {/* Capacity */}
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                marginBottom: 8,
                                                letterSpacing: '-0.01em',
                                            }}>
                                                Seating Capacity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={formData.capacity}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 });
                                                    if (errors.capacity) setErrors({ ...errors, capacity: '' });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: 10,
                                                    border: errors.capacity ? '2px solid #ff4d4f' : '2px solid var(--border)',
                                                    background: 'var(--surface)',
                                                    color: 'var(--text)',
                                                    fontSize: 15,
                                                    fontWeight: 500,
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#FF380B'}
                                                onBlur={(e) => e.target.style.borderColor = errors.capacity ? '#ff4d4f' : 'var(--border)'}
                                            />
                                            {errors.capacity && (
                                                <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>
                                                    {errors.capacity}
                                                </p>
                                            )}
                                        </motion.div>

                                        {/* Area */}
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.25 }}
                                        >
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                marginBottom: 8,
                                                letterSpacing: '-0.01em',
                                            }}>
                                                Dining Area
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={formData.area}
                                                    onChange={(e) => setFormData({ ...formData, area: e.target.value as any })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '14px 16px',
                                                        paddingRight: 40,
                                                        borderRadius: 10,
                                                        border: '2px solid var(--border)',
                                                        background: 'var(--surface)',
                                                        color: 'var(--text)',
                                                        fontSize: 15,
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        appearance: 'none',
                                                        outline: 'none',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#FF380B'}
                                                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                                >
                                                    {AREA_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <svg
                                                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="var(--text-muted)"
                                                    strokeWidth="2.5"
                                                >
                                                    <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        </motion.div>

                                        {/* Status */}
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <label style={{
                                                display: 'block',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: 'var(--text)',
                                                marginBottom: 12,
                                                letterSpacing: '-0.01em',
                                            }}>
                                                Table Status
                                            </label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                {STATUS_OPTIONS.map((status) => (
                                                    <motion.button
                                                        key={status.value}
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setFormData({ ...formData, status: status.value as any })}
                                                        style={{
                                                            padding: '14px',
                                                            borderRadius: 10,
                                                            border: formData.status === status.value ? `2px solid ${status.color}` : '2px solid var(--border)',
                                                            background: formData.status === status.value ? `${status.color}15` : 'var(--surface)',
                                                            color: formData.status === status.value ? status.color : 'var(--text)',
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            letterSpacing: '-0.01em',
                                                        }}
                                                    >
                                                        {status.label}
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
                                padding: '20px 28px',
                                borderTop: '1px solid var(--border)',
                                background: 'var(--surface)',
                                display: 'flex',
                                gap: 12,
                            }}
                        >
                            {onDelete && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onDelete}
                                    style={{
                                        flex: 1,
                                        padding: '13px 20px',
                                        borderRadius: 10,
                                        border: '2px solid #ff4d4f',
                                        background: 'transparent',
                                        color: '#ff4d4f',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                    Delete
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '13px 20px',
                                    borderRadius: 10,
                                    border: '2px solid var(--border)',
                                    background: 'var(--card)',
                                    color: 'var(--text)',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(255, 56, 11, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                style={{
                                    flex: 2,
                                    padding: '13px 20px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #FF380B 0%, #ff6b3d 100%)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    boxShadow: '0 4px 16px rgba(255, 56, 11, 0.3)',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                Save Changes
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
