'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, message, Spin, Form, Input, InputNumber, Button, Space } from 'antd';
import ReactTimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import {
    reservationService,
    CreateReservationRequest,
    CreateReservationResponse
} from '@/lib/services/reservationService';
import {
    tableService,
    TableItem,
    TableStatus
} from '@/lib/services/tableService';
import { useTranslation } from 'react-i18next';
import {
    CloseOutlined,
    CalendarOutlined,
    TeamOutlined,
    RightOutlined,
    LeftOutlined,
    CheckCircleOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useThemeMode } from '@/app/theme/AntdProvider';
import { useTenant } from '@/lib/contexts/TenantContext';

interface AdminReservationCreateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (result: CreateReservationResponse) => void;
}

export default function AdminReservationCreateModal({
    open,
    onClose,
    onSuccess
}: AdminReservationCreateModalProps) {
    const { t } = useTranslation();
    const { mode } = useThemeMode();
    const [step, setStep] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [fetchingTables, setFetchingTables] = useState<boolean>(false);

    // Form states
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [time, setTime] = useState<string>('19:00');
    const [guests, setGuests] = useState<number>(2);
    const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

    const { tenant } = useTenant();

    const parsedHours = useMemo(() => {
        if (!tenant?.businessOpeningHours) return null;
        const match = tenant.businessOpeningHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (!match) return null;
        return {
            openHour: parseInt(match[1], 10),
            openMin: parseInt(match[2], 10),
            closeHour: parseInt(match[3], 10),
            closeMin: parseInt(match[4], 10)
        };
    }, [tenant]);

    const disabledTimeObj = () => {
        if (!parsedHours) return {};
        const { openHour, closeHour, openMin, closeMin } = parsedHours;
        const disabledHours = () => {
            const hours = [];
            for (let i = 0; i < 24; i++) {
                if (i < openHour || i > closeHour) {
                    hours.push(i);
                }
            }
            return hours;
        };

        const disabledMinutes = (selectedHour: number) => {
            const minutes = [];
            if (selectedHour === openHour) {
                for (let i = 0; i < openMin; i++) minutes.push(i);
            }
            if (selectedHour === closeHour) {
                for (let i = closeMin + 1; i < 60; i++) minutes.push(i);
            }
            return minutes;
        };

        return { disabledHours, disabledMinutes };
    };

    useEffect(() => {
        if (open) {
            setStep(0);
            setDate(dayjs());
            setTime('19:00');
            setGuests(2);
            setSelectedTableIds([]);
            loadTables();
        }
    }, [open]);

    const loadTables = async () => {
        setFetchingTables(true);
        try {
            const data = await tableService.getAllTables();
            setTables(data);
        } catch (error) {
            console.error('Failed to load tables:', error);
            message.error(t('common.errors.load_failed'));
        } finally {
            setFetchingTables(false);
        }
    };

    const serviceHoursText = useMemo(() => {
        if (!parsedHours) return null;
        const from = `${String(parsedHours.openHour).padStart(2, '0')}:${String(parsedHours.openMin).padStart(2, '0')}`;
        const to = `${String(parsedHours.closeHour).padStart(2, '0')}:${String(parsedHours.closeMin).padStart(2, '0')}`;
        return t('admin.reservations.create_modal.service_hours', {
            defaultValue: 'Phục vụ từ {{from}} đến {{to}}',
            from,
            to
        });
    }, [parsedHours, t]);

    const availableTablesByGuests = useMemo(
        () => tables.filter(tbl => Number(tbl.seatingCapacity || 0) >= guests),
        [tables, guests]
    );

    const groupedTablesByGuests = useMemo(() => {
        const groups: Record<string, TableItem[]> = {};
        availableTablesByGuests.forEach(t => {
            const floor = t.floorName || 'Other';
            if (!groups[floor]) groups[floor] = [];
            groups[floor].push(t);
        });
        return Object.entries(groups);
    }, [availableTablesByGuests]);

    const handleNextStep1 = async () => {
        if (!date || !time || time.length < 4 || guests < 1) {
            message.error(t('landing.booking.confirm.error_required'));
            return;
        }
        if (availableTablesByGuests.length === 0) {
            message.error(
                t('admin.reservations.create_modal.no_table_for_guests', {
                    defaultValue: 'Không có bàn phù hợp cho {{count}} khách',
                    count: guests
                })
            );
            return;
        }
        setLoading(true);
        try {
            const reservationDateTime = `${date.format('YYYY-MM-DD')}T${time}:00`;
            await reservationService.checkTime({ reservationDateTime });
            setStep(1);
        } catch (error: any) {
            const msg = error?.response?.data?.message || t('landing.booking.confirm.error_generic');
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep2 = async () => {
        if (selectedTableIds.length === 0) {
            message.error(t('landing.booking.confirm.selected_table'));
            return;
        }
        setLoading(true);
        try {
            const reservationDateTime = `${date!.format('YYYY-MM-DD')}T${time}:00`;
            await reservationService.checkTables({
                tableIds: selectedTableIds,
                reservationDateTime,
                numberOfGuests: guests
            });
            setStep(2);
        } catch (error: any) {
            const msg = error?.response?.data?.message || t('landing.booking.confirm.error_generic');
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async (values: any) => {
        setLoading(true);
        try {
            const reservationDateTime = `${date!.format('YYYY-MM-DD')}T${time}:00`;
            const payload: CreateReservationRequest = {
                tableIds: selectedTableIds,
                reservationDateTime,
                numberOfGuests: guests,
                name: values.name,
                phone: values.phone,
                email: values.email || 'guest@restx.food', // Bypassing if admin leaves empty, maybe required by API?
                specialRequests: values.specialRequests
            };
            const result = await reservationService.createReservation(payload);
            message.success(t('landing.booking.success.title'));
            onSuccess(result);
            onClose();
        } catch (error: any) {
            const msg = error?.response?.data?.message || t('landing.booking.confirm.error_generic');
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col"
                        style={{
                            background: "var(--card)",
                            borderRadius: 24,
                            border: "1px solid var(--border)",
                            maxHeight: "90vh",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                                    {t('admin.reservations.add_new', { defaultValue: 'Đặt Bàn Mới' })}
                                </h2>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                    {step === 0 && t('admin.reservations.create_modal.step1', { defaultValue: 'Bước 1: Chọn thời gian & số lượng khách' })}
                                    {step === 1 && t('admin.reservations.create_modal.step2', { defaultValue: 'Bước 2: Chọn xếp bàn' })}
                                    {step === 2 && t('admin.reservations.create_modal.step3', { defaultValue: 'Bước 3: Thông tin khách hàng' })}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <CloseOutlined />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-sunken)' }}>
                            <AnimatePresence mode="wait">
                                {/* STEP 1: Date & Time */}
                                {step === 0 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                                                    {t('admin.reservations.create_modal.date', { defaultValue: 'Ngày đặt bàn' })}
                                                </label>
                                                <DatePicker
                                                    value={date}
                                                    onChange={setDate}
                                                    format="DD/MM/YYYY"
                                                    disabledDate={current => current && current < dayjs().startOf('day')}
                                                    className="w-full h-12 rounded-xl text-base"
                                                    suffixIcon={<CalendarOutlined style={{ color: 'var(--primary)' }} />}
                                                    styles={{ popup: { root: { zIndex: 3000 } } }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                                                    {t('admin.reservations.create_modal.time', { defaultValue: 'Giờ nhận bàn' })}
                                                </label>
                                                <div className="admin-time-picker-wrapper pill-time-picker">
                                                    <ReactTimePicker
                                                        value={time}
                                                        onChange={(val) => setTime(val || '19:00')}
                                                        format="HH:mm"
                                                        clockIcon={null}
                                                        clearIcon={null}
                                                        disableClock={true}
                                                        className="w-full"
                                                        minTime={parsedHours ? `${String(parsedHours.openHour).padStart(2, '0')}:${String(parsedHours.openMin).padStart(2, '0')}` : undefined}
                                                        maxTime={parsedHours ? `${String(parsedHours.closeHour).padStart(2, '0')}:${String(parsedHours.closeMin).padStart(2, '0')}` : undefined}
                                                    />
                                                </div>
                                                {serviceHoursText && (
                                                    <p className="admin-reservation-service-hours">
                                                        {serviceHoursText}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                                                {t('admin.reservations.create_modal.guests', { defaultValue: 'Số lượng khách' })}
                                            </label>
                                            <Space.Compact className="w-full">
                                                <div
                                                    className="h-12 px-4 flex items-center justify-center border rounded-l-xl"
                                                    style={{
                                                        borderColor: 'var(--border)',
                                                        background: 'var(--surface)',
                                                        color: 'var(--primary)'
                                                    }}
                                                >
                                                    <TeamOutlined />
                                                </div>
                                                <InputNumber
                                                    min={1}
                                                    max={100}
                                                    value={guests}
                                                    onChange={v => setGuests(v || 1)}
                                                    className="w-full h-12 rounded-r-xl text-lg font-medium"
                                                    style={{ width: '100%' }}
                                                />
                                            </Space.Compact>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: Table Selection */}
                                {step === 1 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        {fetchingTables ? (
                                            <div className="flex justify-center items-center py-12">
                                                <Spin size="large" />
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {groupedTablesByGuests.map(([floor, floorTables]) => (
                                                    <div key={floor}>
                                                        <h4 className="font-semibold mb-3 px-1 text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                            {floor}
                                                        </h4>
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                            {floorTables.map(tbl => {
                                                                const isSelected = selectedTableIds.includes(tbl.id);
                                                                const isAvailable = true; // In truth we should filter out occupied ones, but for now we let checkTables handle validation
                                                                return (
                                                                    <div
                                                                        key={tbl.id}
                                                                        onClick={() => {
                                                                            setSelectedTableIds(prev =>
                                                                                prev.includes(tbl.id)
                                                                                    ? prev.filter(id => id !== tbl.id)
                                                                                    : [...prev, tbl.id]
                                                                            );
                                                                        }}
                                                                        className={`relative p-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-[var(--border)] bg-[var(--card)] hover:border-primary/50'
                                                                            }`}
                                                                        style={{
                                                                            minHeight: 80,
                                                                            borderColor: isSelected ? 'var(--primary)' : 'var(--border)'
                                                                        }}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                                                                <CheckCircleOutlined style={{ fontSize: 10 }} />
                                                                            </div>
                                                                        )}
                                                                        <span className="font-bold text-lg" style={{ color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                                                                            {tbl.code}
                                                                        </span>
                                                                        <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                                            {tbl.seatingCapacity} {t('common.guests', { defaultValue: 'chỗ' })}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                {groupedTablesByGuests.length === 0 && (
                                                    <div
                                                        className="rounded-xl border p-4 text-sm"
                                                        style={{
                                                            borderColor: 'var(--border)',
                                                            color: 'var(--text-muted)',
                                                            background: 'var(--surface)'
                                                        }}
                                                    >
                                                        {t('admin.reservations.create_modal.no_table_for_guests', {
                                                            defaultValue: 'Không có bàn phù hợp cho {{count}} khách',
                                                            count: guests
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* STEP 3: Customer Details */}
                                {step === 2 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <div className="bg-[var(--primary-soft)] rounded-xl p-4 mb-6 flex flex-col justify-center" style={{ background: 'rgba(255, 56, 11, 0.08)' }}>
                                            <p className="font-semibold text-lg" style={{ color: 'var(--primary)' }}>
                                                {date?.format('DD/MM/YYYY')} - {time}
                                            </p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                                {guests} {t('common.guests', { defaultValue: 'khách' })} | {selectedTableIds.length} {t('admin.reservations.create_modal.selected_tables', { defaultValue: 'bàn đã chọn' })}
                                            </p>
                                        </div>

                                        <Form id="admin-reservation-create-form" layout="vertical" onFinish={handleFinish} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Form.Item name="name" label={t('landing.booking.form.name', { defaultValue: 'Tên khách hàng' })} rules={[{ required: true, message: t('landing.booking.form.error_name_required', { defaultValue: 'Vui lòng nhập tên' }) }]}>
                                                    <Input size="large" prefix={<UserOutlined className="text-gray-400" />} className="rounded-xl" />
                                                </Form.Item>
                                                <Form.Item name="phone" label={t('landing.booking.form.phone', { defaultValue: 'Số điện thoại' })} rules={[{ required: true, message: t('landing.booking.form.error_phone_required', { defaultValue: 'Vui lòng nhập SĐT' }) }]}>
                                                    <Input size="large" prefix={<PhoneOutlined className="text-gray-400" />} className="rounded-xl" />
                                                </Form.Item>
                                            </div>
                                            <Form.Item name="email" label={t('landing.booking.form.email_optional', { defaultValue: 'Email (Không bắt buộc)' })}>
                                                <Input size="large" prefix={<MailOutlined className="text-gray-400" />} className="rounded-xl" />
                                            </Form.Item>
                                            <Form.Item name="specialRequests" label={t('landing.booking.form.special_requests', { defaultValue: 'Ghi chú' })}>
                                                <Input.TextArea rows={3} className="rounded-xl py-3 px-4 text-base" />
                                            </Form.Item>
                                        </Form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-5 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                            <Button
                                onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                                className="h-11 px-6 rounded-xl text-base font-medium flex items-center gap-2 border-none"
                                style={{ background: 'var(--surface)' }}
                            >
                                {step > 0 ? (
                                    <><LeftOutlined /> {t('common.back', { defaultValue: 'Quay lại' })}</>
                                ) : t('common.cancel', { defaultValue: 'Hủy' })}
                            </Button>

                            {step === 0 && (
                                <Button
                                    type="primary"
                                    onClick={handleNextStep1}
                                    loading={loading}
                                    className="h-11 px-8 rounded-xl text-base font-bold shadow-lg"
                                    style={{ background: 'var(--primary)' }}
                                >
                                    Tiếp tục <RightOutlined />
                                </Button>
                            )}

                            {step === 1 && (
                                <Button
                                    type="primary"
                                    onClick={handleNextStep2}
                                    loading={loading}
                                    className="h-11 px-8 rounded-xl text-base font-bold shadow-lg"
                                    style={{ background: 'var(--primary)' }}
                                >
                                    Tiếp tục <RightOutlined />
                                </Button>
                            )}

                            {step === 2 && (
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    form="admin-reservation-create-form"
                                    loading={loading}
                                    className="h-11 px-8 rounded-xl text-base font-bold shadow-lg"
                                    style={{ background: 'var(--primary)' }}
                                    icon={<CheckCircleOutlined />}
                                >
                                    {t('admin.reservations.create_modal.complete', { defaultValue: 'Hoàn Tất & Đặt Bàn' })}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
