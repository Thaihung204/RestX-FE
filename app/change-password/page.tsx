"use client";

import LoginButton from "@/components/auth/LoginButton";
import authService from "@/lib/services/authService";
import React, { useState } from "react";

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const [currentPasswordTouched, setCurrentPasswordTouched] = useState(false);
    const [newPasswordTouched, setNewPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

    const validateCurrentPassword = (password: string) => {
        if (!password) {
            setCurrentPasswordError("Please enter your current password");
            return false;
        }
        setCurrentPasswordError("");
        return true;
    };

    const validateNewPassword = (password: string) => {
        if (!password) {
            setNewPasswordError("Please enter a new password");
            return false;
        }

        if (password.length < 8) {
            setNewPasswordError("Password must be at least 8 characters");
            return false;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setNewPasswordError("Password must contain uppercase, lowercase, and number");
            return false;
        }

        if (password === currentPassword) {
            setNewPasswordError("New password must be different from current password");
            return false;
        }

        setNewPasswordError("");
        return true;
    };

    const validateConfirmPassword = (confirm: string) => {
        if (!confirm) {
            setConfirmPasswordError("Please confirm your new password");
            return false;
        }

        if (confirm !== newPassword) {
            setConfirmPasswordError("Passwords do not match");
            return false;
        }

        setConfirmPasswordError("");
        return true;
    };

    const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentPassword(value);
        if (currentPasswordTouched) {
            validateCurrentPassword(value);
        }
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPassword(value);
        if (newPasswordTouched) {
            validateNewPassword(value);
        }
        // Re-validate confirm if already filled
        if (confirmNewPassword && confirmPasswordTouched) {
            validateConfirmPassword(confirmNewPassword);
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmNewPassword(value);
        if (confirmPasswordTouched) {
            validateConfirmPassword(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setCurrentPasswordTouched(true);
        setNewPasswordTouched(true);
        setConfirmPasswordTouched(true);

        const isCurrentValid = validateCurrentPassword(currentPassword);
        const isNewValid = validateNewPassword(newPassword);
        const isConfirmValid = validateConfirmPassword(confirmNewPassword);

        if (!isCurrentValid || !isNewValid || !isConfirmValid) {
            return;
        }

        // Call API to change password
        setLoading(true);
        try {
            await authService.changePassword({
                currentPassword,
                newPassword,
                confirmNewPassword,
            });

            alert('Password Changed Successfully!\n\nYour password has been updated.');

            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setCurrentPasswordTouched(false);
            setNewPasswordTouched(false);
            setConfirmPasswordTouched(false);

            // Optional: Logout and redirect to login
            // authService.logout();
            // window.location.href = '/login-email';

        } catch (error: any) {
            const errorMessage = error.message || 'Failed to change password. Please try again.';
            alert(errorMessage);
            console.error('Change password error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-bg-gradient"
        >
            {/* Decorative elements */}
            <div
                className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse auth-decorative"
            ></div>
            <div
                className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 auth-decorative"
            ></div>

            <div className="max-w-[420px] w-full space-y-8 relative z-10">
                <div
                    className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border auth-card"
                >
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl" style={{ background: '#FF380B' }}>
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <h2
                            className="text-3xl font-bold mb-2 auth-title"
                        >
                            Change Password
                        </h2>
                        <p className="auth-text">
                            Update your password to keep your account secure
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label
                                htmlFor="currentPassword"
                                className="block text-sm font-medium mb-2 auth-label"
                            >
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={handleCurrentPasswordChange}
                                onBlur={() => setCurrentPasswordTouched(true)}
                                placeholder="Enter current password"
                                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                                style={{
                                    borderColor: currentPasswordTouched && currentPasswordError ? '#ef4444' : undefined,
                                }}
                            />
                            {currentPasswordTouched && currentPasswordError && (
                                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{currentPasswordError}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="newPassword"
                                className="block text-sm font-medium mb-2 auth-label"
                            >
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                                onBlur={() => setNewPasswordTouched(true)}
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                                style={{
                                    borderColor: newPasswordTouched && newPasswordError ? '#ef4444' : undefined,
                                }}
                            />
                            {newPasswordTouched && newPasswordError && (
                                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{newPasswordError}</p>
                            )}
                            {newPasswordTouched && !newPasswordError && newPassword && (
                                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>Password is strong</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmNewPassword"
                                className="block text-sm font-medium mb-2 auth-label"
                            >
                                Confirm New Password
                            </label>
                            <input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={handleConfirmPasswordChange}
                                onBlur={() => setConfirmPasswordTouched(true)}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                                style={{
                                    borderColor: confirmPasswordTouched && confirmPasswordError ? '#ef4444' : undefined,
                                }}
                            />
                            {confirmPasswordTouched && confirmPasswordError && (
                                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{confirmPasswordError}</p>
                            )}
                            {confirmPasswordTouched && !confirmPasswordError && confirmNewPassword && (
                                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>Passwords match</p>
                            )}
                        </div>

                        <LoginButton loading={loading} text="CHANGE PASSWORD" />

                        <div
                            className="text-center pt-4 border-t"
                            style={{
                                borderColor: 'var(--border)'
                            }}
                        >
                            <a
                                href="/customer"
                                className="text-sm font-semibold transition-colors inline-flex items-center"
                                style={{ color: '#FF380B' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                            >
                                <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Back to Dashboard
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
