"use client";

import orderDetailStatusService, {
    OrderDetailStatus,
} from "@/lib/services/orderDetailStatusService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    MenuOutlined,
    PlusOutlined,
    StarFilled,
    StarOutlined,
} from "@ant-design/icons";
import {
    Button,
    ColorPicker,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Table,
    Tag,
    Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function OrderDetailStatusSettings() {
    const { t } = useTranslation("common");
    const [statuses, setStatuses] = useState<OrderDetailStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStatus, setEditingStatus] = useState<OrderDetailStatus | null>(null);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

    // Sort mode state
    const [sortMode, setSortMode] = useState(false);
    const [sortedStatuses, setSortedStatuses] = useState<OrderDetailStatus[]>([]);
    const [savingOrder, setSavingOrder] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const defaultValues = {
        name: "",
        code: "",
        color: "#ff0000",
        isDefault: false,
    };

    const dbColors = Array.from(new Set(statuses.map((s) => s.color).filter(Boolean)));

    const fetchStatuses = async () => {
        setLoading(true);
        try {
            const data = await orderDetailStatusService.getAllStatuses();
            setStatuses(data);
        } catch (error) {
            messageApi.error(
                extractApiErrorMessage(error, t("dashboard.manage.order_status.errors.fetch_failed")),
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatuses(); }, []);

    useEffect(() => {
        if (modalVisible) {
            if (editingStatus) {
                form.setFieldsValue(editingStatus);
            } else {
                form.resetFields();
                form.setFieldsValue(defaultValues);
            }
        }
    }, [modalVisible, editingStatus, form]);

    const handleAdd = () => { setEditingStatus(null); setModalVisible(true); form.resetFields(); };
    const handleEdit = (status: OrderDetailStatus) => { setEditingStatus(status); setModalVisible(true); form.setFieldsValue(status); };

    const handleDelete = async (id: string) => {
        if (deletingId) return;
        try {
            setDeletingId(id);
            await orderDetailStatusService.deleteStatus(id);
            messageApi.success(t("dashboard.manage.notifications.delete_success"));
            fetchStatuses();
        } catch (error: any) {
            messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.order_status.errors.delete_failed")));
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const colorValue =
                typeof values.color === "string"
                    ? values.color
                    : (values.color?.toHexString?.() ?? values.color);

            const statusData = { name: values.name, code: values.code, color: colorValue, isDefault: values.isDefault ?? false };

            if (editingStatus) {
                await orderDetailStatusService.updateStatus(editingStatus.id, { ...statusData, id: editingStatus.id });
                messageApi.success(t("dashboard.manage.notifications.update_success"));
            } else {
                await orderDetailStatusService.createStatus(statusData);
                messageApi.success(t("dashboard.manage.notifications.create_success"));
            }
            setModalVisible(false);
            fetchStatuses();
        } catch (error: any) {
            if (error?.errorFields) { setIsSaving(false); return; }
            messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.order_status.errors.save_failed")));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetDefault = async (record: OrderDetailStatus) => {
        if (record.isDefault || settingDefaultId) return;
        try {
            setSettingDefaultId(record.id);
            await orderDetailStatusService.setAsDefault(record);
            messageApi.success(t("dashboard.manage.notifications.update_success"));
            fetchStatuses();
        } catch (error) {
            messageApi.error(extractApiErrorMessage(error, t("dashboard.manage.order_status.errors.update_failed")));
        } finally {
            setSettingDefaultId(null);
        }
    };

    // Sort mode handlers
    const enterSortMode = () => {
        const sorted = [...statuses].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setSortedStatuses(sorted);
        setSortMode(true);
    };

    const cancelSortMode = () => { setSortMode(false); setDragOverIndex(null); };

    const handleDragStart = (index: number) => { dragItem.current = index; };
    const handleDragEnter = (index: number) => { dragOverItem.current = index; setDragOverIndex(index); };
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null; dragOverItem.current = null; setDragOverIndex(null); return;
        }
        const updated = [...sortedStatuses];
        const dragged = updated.splice(dragItem.current, 1)[0];
        updated.splice(dragOverItem.current, 0, dragged);
        dragItem.current = null; dragOverItem.current = null; setDragOverIndex(null);
        setSortedStatuses(updated);
    };

    const handleSaveOrder = async () => {
        setSavingOrder(true);
        try {
            const payload = sortedStatuses.map((s, index) => ({ ...s, displayOrder: index + 1 }));
            await orderDetailStatusService.updateDisplayOrder(payload);
            messageApi.success(t("dashboard.settings.categories.order_saved"));
            await fetchStatuses();
            setSortMode(false);
        } catch (error) {
            messageApi.error(extractApiErrorMessage(error, t("dashboard.settings.categories.order_error")));
        } finally {
            setSavingOrder(false);
        }
    };

    const tableData = sortMode
        ? sortedStatuses
        : [...statuses].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const columns: ColumnsType<OrderDetailStatus> = [
        {
            title: t("dashboard.settings.categories.display_order"),
            key: "displayOrder",
            width: 110,
            render: (_, record, index) =>
                sortMode ? (
                    <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                        <MenuOutlined className="text-base opacity-50" />
                        <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                ) : (
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                        {record.displayOrder ?? index + 1}
                    </span>
                ),
        },
        {
            title: t("dashboard.manage.order_status.table.name"),
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center border transition-colors"
                        style={{ backgroundColor: record.color, borderColor: "var(--border)" }}
                    />
                    <div>
                        <span className="font-semibold block" style={{ color: "var(--text)" }}>{text}</span>
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{record.color}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t("dashboard.manage.order_status.table.code"),
            dataIndex: "code",
            key: "code",
            render: (text) => (
                <Tag
                    className="font-mono px-3 py-1.5 rounded-lg font-bold uppercase shadow-sm border-0"
                    style={{ backgroundColor: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: t("dashboard.manage.order_status.table.default"),
            key: "isDefault",
            align: "center",
            width: 100,
            render: (_, record) => (
                <Tooltip title={record.isDefault
                    ? t("dashboard.manage.order_status.tooltip.current_default")
                    : t("dashboard.manage.order_status.tooltip.set_default")}>
                    <Button
                        type="text"
                        shape="circle"
                        onClick={() => handleSetDefault(record)}
                        loading={settingDefaultId === record.id}
                        disabled={record.isDefault || !!settingDefaultId || !!deletingId || sortMode}
                        icon={record.isDefault
                            ? <StarFilled className="text-yellow-400 text-lg" />
                            : <StarOutlined className="text-gray-400 hover:text-yellow-400 text-lg transition-colors" />}
                    />
                </Tooltip>
            ),
        },
        ...(!sortMode ? [{
            title: t("dashboard.manage.order_status.table.actions"),
            key: "actions",
            align: "right" as const,
            width: 150,
            render: (_: any, record: OrderDetailStatus) => (
                <div className="flex justify-end gap-2">
                    <Tooltip title={t("dashboard.manage.order_status.tooltip.edit")}>
                        <Button
                            type="text"
                            icon={<EditOutlined className="text-blue-500" />}
                            onClick={() => handleEdit(record)}
                            disabled={!!deletingId || !!settingDefaultId || isSaving}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        />
                    </Tooltip>
                    <Popconfirm
                        title={t("dashboard.manage.order_status.confirm_delete")}
                        description={t("dashboard.manage.order_status.confirm_delete_desc")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("dashboard.manage.order_status.actions.confirm")}
                        cancelText={t("dashboard.manage.order_status.actions.cancel")}
                        okButtonProps={{ danger: true }}>
                        <Tooltip title={t("dashboard.manage.order_status.tooltip.delete")}>
                            <Button
                                type="text"
                                icon={<DeleteOutlined className="text-red-500" />}
                                loading={deletingId === record.id}
                                disabled={!!deletingId || !!settingDefaultId || isSaving}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        }] : []),
    ];

    return (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            {contextHolder}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">
                        {t("dashboard.manage.order_status.title")}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {t("dashboard.manage.order_status.subtitle")}
                    </p>
                </div>
                <div className="flex gap-2">
                    {sortMode ? (
                        <>
                            <Button icon={<CloseOutlined />} onClick={cancelSortMode} disabled={savingOrder}>
                                {t("dashboard.settings.buttons.cancel")}
                            </Button>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                loading={savingOrder}
                                onClick={handleSaveOrder}
                                style={{ background: "var(--primary)", border: "none" }}>
                                {t("dashboard.settings.buttons.save_changes")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                icon={<MenuOutlined />}
                                onClick={enterSortMode}
                                disabled={loading}
                                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                                {t("dashboard.settings.categories.display_order")}
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleAdd}
                                icon={<PlusOutlined />}
                                disabled={loading}
                                style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
                                {t("dashboard.manage.order_status.add_status")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={tableData}
                rowKey="id"
                loading={loading}
                pagination={false}
                className="admin-loyalty-table"
                onRow={sortMode ? (_, index) => ({
                    draggable: true,
                    style: {
                        cursor: "grab",
                        background: dragOverIndex === index ? "rgba(var(--primary-rgb,99,102,241),0.06)" : undefined,
                        outline: dragOverIndex === index ? "2px solid var(--primary)" : undefined,
                        transition: "background 0.15s, outline 0.15s",
                    },
                    onDragStart: () => handleDragStart(index!),
                    onDragEnter: () => handleDragEnter(index!),
                    onDragEnd: handleDragEnd,
                    onDragOver: (e: React.DragEvent) => e.preventDefault(),
                }) : undefined}
            />

            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white shadow-lg">
                            {editingStatus ? <EditOutlined className="text-lg" /> : <PlusOutlined className="text-lg" />}
                        </div>
                        <div>
                            <span className="text-lg font-bold block leading-tight" style={{ color: "var(--text)" }}>
                                {editingStatus
                                    ? t("dashboard.manage.order_status.edit_status")
                                    : t("dashboard.manage.order_status.add_status")}
                            </span>
                            <span className="text-sm font-normal block" style={{ color: "var(--text-muted)" }}>
                                {editingStatus
                                    ? t("dashboard.manage.order_status.modal_subtitle_edit")
                                    : t("dashboard.manage.order_status.modal_subtitle_create")}
                            </span>
                        </div>
                    </div>
                }
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => !isSaving && setModalVisible(false)}
                okText={t("dashboard.settings.buttons.save_changes")}
                cancelText={t("dashboard.settings.buttons.cancel")}
                okButtonProps={{
                    loading: isSaving,
                    disabled: isSaving,
                    className: "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-none text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all",
                    size: "large",
                    shape: "round",
                }}
                cancelButtonProps={{
                    size: "large",
                    shape: "round",
                    style: { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" },
                }}
                className="modern-modal"
                width={500}
                centered
                forceRender>
                <Form form={form} layout="vertical" className="mt-2" initialValues={defaultValues} requiredMark={false}>
                    <Form.Item
                        name="name"
                        label={<span className="font-medium" style={{ color: "var(--text)" }}>{t("dashboard.manage.order_status.name")}</span>}
                        rules={[{ required: true, message: t("dashboard.manage.order_status.name_required") }]}>
                        <Input size="large" className="rounded-xl px-4 py-2.5" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="code"
                            normalize={(value) => value?.toUpperCase()}
                            label={<span className="font-medium" style={{ color: "var(--text)" }}>{t("dashboard.manage.order_status.code")}</span>}
                            rules={[{ required: true, message: t("dashboard.manage.order_status.code_required") }]}>
                            <Input size="large" className="rounded-xl uppercase px-4 py-2.5" />
                        </Form.Item>

                        <Form.Item
                            name="color"
                            label={<span className="font-medium" style={{ color: "var(--text)" }}>{t("dashboard.manage.order_status.color")}</span>}
                            rules={[{ required: true, message: t("dashboard.manage.order_status.color_required") }]}>
                            <ColorPicker
                                showText
                                size="large"
                                format="hex"
                                presets={dbColors.length > 0 ? [{ label: t("dashboard.manage.order_status.color_from_db"), colors: dbColors }] : []}
                                className="w-full justify-start rounded-xl"
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
