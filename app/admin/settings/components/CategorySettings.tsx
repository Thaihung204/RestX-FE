"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface Category {
    id: number;
    name: string;
    image: string;
    desc: string;
}

export default function CategorySettings() {
    const { t } = useTranslation("common");
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Category>({ id: 0, name: "", image: "", desc: "" });

    // Initialize data with translations
    useEffect(() => {
        setCategories([
            {
                id: 1,
                name: t('restaurant.categories.appetizer'),
                image: "/images/restaurant/cat-1.jpg",
                desc: "Salads, soups, and starters",
            },
            {
                id: 2,
                name: t('restaurant.categories.main'),
                image: "/images/restaurant/cat-2.jpg",
                desc: "Steak, seafood, and pasta",
            },
            {
                id: 3,
                name: t('restaurant.categories.dessert'),
                image: "/images/restaurant/cat-3.jpg",
                desc: "Cakes, ice cream, and fruits",
            },
            {
                id: 4,
                name: t('restaurant.categories.drinks'),
                image: "/images/restaurant/cat-4.jpg",
                desc: "Cocktails, wine, and soft drinks",
            },
        ]);
    }, [t]);

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
        } else {
            setEditingCategory(null);
            setFormData({ id: 0, name: "", image: "", desc: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = () => {
        if (editingCategory) {
            // Edit
            setCategories(categories.map(c => c.id === editingCategory.id ? { ...formData, id: c.id } : c));
        } else {
            // Add
            const newId = Math.max(...categories.map(c => c.id), 0) + 1;
            setCategories([...categories, { ...formData, id: newId }]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (window.confirm(t("dashboard.settings.categories.confirm_delete"))) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                        {t("dashboard.settings.categories.title")}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.settings.categories.subtitle")}
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
                    {t("dashboard.settings.categories.add_category")}
                </button>
            </div>

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
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{t("dashboard.settings.categories.image")}</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{t("dashboard.settings.categories.name")}</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{t("dashboard.settings.categories.description")}</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase text-right" style={{ color: 'var(--text-muted)' }}>{t("dashboard.settings.categories.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {categories.map((cat) => (
                                <tr
                                    key={cat.id}
                                    className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    <td className="p-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm group-hover:shadow-md transition-all">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={cat.image || "/images/placeholder.jpg"}
                                                alt={cat.name}
                                                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image';
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                                            {cat.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {cat.desc}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(cat)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600"
                                                title={t("dashboard.settings.categories.edit_category")}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600"
                                                title={t("dashboard.settings.categories.delete_category")}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No categories found. Click &quot;Add Category&quot; to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in"
                        style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                                {editingCategory ? t("dashboard.settings.categories.edit_category") : t("dashboard.settings.categories.add_category")}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.settings.categories.name")}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none"
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder="e.g. Appetizers"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.settings.categories.description")}
                                </label>
                                <textarea
                                    value={formData.desc}
                                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none resize-none"
                                    rows={3}
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder="Brief description of the category"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    {t("dashboard.settings.categories.image")}
                                </label>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none"
                                            style={{
                                                background: 'var(--bg-base)',
                                                borderColor: 'var(--border)',
                                                color: 'var(--text)'
                                            }}
                                            placeholder="Image URL (e.g. /images/cat-1.jpg)"
                                        />
                                    </div>
                                </div>
                                {/* Image Preview */}
                                {formData.image && (
                                    <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="p-6 pt-2 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={handleCloseModal}
                                className="px-5 py-2.5 rounded-lg font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {t("dashboard.settings.buttons.cancel")}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: '#FF380B' }}
                            >
                                {t("dashboard.settings.buttons.save_changes")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
