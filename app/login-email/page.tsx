"use client";

import LoginButton from "@/components/auth/LoginButton";
import LoginHeader from "@/components/auth/LoginHeader";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";
import { message } from "antd";

export default function LoginEmailPage() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { login } = useAuth();
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Update isDark when mode changes
    setIsDark(mode === "dark");
  }, [mode]);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("");
      return false;
    }

    // Improved email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('login_email_page.validation.invalid_email'));
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailTouched) {
      validateEmail(value);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (!email) {
      setEmailError(t('login_email_page.validation.required_email'));
    } else {
      validateEmail(email);
    }
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError("");
      return false;
    }

    if (pwd.length < 6) {
      setPasswordError(t('login_email_page.validation.password_min'));
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) {
      setPasswordError(t('login_email_page.validation.required_password'));
    } else {
      validatePassword(password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setEmailTouched(true);
    setPasswordTouched(true);

    // Check if fields are empty
    if (!email || !email.trim()) {
      setEmailError(t('login_email_page.validation.required_email'));
      if (!password || !password.trim()) {
        setPasswordError(t('login_email_page.validation.required_password'));
      }
      return;
    }

    if (!password || !password.trim()) {
      setPasswordError(t('login_email_page.validation.required_password'));
      return;
    }

    // Validate email format
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    // Validate password
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      return;
    }

    // Don't proceed if there are any errors
    if (emailError || passwordError) {
      return;
    }

    // Call API login
    setLoading(true);
    try {
      const user = await login({ email, password, rememberMe: remember });

      // Redirect sau khi login thành công
      console.log('Logged in user:', user);

      // Redirect to dashboard or home page based on user role
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'shop') {
        router.push('/staff');
      } else {
        router.push('/customer');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      message.error(errorMessage);
      console.error('Login error:', error);
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
          <LoginHeader title={t('login_email_page.title')} />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 auth-label">
                {t('login_email_page.email_label')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder={t('login_email_page.email_placeholder')}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor:
                    emailTouched && emailError ? "#ef4444" : undefined,
                }}
              />
              {emailTouched && emailError && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium auth-label">
                  {t('login_email_page.password_label')}
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#FF380B" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#CC2D08")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#FF380B")
                  }>
                  {t('login_email_page.forgot_password')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  placeholder={t('login_email_page.password_placeholder')}
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                  style={{
                    borderColor:
                      passwordTouched && passwordError ? "#ef4444" : undefined,
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
              {passwordTouched && passwordError && (
                <p className="mt-1 text-sm" style={{ color: "#ef4444" }}>
                  {passwordError}
                </p>
              )}
            </div>

            <RememberCheckbox checked={remember} onChange={setRemember} />
            <LoginButton loading={loading} text={t('login_email_page.login_btn')} />

            <div className="text-center text-sm mt-6 auth-text">
              {t('login_email_page.terms_text')}{" "}
              <a
                href="/terms"
                className="font-medium"
                style={{ color: "#FF380B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#CC2D08")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FF380B")}>
                {t('login_email_page.terms_of_service')}
              </a>{" "}
              {t('login_email_page.and')}{" "}
              <a
                href="/privacy"
                className="font-medium"
                style={{ color: "#FF380B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#CC2D08")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FF380B")}>
                {t('login_email_page.privacy_policy')}
              </a>
            </div>

            <div
              className="text-center text-sm mt-4 pt-4 border-t auth-text"
              style={{ borderColor: "var(--border)" }}>
              {t('login_email_page.no_account')}{" "}
              <a
                href="/register"
                className="font-semibold transition-colors"
                style={{ color: "#FF380B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#CC2D08")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FF380B")}>
                {t('login_email_page.sign_up_here')}
              </a>
            </div>

            <div className="text-center text-sm mt-2 auth-text">
              {t('login_email_page.or_login_with')}{" "}
              <a
                href="/login"
                className="font-semibold transition-colors"
                style={{ color: "#FF380B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#CC2D08")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FF380B")}>
                {t('login_email_page.phone_number')}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
