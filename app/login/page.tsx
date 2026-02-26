"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../theme/AntdProvider";
import { message } from "antd";
import { HeroSection } from "@/components/auth/HeroSection";
import { GlassInput } from "@/components/ui/GlassInput";
import { PhoneOutlined, UserOutlined, LoginOutlined, MailOutlined } from "@ant-design/icons";

const HERO_IMAGE_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMVZhsaYs2Qw_8QN0YP6pUMn326Srs9wfsj18Q0patddJBVkz5g8pm0S3OhMz-nY-BrDmVA-ghfvRsndeKDyq7w68KAOVQDc5vQo71xWYxvYcQaEm4IFJ6BGYlfoaK6APcvIObkkPn9yvUiw6Iditv27W_j60EhvOhHb3Cwfupw1Ib5bCO6lO0NctemCVio6026jqjhbziRbrzl6OVbYkM0LUSLR_OV1pQf1oH1nNavimugtYDhjEH_oSrIweo29PEMjmlq80Ol4";

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { mode } = useThemeMode();

  // State
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  // Helper: set auth cookie so Next middleware sees login state
  const setAuthCookie = (token: string) => {
    if (typeof document === "undefined") return;
    const maxAge = 8 * 60 * 60; // 8 hours in seconds
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  // Validation Logic
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
      if (phoneChecked) {
        setPhoneChecked(false);
        setIsNewUser(false);
        setName("");
      }
      if (phoneTouched && value.length === 10) {
        setPhoneError("");
        checkPhoneNumber(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);

    const isPhoneValid = validatePhone(phone);
    if (!isPhoneValid || phoneError) return;

    if (!phoneChecked) {
      await checkPhoneNumber(phone);
      return;
    }

    setLoading(true);
    try {
      const authService = (await import('@/lib/services/authService')).default;
      const axiosInstance = (await import('@/lib/services/axiosInstance')).default;

      if (isNewUser) {
        setNameTouched(true);
        if (!validateName(name) || nameError) {
          setLoading(false);
          return;
        }

        const result = await authService.register({
          phoneNumber: phone,
          fullName: name.trim()
        });

        if (result.user || !result.requireLogin) {
          // Nếu backend trả token và đã được authService.register lưu vào localStorage,
          // cố gắng đọc và sync sang cookie để middleware nhận diện.
          const token = localStorage.getItem("accessToken");
          if (token) {
            setAuthCookie(token);
          }
          window.location.href = '/customer';
        } else {
          message.info(result.message || 'Registration successful. Please login.');
        }
      } else {
        const response = await axiosInstance.post('/auth/customer/phone-login', {
          phoneNumber: phone
        });

        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            // Sync token vào cookie cho middleware
            setAuthCookie(data.accessToken);
          }
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          if (data.user) localStorage.setItem('userInfo', JSON.stringify(data.user));

          const userRoles: string[] = data.user?.roles || (data.user?.role ? [data.user.role] : []);
          const hasRole = (role: string) => userRoles.some(r => r.toLowerCase() === role.toLowerCase());

          if (hasRole('Waiter') || hasRole('Kitchen Staff')) {
            window.location.href = '/staff';
          } else if (hasRole('Admin') || hasRole('System Admin')) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/customer';
          }
        } else {
          throw new Error(response.data?.message || 'Login failed');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
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

        {/* Desktop Ambient Orbs (Hidden on mobile to keep bg clean) */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 auth-orb"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 auth-orb"></div>

        {/* Login Form Container */}
        <div className="auth-form-card w-full max-w-md p-8 lg:p-10 relative z-20 transition-colors duration-300">

          {/* Mobile Logo */}
          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#FF380B]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[#FF380B]/20 p-4">
              <img
                src="/images/logo/restx-removebg-preview.png"
                alt="RestX Logo"
                className={`w-full h-full object-contain ${isDark ? 'filter invert hue-rotate-180 brightness-110' : ''}`}
              />
            </div>
            <span className="auth-heading font-bold uppercase tracking-[0.2em] text-2xl drop-shadow-md">RestX</span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className="auth-heading text-3xl font-bold tracking-tight drop-shadow-sm transition-colors">
              {t('login_page.title') || "Login with Phone"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <GlassInput
                  id="phone"
                  label={t('login_page.phone_label')}
                  icon={<PhoneOutlined />}
                  type="tel"
                  placeholder="0123456789"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={loading}
                />
                {(phoneTouched && phoneError) && (
                  <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{phoneError}</div>
                )}
                {checkingPhone && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-[#FF380B]"></div>
                  </div>
                )}
              </div>

              {/* Tên Input - Chỉ hiện khi New User */}
              {(isNewUser) && (
                <div className="animate-fade-in-down">
                  <GlassInput
                    id="name"
                    label={t('login_page.name_label')}
                    icon={<UserOutlined />}
                    type="text"
                    placeholder={t('login_page.name_placeholder')}
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameTouched && e.target.value.trim().length >= 2) setNameError("");
                    }}
                    onBlur={() => setNameTouched(true)}
                    disabled={loading}
                  />
                  {(nameTouched && nameError) && (
                    <div className="text-red-400 text-xs mt-1 ml-1 font-medium">{nameError}</div>
                  )}
                </div>
              )}

              {/* Welcome message */}
              {phoneChecked && !isNewUser && name && (
                <div className="auth-welcome-banner auth-fade-in">
                  <p className="auth-welcome-text text-sm">
                    {t('login_page.welcome_back')}, <span className="font-bold text-[var(--primary)]">{name}</span>!
                  </p>
                </div>
              )}
            </div>

            {/* Remember Me & Terms */}
            {isNewUser && (
              <div className="auth-terms-text text-center">
                {t('login_page.terms_text')} <a href="#" className="auth-terms-link">{t('login_page.terms_of_service')}</a> & <a href="#" className="auth-terms-link">{t('login_page.privacy_policy')}</a>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#FF380B] hover:bg-[#ff5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a100e] focus:ring-[#FF380B] transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,56,11,0.39)] hover:shadow-[0_6px_20px_rgba(255,56,11,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-white ml-1"></div>
                  ) : (
                    <span className="material-icons text-white/50 group-hover:text-white transition-colors text-lg">
                      <LoginOutlined />
                    </span>
                  )}
                </span>
                {loading ? t('login_button.loading') : (isNewUser ? t('login_button.register_text') : t('login_button.login_text'))}
              </button>
            </div>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="auth-divider w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="auth-divider-label">
                {t('login_page.or_login_with')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/login-email'}
              className="auth-alt-btn w-full inline-flex justify-center items-center py-3 px-4 shadow-sm text-sm font-medium group"
            >
              <MailOutlined className="auth-input-icon text-xl mr-3" />
              <span>{t('login_page.email_password')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
          <p className="auth-footer-text">
            © {new Date().getFullYear()} RestX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
