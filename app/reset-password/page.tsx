"use client";

import LoginButton from "@/components/auth/LoginButton";
import authService from "@/lib/services/authService";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";
import { useSearchParams } from 'next/navigation';
import { message } from "antd";

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const { mode } = useThemeMode();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('restx-theme-mode');
      return stored === 'dark' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(mode === 'dark');

    // Get email and token from URL params
    const emailParam = searchParams.get('email') || '';
    const tokenParam = searchParams.get('token') || '';
    setEmail(emailParam);
    setToken(tokenParam);
  }, [mode, searchParams]);

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(t('reset_password_page.validation.required_password'));
      return false;
    }

    if (password.length < 8) {
      setPasswordError(t('reset_password_page.validation.password_min'));
      return false;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_lowercase'));
      return false;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_uppercase'));
      return false;
    }

    if (!/(?=.*\d)/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_number'));
      return false;
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      setPasswordError(t('reset_password_page.validation.password_special'));
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      return false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError(t('reset_password_page.validation.password_mismatch'));
      return false;
    }

    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
    // Re-validate confirm password if it's already filled
    if (confirmPassword && confirmPasswordTouched) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordTouched) {
      validateConfirmPassword(value);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) {
      setPasswordError(t('reset_password_page.validation.required_password'));
    } else {
      validatePassword(password);
    }
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordTouched(true);
    if (!confirmPassword) {
      setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
    } else {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    // Check if fields are empty
    if (!password || !password.trim()) {
      setPasswordError(t('reset_password_page.validation.required_password'));
      if (!confirmPassword || !confirmPassword.trim()) {
        setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      }
      return;
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      setConfirmPasswordError(t('reset_password_page.validation.required_confirm'));
      return;
    }

    // Validate password
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      return;
    }

    // Validate confirm password
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    if (!isConfirmPasswordValid) {
      return;
    }

    // Don't proceed if there are any errors
    if (passwordError || confirmPasswordError) {
      return;
    }

    if (!email || !token) {
      message.error(t('reset_password_page.alerts.invalid_link'));
      return;
    }

    // Call API to reset password
    setLoading(true);
    try {
      await authService.resetPassword({
        email,
        token,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });

      alert(t('reset_password_page.alerts.success'));
      // Redirect to login page
      window.location.href = '/login-email';
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password. Please try again.';
      message.error(errorMessage);
      console.error('Reset password error:', error);
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2
              className="text-3xl font-bold mb-2 auth-title"
            >
              {t('reset_password_page.title')}
            </h2>
            <p className="auth-text">
              {t('reset_password_page.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('reset_password_page.new_password_label')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder={t('reset_password_page.new_password_placeholder')}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: passwordTouched && passwordError ? '#ef4444' : undefined,
                }}
              />
              {passwordTouched && passwordError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{passwordError}</p>
              )}
              {passwordTouched && !passwordError && password && (
                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>{t('reset_password_page.password_strong')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('reset_password_page.confirm_password_label')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                placeholder={t('reset_password_page.confirm_password_placeholder')}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: confirmPasswordTouched && confirmPasswordError ? '#ef4444' : undefined,
                }}
              />
              {confirmPasswordTouched && confirmPasswordError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{confirmPasswordError}</p>
              )}
              {confirmPasswordTouched && !confirmPasswordError && confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>{t('reset_password_page.passwords_match')}</p>
              )}
            </div>

            <LoginButton loading={loading} text={t('reset_password_page.reset_btn')} />
          </form>
        </div>
      </div>
    </div>
  );
}
