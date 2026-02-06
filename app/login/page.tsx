"use client";

import LoginButton from "@/components/auth/LoginButton";
import LoginHeader from "@/components/auth/LoginHeader";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  // Get initial theme from localStorage to prevent flash
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("restx-theme-mode");
      return (
        stored === "dark" ||
        (stored === null &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Update isDark when mode changes
    setIsDark(mode === "dark");
  }, [mode]);

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError("");
      return false;
    }

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length !== 10) {
      setPhoneError(t('login_page.validation.phone_length'));
      return false;
    }

    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      setPhoneError(t('login_page.validation.phone_digits'));
      return false;
    }

    setPhoneError("");
    return true;
  };

  const checkPhoneNumber = async (phoneNumber: string) => {
    setCheckingPhone(true);
    try {
      const authService = (await import('@/lib/services/authService')).default;
      const result = await authService.checkPhone(phoneNumber);

      setPhoneChecked(true);
      setIsNewUser(!result.exists);

      if (result.exists && result.name) {
        setName(result.name);
      } else {
        setName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      setPhone(value);

      // Reset check state if changed
      if (phoneChecked) {
        setPhoneChecked(false);
        setIsNewUser(false);
        setName("");
      }

      // Clear error if phone becomes valid after submit attempt
      if (phoneTouched && value.length === 10) {
        setPhoneError("");
        checkPhoneNumber(value);
      }
    }
  };

  const validateName = (name: string) => {
    if (!name) {
      setNameError("");
      return false;
    }

    if (name.trim().length < 2) {
      setNameError(t('login_page.validation.name_length'));
      return false;
    }

    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Clear error if name becomes valid after submit attempt
    if (nameTouched && value.trim().length >= 2) {
      setNameError("");
    }
  };

  const handlePhoneBlur = () => {
    // Only mark as touched, validation happens on submit
  };

  const handleNameBlur = () => {
    // Only mark as touched, validation happens on submit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setPhoneTouched(true);

    // Validate phone
    const isPhoneValid = validatePhone(phone);
    if (!isPhoneValid) {
      return;
    }

    // Don't proceed if there are any errors
    if (phoneError) {
      return;
    }

    // Step 1: Check phone if not checked
    if (!phoneChecked) {
      await checkPhoneNumber(phone);
      // If checking finished and user exists -> auto login? 
      // Or wait for user to click "Login".
      // Let's just return to let UI update (show Name or change button text)
      // However, if the user clicked the button, they expect action.

      // We need to re-evaluate after check.
      // Since `checkPhoneNumber` is async and updates state, we can't rely on state immediately here without refs or re-render.
      // But for simplicity, we return and let user click again OR we can duplicate logic inside `checkPhoneNumber`.
      // Better UX: Button changes to "Checking..." then updates.
      return;
    }

    // Step 2: Handle based on user status
    setLoading(true);
    try {
      const authService = (await import('@/lib/services/authService')).default;
      const axiosInstance = (await import('@/lib/services/axiosInstance')).default;

      if (isNewUser) {
        // Register flow
        setNameTouched(true);
        const isNameValid = validateName(name);

        if (!isNameValid || nameError) {
          setLoading(false);
          return;
        }

        const result = await authService.register({
          phoneNumber: phone,
          fullName: name.trim()
        });

        if (result.user || !result.requireLogin) {
          window.location.href = '/customer';
        } else {
          alert(result.message || 'Registration successful. Please login.');
        }

      } else {
        // Login flow - Call phone-login API
        // Since authService.login() uses email/pass, we use axios manual call or add phoneLogin to authService
        const response = await axiosInstance.post('/auth/customer/phone-login', {
          phoneNumber: phone
        });

        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          // Save tokens
          if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          if (data.user) localStorage.setItem('userInfo', JSON.stringify(data.user));

          window.location.href = '/customer';
        } else {
          throw new Error(response.data?.message || 'Login failed');
        }
      }

    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-bg-gradient">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse auth-decorative"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 auth-decorative"></div>

      <div className="max-w-[420px] w-full space-y-8 relative z-10">
        <div className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border auth-card">
          <LoginHeader />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('login_page.phone_label')}
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  placeholder={t('login_page.phone_placeholder')}
                  maxLength={10}
                  className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      phoneTouched && phoneError ? "#ef4444" : undefined,
                  }}
                  disabled={loading}
                />
                {checkingPhone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-current" style={{ color: 'var(--primary-color, #FF380B)' }}></div>
                  </div>
                )}
              </div>
              {phoneTouched && phoneError && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('login_page.name_label')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder={t('login_page.name_placeholder')}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: nameTouched && nameError ? "#ef4444" : undefined,
                }}
                disabled={loading || (phoneChecked && !isNewUser)}
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {nameError}
                </p>
              )}
            </div>

            {/* Welcome message for existing user */}
            {phoneChecked && !isNewUser && name && (
              <div className="animate-fade-in-down mb-4 text-center">
                <p className="text-lg font-medium auth-text">
                  {t('login_page.welcome_back', { defaultValue: 'Xin chào' })}, <span style={{ color: '#FF380B' }}>{name}</span>!
                </p>
              </div>
            )}

            <LoginButton
              loading={loading}
              text={
                isNewUser ? t('login_button.register_text') :
                  t('login_button.login_text')
              }
            />

            <div className="text-center text-sm mt-6 auth-text">
              {t('login_page.terms_text')}{" "}
              <a
                href="/terms"
                className="font-medium"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}>
                {t('login_page.terms_of_service')}
              </a>{" "}
              &
              <a
                href="/privacy"
                className="font-medium"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
              >
                {t('login_page.privacy_policy')}
              </a>
            </div>

            <div
              className="text-center text-sm mt-4 auth-text"
            >
              {t('login_page.or_login_with')}{" "}
              <a
                href="/login-email"
                className="font-semibold transition-colors"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
              >
                {t('login_page.email_password')}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
