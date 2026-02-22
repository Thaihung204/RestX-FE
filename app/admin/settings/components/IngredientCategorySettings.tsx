"use client";

import { Popconfirm } from "antd";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface IngredientCategory {
    id: string;
    name: string;
    description: string;
    unit: string;
}



export default function IngredientCategorySettings() {
    const { t } = useTranslation("common");
    const [categories, setCategories] = useState<IngredientCategory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
    const [formData, setFormData] = useState<IngredientCategory>({
        id: "",
        name: "",
        description: "",
        unit: "kg"
    });

    const getDefaultCategories = (): IngredientCategory[] => [
        {
            id: "1",
            name: t("dashboard.manage.ingredient_categories.defaults.vegetables.name", { defaultValue: "Vegetables" }),
            description: t("dashboard.manage.ingredient_categories.defaults.vegetables.description", { defaultValue: "Fresh vegetables and greens" }),
            unit: "kg"
        },
        {
            id: "2",
            name: t("dashboard.manage.ingredient_categories.defaults.meat.name", { defaultValue: "Meat" }),
            description: t("dashboard.manage.ingredient_categories.defaults.meat.description", { defaultValue: "Beef, pork, chicken, etc." }),
            unit: "kg"
        },
        {
            id: "3",
            name: t("dashboard.manage.ingredient_categories.defaults.seafood.name", { defaultValue: "Seafood" }),
            description: t("dashboard.manage.ingredient_categories.defaults.seafood.description", { defaultValue: "Fish, shrimp, crab, etc." }),
            unit: "kg"
        },
        {
            id: "4",
            name: t("dashboard.manage.ingredient_categories.defaults.dairy.name", { defaultValue: "Dairy" }),
            description: t("dashboard.manage.ingredient_categories.defaults.dairy.description", { defaultValue: "Milk, cheese, butter, etc." }),
            unit: "liter"
        },
        {
            id: "5",
            name: t("dashboard.manage.ingredient_categories.defaults.spices.name", { defaultValue: "Spices" }),
            description: t("dashboard.manage.ingredient_categories.defaults.spices.description", { defaultValue: "Salt, pepper, herbs, etc." }),
            unit: "gram"
        },
        {
            id: "6",
            name: t("dashboard.manage.ingredient_categories.defaults.sauces.name", { defaultValue: "Sauces" }),
            description: t("dashboard.manage.ingredient_categories.defaults.sauces.description", { defaultValue: "Soy sauce, fish sauce, etc." }),
            unit: "bottle"
        },
    ];

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('ingredient-categories');
        if (saved) {
            try {
                setCategories(JSON.parse(saved));
            } catch {
                setCategories(getDefaultCategories());
            }
        } else {
            setCategories(getDefaultCategories());
        }
    }, [t]);

    // Save to localStorage
    useEffect(() => {
        if (categories.length > 0) {
            localStorage.setItem('ingredient-categories', JSON.stringify(categories));
        }
    }, [categories]);

    const handleOpenModal = (category?: IngredientCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
        } else {
            setEditingCategory(null);
            setFormData({ id: "", name: "", description: "", unit: "kg" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        if (editingCategory) {
            setCategories(categories.map(c =>
                c.id === editingCategory.id ? { ...formData, id: c.id } : c
            ));
        } else {
            const newId = Date.now().toString();
            setCategories([...categories, { ...formData, id: newId }]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    const unitOptions = ["kg", "gram", "liter", "ml", "piece", "bottle", "can", "pack", "box"];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                        {t("dashboard.manage.ingredient_categories.title", { defaultValue: "Ingredient Categories" })}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.manage.ingredient_categories.subtitle", {
                            defaultValue: "Organize your ingredients by category for better inventory management"
                        })}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #FF380B 0%, #ff5e3a 100%)' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t("dashboard.manage.ingredient_categories.add", { defaultValue: "Add Category" })}
                </button>
            </div>

            {/* Table */}
            <div
                className="rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead style={{ background: 'var(--bg-base)' }}>
                            <tr>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                                    {t("dashboard.manage.ingredient_categories.name", { defaultValue: "Name" })}
                                </th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                                    {t("dashboard.manage.ingredient_categories.description", { defaultValue: "Description" })}
                                </th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                                    {t("dashboard.manage.ingredient_categories.unit", { defaultValue: "Default Unit" })}
                                </th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase text-right" style={{ color: 'var(--text-muted)' }}>
                                    {t("dashboard.manage.ingredient_categories.actions", { defaultValue: "Actions" })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {categories.map((cat) => (
                                <tr
                                    key={cat.id}
                                    className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                                style={{
                                                    background: `linear-gradient(135deg, #FF380B 0%, #ff5e3a 100%)`,
                                                    opacity: 0.9
                                                }}
                                            >
                                                {cat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold" style={{ color: 'var(--text)' }}>
                                                {cat.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {cat.description}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                background: 'rgba(255, 56, 11, 0.1)',
                                                color: '#FF380B'
                                            }}
                                        >
                                            {t(`dashboard.manage.ingredient_categories.units.${cat.unit}`, { defaultValue: cat.unit })}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(cat)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <Popconfirm
                                                title={t("dashboard.manage.ingredient_categories.confirm_delete", {
                                                    defaultValue: "Are you sure you want to delete this category?"
                                                })}
                                                onConfirm={() => handleDelete(cat.id)}
                                                okText={t("common.yes", { defaultValue: "Yes" })}
                                                cancelText={t("common.no", { defaultValue: "No" })}
                                                okButtonProps={{ danger: true }}>
                                                <button
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-zinc-800">
                                                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                            <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                                                {t("dashboard.manage.ingredient_categories.empty_title", { defaultValue: "No Categories Found" })}
                                            </p>
                                            <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                                                {t("dashboard.manage.ingredient_categories.empty", {
                                                    defaultValue: "Get started by adding your first ingredient category."
                                                })}
                                            </p>
                                            <button
                                                onClick={() => handleOpenModal()}
                                                className="mt-4 px-4 py-2 text-sm text-[#FF380B] font-medium hover:bg-[#FF380B]/10 rounded-lg transition-colors"
                                            >
                                                {t("dashboard.manage.ingredient_categories.add", { defaultValue: "Add Category" })}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={handleCloseModal}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
                        style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: 'var(--border)' }}>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                                {editingCategory
                                    ? t("dashboard.manage.ingredient_categories.edit", { defaultValue: "Edit Category" })
                                    : t("dashboard.manage.ingredient_categories.add", { defaultValue: "Add Category" })
                                }
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.manage.ingredient_categories.name", { defaultValue: "Name" })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none"
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder={t("dashboard.manage.ingredient_categories.name_placeholder")}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.manage.ingredient_categories.description", { defaultValue: "Description" })}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none resize-none"
                                    rows={3}
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder={t("dashboard.manage.ingredient_categories.description_placeholder")}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.manage.ingredient_categories.unit", { defaultValue: "Default Unit" })}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none appearance-none cursor-pointer"
                                        style={{
                                            background: 'var(--bg-base)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text)'
                                        }}
                                    >
                                        {unitOptions.map(unit => (
                                            <option key={unit} value={unit}>
                                                {t(`dashboard.manage.ingredient_categories.units.${unit}`, { defaultValue: unit })}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: 'var(--border)' }}>
                            <button
                                onClick={handleCloseModal}
                                className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {t("dashboard.settings.buttons.cancel", { defaultValue: "Cancel" })}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name.trim()}
                                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl shadow-[#FF380B]/20 hover:shadow-[#FF380B]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: '#FF380B' }}
                            >
                                {t("dashboard.settings.buttons.save_changes", { defaultValue: "Save" })}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
