"use client";

import { HeroSection } from "@/components/auth/HeroSection";
import LoginButton from "@/components/auth/LoginButton";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import { GlassInput } from "@/components/ui/GlassInput";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AntdProvider";
import { useRouter } from "next/navigation";
import { App } from "antd";
import adminAuthService from "@/lib/services/adminAuthService";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

export default function AdminLoginPage() {
  const { t } = useTranslation('auth');
  const { message } = App.useApp();
  const { mode } = useThemeMode();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("");
      return false;
    }

    // Improved email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('login_admin_page.validation.invalid_email'));
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

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordErrors([]);
      return false;
    }

    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push(t('login_admin_page.validation.password_requirements.length'));
    }

    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push(t('login_admin_page.validation.password_requirements.lowercase'));
    }

    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push(t('login_admin_page.validation.password_requirements.uppercase'));
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pwd)) {
      errors.push(t('login_admin_page.validation.password_requirements.special'));
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (!email) {
      setEmailError(t('login_admin_page.validation.required_email'));
    } else {
      validateEmail(email);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) {
      setPasswordErrors([t('login_admin_page.validation.required_password')]);
    } else {
      validatePassword(password);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setEmailTouched(true);
    setPasswordTouched(true);

    // Check if fields are empty
    if (!email || !email.trim()) {
      setEmailError(t('login_admin_page.validation.required_email'));
      if (!password || !password.trim()) {
        setPasswordErrors([t('login_admin_page.validation.required_password')]);
      }
      return;
    }

    if (!password || !password.trim()) {
      setPasswordErrors([t('login_admin_page.validation.required_password')]);
      return;
    }

    // Validate email format
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    // Validate strong password
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      return;
    }

    // Don't proceed if there are any errors
    if (emailError || passwordErrors.length > 0) {
      return;
    }

    // Call API for admin login
    setLoading(true);
    adminAuthService.login({ email, password, rememberMe: remember })
      .then((user) => {
        message.success(`Login successful! Welcome ${user.fullName}`);
        router.push('/tenants'); // Default destination for super admin
      })
      .catch((err) => {
        message.error(err.message || t('login_page.login_failed', 'Login failed. Please try again.'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const isDark = mode === 'dark';

  return (
    <div className="auth-page-bg flex flex-col md:flex-row relative transition-colors duration-300">
      {/* Mobile Background: Image with Overlay */}
      <div className="absolute inset-0 z-0 md:hidden">
        <img
          src={HERO_IMAGE_URL}
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for mobile legibility */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/40"></div>
      </div>

      {/* Left Side: Hero Image & Branding (Desktop Only) */}
      <HeroSection />

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">

        {/* Desktop Ambient Orbs */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Login Form Container */}
        <div className="auth-form-card w-full max-w-md p-8 lg:p-10 relative z-20 transition-colors duration-300">

          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[var(--primary)]/20 p-4">
              <img
                src="/images/logo/restx-removebg-preview.png"
                alt="RestX Logo"
                className={`w-full h-full object-contain ${isDark ? 'filter invert hue-rotate-180 brightness-110' : ''}`}
              />
            </div>
            <span className="auth-heading font-bold uppercase tracking-[0.2em] text-2xl drop-shadow-md">RestX Admin</span>
          </div>

           <div className="hidden md:block mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{t('login_admin_page.title')}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <GlassInput
                  id="email"
                  label={t('login_admin_page.email_label')}
                  icon={<MailOutlined />}
                  type="email"
                  placeholder={t('login_admin_page.email_placeholder')}
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={loading}
                />
                {(emailTouched && emailError) && (
                  <div className="text-red-400 text-xs mt-1 ml-1 font-medium text-left">{emailError}</div>
                )}
              </div>

              <div className="relative">
                <GlassInput
                  id="password"
                  label={t('login_admin_page.password_label')}
                  icon={<LockOutlined />}
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login_admin_page.password_placeholder')}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeInvisibleOutlined className="text-lg" /> : <EyeOutlined className="text-lg" />}
                </button>
                {(passwordTouched && passwordErrors.length > 0) && (
                  <div className="mt-1 space-y-0.5">
                    {passwordErrors.map((error, index) => (
                      <div key={index} className="text-red-400 text-xs ml-1 font-medium text-left">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-right mt-1">
                  <a
                    href="/forgot-password"
                    className="text-xs text-[var(--primary)] hover:text-[#ff5c35] hover:underline transition-colors"
                  >
                    {t('login_admin_page.forgot_password')}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <RememberCheckbox checked={remember} onChange={setRemember} />
            </div>

            <div>
              <LoginButton loading={loading} text={t('login_admin_page.login_btn')} />
            </div>


          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
          <p className="auth-footer-text text-sm">
            © {new Date().getFullYear()} RestX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
