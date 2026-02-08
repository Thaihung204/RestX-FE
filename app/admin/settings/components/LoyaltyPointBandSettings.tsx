
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Table, Button, Modal, Form, Input, InputNumber, Switch, message, Popconfirm, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, InfoCircleOutlined } from "@ant-design/icons";
import loyaltyService, { LoyaltyPointBand, CreateLoyaltyPointBandDto, UpdateLoyaltyPointBandDto } from "@/lib/services/loyaltyService";

export default function LoyaltyPointBandSettings() {
    const { t } = useTranslation("common");
    const [bands, setBands] = useState<LoyaltyPointBand[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBand, setEditingBand] = useState<LoyaltyPointBand | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [form] = Form.useForm();

    const fetchBands = async () => {
        setLoading(true);
        try {
            const data = await loyaltyService.getAllBands();
            setBands(data);
        } catch (error) {
            console.error("Failed to fetch loyalty point bands:", error);
            message.error(t("dashboard.manage.errors.fetch_failed", { defaultValue: "Failed to fetch loyalty point bands" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBands();
    }, []);

    const handleAdd = () => {
        setEditingBand(null);
        setImageUrl("");
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (band: LoyaltyPointBand) => {
        setEditingBand(band);
        setImageUrl(band.imageUrl || "");
        form.setFieldsValue(band);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await loyaltyService.deleteBand(id);
            message.success(t("dashboard.manage.notifications.delete_success", { defaultValue: "Deleted successfully" }));
            fetchBands();
        } catch (error) {
            console.error("Failed to delete loyalty point band:", error);
            message.error(t("dashboard.manage.errors.delete_failed", { defaultValue: "Failed to delete" }));
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, imageUrl };

            if (editingBand) {
                await loyaltyService.updateBand(editingBand.id, { ...payload, id: editingBand.id });
                message.success(t("dashboard.manage.notifications.update_success", { defaultValue: "Updated successfully" }));
            } else {
                await loyaltyService.createBand(payload);
                message.success(t("dashboard.manage.notifications.create_success", { defaultValue: "Created successfully" }));
            }

            setModalVisible(false);
            fetchBands();
        } catch (error) {
            console.error("Failed to save loyalty point band:", error);
            // message.error is usually handled by form validation or catch block here if API fails
        }
    };

    const columns = [
        {
            title: t("dashboard.manage.loyalty.form.logo", { defaultValue: "Logo" }),
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url: string) => (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                        src={url || "/images/placeholder-food.png"}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/images/placeholder-food.png"; }}
                    />
                </div>
            )
        },
        {
            title: t("dashboard.manage.loyalty.name", { defaultValue: "Band Name" }),
            dataIndex: "name",
            key: "name",
            render: (text: string) => <span className="font-medium">{text}</span>
        },
        {
            title: t("dashboard.manage.loyalty.range", { defaultValue: "Points Range" }),
            key: "range",
            render: (_: any, record: LoyaltyPointBand) => (
                <span>
                    {record.min} - {record.max !== null ? record.max : "∞"}
                </span>
            )
        },
        {
            title: t("dashboard.manage.loyalty.discount", { defaultValue: "Discount" }),
            dataIndex: "discountPercentage",
            key: "discountPercentage",
            render: (val: number) => <span>{val}%</span>
        },
        {
            title: t("dashboard.manage.loyalty.benefits", { defaultValue: "Benefits" }),
            dataIndex: "benefitDescription",
            key: "benefitDescription",
            ellipsis: true
        },
        {
            title: t("dashboard.manage.loyalty.status", { defaultValue: "Status" }),
            dataIndex: "isActive",
            key: "isActive",
            render: (isActive: boolean) => (
                <span className={`px-2 py-1 rounded text-xs ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {isActive ? t("common.status.active", { defaultValue: "Active" }) : t("common.status.inactive", { defaultValue: "Inactive" })}
                </span>
            )
        },
        {
            title: t("common.actions.title", { defaultValue: "Actions" }),
            key: "actions",
            render: (_: any, record: LoyaltyPointBand) => (
                <div className="flex gap-2">
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        type="text"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    />
                    <Popconfirm
                        title={t("common.confirm.delete_title", { defaultValue: "Are you sure?" })}
                        description={t("common.confirm.delete_msg", { defaultValue: "This action cannot be undone." })}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("common.actions.yes", { defaultValue: "Yes" })}
                        cancelText={t("common.actions.no", { defaultValue: "No" })}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text)]">
                        {t("dashboard.manage.loyalty.title", { defaultValue: "Loyalty Point Bands" })}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {t("dashboard.manage.loyalty.desc", { defaultValue: "Manage loyalty tiers and benefits" })}
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ background: 'linear-gradient(to right, #FF380B, #CC2D08)', border: 'none' }}
                >
                    {t("dashboard.manage.loyalty.add_new", { defaultValue: "Add New Band" })}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={bands}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                className="custom-table"
            />

            <Modal
                title={editingBand ? t("dashboard.manage.loyalty.edit", { defaultValue: "Edit Loyalty Band" }) : t("dashboard.manage.loyalty.create", { defaultValue: "Create Loyalty Band" })}
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
                okButtonProps={{ style: { background: '#FF380B', borderColor: '#FF380B' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ isActive: true, min: 0, discountPercentage: 0 }}
                >
                    <div className="mb-6 flex justify-center">
                        <div className="relative group">
                            <input
                                type="file"
                                id="band-logo"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.size > 2 * 1024 * 1024) {
                                            message.error(t("dashboard.settings.categories.file_size_error", { defaultValue: "File size must be less than 2MB" }));
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImageUrl(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <label
                                htmlFor="band-logo"
                                className={`
                                    relative w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
                                    ${imageUrl ? 'border-transparent' : 'border-[var(--border)] hover:border-[#FF380B] hover:bg-[#FF380B]/5'}
                                `}
                                style={{ background: imageUrl ? 'black' : 'var(--bg-base)' }}
                            >
                                {imageUrl ? (
                                    <>
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                                        />
                                        <div className="z-10 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center justify-center">
                                            <EditOutlined className="text-sm" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-2">
                                        <div className="text-[#FF380B] mb-1">
                                            <PlusOutlined />
                                        </div>
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                            {t("dashboard.manage.loyalty.form.logo", { defaultValue: "Logo" })}
                                        </span>
                                    </div>
                                )}
                            </label>
                            {imageUrl && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setImageUrl("");
                                    }}
                                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
                                    title="Remove Image"
                                >
                                    <DeleteOutlined className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>
                    <Form.Item
                        name="name"
                        label={t("dashboard.manage.loyalty.form.name", { defaultValue: "Band Name" })}
                        rules={[{ required: true, message: t("common.validation.required", { defaultValue: "This field is required" }) }]}
                    >
                        <Input placeholder="e.g. Silver, Gold" />
                    </Form.Item>

                    <Form.Item label={t("dashboard.manage.loyalty.form.range", { defaultValue: "Points Range" })} required style={{ marginBottom: 0 }}>
                        <div className="flex gap-4">
                            <Form.Item
                                name="min"
                                rules={[{ required: true }]}
                                style={{ flex: 1 }}
                            >
                                <InputNumber min={0} placeholder="Min Points" style={{ width: '100%' }} />
                            </Form.Item>
                            <span className="leading-[32px]">-</span>
                            <Form.Item
                                name="max"
                                style={{ flex: 1 }}
                                tooltip={t("dashboard.manage.loyalty.form.max_tooltip", { defaultValue: "Leave empty for infinite range" })}
                            >
                                <InputNumber min={0} placeholder="Max Points (Optional)" style={{ width: '100%' }} />
                            </Form.Item>
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="discountPercentage"
                        label={t("dashboard.manage.loyalty.form.discount", { defaultValue: "Discount Percentage (%)" })}
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} style={{ width: '100%' }} parser={(value) => value?.replace('%', '') as unknown as number} formatter={(value) => `${value}%`} />
                    </Form.Item>

                    <Form.Item
                        name="benefitDescription"
                        label={t("dashboard.manage.loyalty.form.benefits", { defaultValue: "Benefits Description" })}
                        rules={[{ required: true }]}
                    >
                        <Input.TextArea rows={3} placeholder="Describe the benefits for this tier..." />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label={t("common.status.label", { defaultValue: "Status" })}
                        valuePropName="checked"
                    >
                        <Switch checkedChildren={t("common.status.active")} unCheckedChildren={t("common.status.inactive")} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
