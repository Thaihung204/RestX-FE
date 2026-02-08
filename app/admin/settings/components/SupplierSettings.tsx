"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { message } from "antd";

// Helper to generate ID safely
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface Supplier {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
    createdAt?: string; // Changed to string to match JSON persistence
    updatedAt?: string; // Changed to string to match JSON persistence
}

export default function SupplierSettings() {
    const { t } = useTranslation("common");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Supplier>({
        id: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        isActive: true
    });

    // Load suppliers from localStorage on mount
    useEffect(() => {
        const savedSuppliers = localStorage.getItem('restaurant-suppliers');
        if (savedSuppliers) {
            try {
                setSuppliers(JSON.parse(savedSuppliers));
            } catch (error) {
                console.error('Failed to load suppliers from localStorage:', error);
                loadDefaultSuppliers();
            }
        } else {
            loadDefaultSuppliers();
        }
    }, []);

    // Save suppliers to localStorage whenever they change
    useEffect(() => {
        if (suppliers.length > 0) {
            localStorage.setItem('restaurant-suppliers', JSON.stringify(suppliers));
        }
    }, [suppliers]);

    const loadDefaultSuppliers = () => {
        setSuppliers([
            {
                id: generateId(),
                name: "Fresh Veggies Co.",
                email: "contact@freshveggies.com",
                phone: "0123456789",
                address: "123 Market Street, District 1",
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: "Ocean Seafood Ltd.",
                email: "contact@oceanseafood.com",
                phone: "0987654321",
                address: "456 Harbor Road, District 2",
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
        ]);
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({
                id: "",
                name: "",
                phone: "",
                email: "",
                address: "",
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleSave = () => {
        // Validation
        if (!formData.name.trim()) {
            message.error('Please enter supplier name');
            return;
        }
        if (!formData.phone.trim()) {
            message.error('Please enter phone number');
            return;
        }

        const now = new Date().toISOString();

        if (editingSupplier) {
            // Edit
            setSuppliers(suppliers.map(s =>
                s.id === editingSupplier.id
                    ? { ...formData, id: s.id, updatedAt: now }
                    : s
            ));
            message.success('Supplier updated successfully');
        } else {
            // Add
            const newSupplier: Supplier = {
                ...formData,
                id: generateId(),
                createdAt: now,
                updatedAt: now
            };
            setSuppliers([...suppliers, newSupplier]);
            message.success('Supplier added successfully');
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            setSuppliers(suppliers.filter(s => s.id !== id));
            message.success('Supplier deleted');
        }
    };

    const toggleStatus = (id: string) => {
        setSuppliers(suppliers.map(s =>
            s.id === id ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() } : s
        ));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                        Supplier Management
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Manage your restaurant suppliers and vendors
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
                    Add Supplier
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
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Supplier</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Email</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Phone</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                                <th className="p-5 font-semibold text-sm tracking-wide uppercase text-right" style={{ color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {suppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    <td className="p-4">
                                        <div>
                                            <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                                                {supplier.name}
                                            </div>
                                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                {supplier.address}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {supplier.email || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {supplier.phone}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(supplier.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${supplier.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {supplier.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(supplier)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600"
                                                title="Edit Supplier"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600"
                                                title="Delete Supplier"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No suppliers found. Click &quot;Add Supplier&quot; to create one.
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
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={handleCloseModal}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in"
                        style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    Supplier Name *
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
                                    placeholder="e.g. Fresh Veggies Co."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none"
                                        style={{
                                            background: 'var(--bg-base)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text)'
                                        }}
                                        placeholder="0123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none"
                                        style={{
                                            background: 'var(--bg-base)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text)'
                                        }}
                                        placeholder="contact@supplier.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#FF380B] focus:border-transparent transition-all outline-none resize-none"
                                    rows={3}
                                    style={{
                                        background: 'var(--bg-base)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                    placeholder="Full address of the supplier"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-[#FF380B] focus:ring-[#FF380B]"
                                    />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                        Active
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 pt-2 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={handleCloseModal}
                                className="px-5 py-2.5 rounded-lg font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: '#FF380B' }}
                            >
                                {editingSupplier ? "Update" : "Add"} Supplier
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
