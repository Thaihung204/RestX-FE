"use client";

import LoginButton from "@/components/auth/LoginButton";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import authService from "@/lib/services/authService";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function RegisterPage() {
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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [remember, setRemember] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: [] as string[],
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const validateEmail = (email: string) => {
    if (!email) return "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return t('register_page.validation.invalid_email');
    }
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
    if (!/^[0-9]{10}$/.test(phone)) {
      return t('register_page.validation.invalid_phone');
    }
    return "";
  };



  const validatePassword = (pwd: string): string[] => {
    if (!pwd) return [];

    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push(t('register_page.password_requirements.length'));
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push(t('register_page.password_requirements.lowercase'));
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push(t('register_page.password_requirements.uppercase'));
    }
    if (!/(?=.*[0-9])/.test(pwd)) {
      errors.push(t('register_page.password_requirements.number'));
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pwd)) {
      errors.push(t('register_page.password_requirements.special'));
    }

    return errors;
  };

  useEffect(() => {
    setMounted(true);
    // Update isDark when mode changes
    setIsDark(mode === "dark");
  }, [mode]);

  const validateConfirmPassword = (confirmPwd: string, pwd: string) => {
    if (!confirmPwd) return "";
    if (confirmPwd !== pwd) {
      return t('register_page.validation.password_mismatch');
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Only clear errors if field becomes valid after submit attempt
    if (touched[name as keyof typeof touched]) {
      if (name === "firstName" && value.trim()) {
        setErrors((prev) => ({ ...prev, firstName: "" }));
      } else if (name === "lastName" && value.trim()) {
        setErrors((prev) => ({ ...prev, lastName: "" }));
      } else if (name === "email" && !validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "" }));
      } else if (name === "phone" && !validatePhone(value)) {
        setErrors((prev) => ({ ...prev, phone: "" }));
      } else if (name === "password") {
        const passwordErrors = validatePassword(value);
        if (passwordErrors.length === 0) {
          setErrors((prev) => ({ ...prev, password: [] }));
        }
        // Also check confirm password match
        if (formData.confirmPassword && value === formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
      } else if (name === "confirmPassword" && value === formData.password) {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only mark as touched, don't validate yet
    // Validation will happen on submit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const newErrors = {
      firstName: !formData.firstName ? t('register_page.validation.required_first_name') : "",
      lastName: !formData.lastName ? t('register_page.validation.required_last_name') : "",
      email: !formData.email ? t('register_page.validation.required_email') : validateEmail(formData.email),
      phone: !formData.phone ? t('register_page.validation.required_phone') : validatePhone(formData.phone),
      password: !formData.password ? [t('register_page.validation.required_password')] : validatePassword(formData.password),
      confirmPassword: !formData.confirmPassword ? t('register_page.validation.required_confirm_password') : validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors =
      newErrors.firstName ||
      newErrors.lastName ||
      newErrors.email ||
      newErrors.phone ||
      newErrors.password.length > 0 ||
      newErrors.confirmPassword;

    if (hasErrors) {
      return;
    }

    if (!acceptTerms) {
      alert(t('register_page.alerts.accept_terms'));
      return;
    }

    // Call API to register
    setLoading(true);
    try {
      const result = await authService.register({
        phoneNumber: formData.phone,
        fullName: `${formData.firstName} ${formData.lastName}`,
      });

      if (result.requireLogin) {
        // Registration successful but needs manual login
        alert(result.message || 'Registration successful! Please login with your credentials.');
        window.location.href = '/login-email';
      } else {
        // Auto-login successful
        alert(
          t('register_page.alerts.submitted', {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
          })
        );
        // Redirect to home or dashboard
        window.location.href = '/';
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to register. Please try again.';

      // Handle specific validation errors
      if (errorMessage.toLowerCase().includes('phone number') && errorMessage.toLowerCase().includes('registered')) {
        setErrors(prev => ({ ...prev, phone: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else {
        alert(errorMessage);
      }

      console.warn('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-bg-gradient">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse auth-decorative"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 auth-decorative"></div>

      <div className="max-w-[480px] w-full space-y-8 relative z-10">
        <div className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border auth-card">
          <div className="text-center mb-6">
            <h2
              className="text-3xl font-bold mb-2 auth-title"
            >
              {t('register_page.title')}
            </h2>
            <p className="auth-text">{t('register_page.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2 auth-label"
                >
                  {t('register_page.first_name')}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John"
                  className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      touched.firstName && errors.firstName
                        ? "#ef4444"
                        : undefined,
                  }}
                />
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium mb-2 auth-label"
                >
                  {t('register_page.last_name')}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      touched.lastName && errors.lastName
                        ? "#ef4444"
                        : undefined,
                  }}
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('register_page.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor:
                    touched.email && errors.email ? "#ef4444" : undefined,
                }}
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('register_page.phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0123456789"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor:
                    touched.phone && errors.phone ? "#ef4444" : undefined,
                }}
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('register_page.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('register_page.password_placeholder')}
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      touched.password && errors.password.length > 0
                        ? "#ef4444"
                        : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none auth-icon-button">
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {errors.password.map((error, index) => (
                    <p
                      key={index}
                      className="text-sm"
                      style={{ color: "#ef4444" }}>
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 auth-label"
              >
                {t('register_page.confirm_password')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('register_page.confirm_password_placeholder')}
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      touched.confirmPassword && errors.confirmPassword
                        ? "#ef4444"
                        : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none auth-icon-button">
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 border rounded cursor-pointer auth-checkbox"
                  style={
                    { "--tw-ring-color": "#FF380B" } as React.CSSProperties
                  }
                />
              </div>
              <label htmlFor="terms" className="ml-3 text-sm auth-text">
                {t('register_page.i_agree')}{" "}
                <a
                  href="/terms"
                  className="font-medium"
                  style={{ color: '#FF380B' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                >
                  {t('register_page.terms_of_service')}
                </a>{" "}
                &{" "}
                <a
                  href="/privacy"
                  className="font-medium"
                  style={{ color: '#FF380B' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
                >
                  {t('register_page.privacy_policy')}
                </a>
              </label>
            </div>

            <RememberCheckbox checked={remember} onChange={setRemember} />
            <LoginButton loading={loading} text={t('register_page.create_account_btn')} />

            <div className="text-center text-sm auth-text mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              {t('register_page.already_have_account')}{" "}
              <a
                href="/login"
                className="font-semibold transition-colors" style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}>
                {t('register_page.sign_in_here')}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
