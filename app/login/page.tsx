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
          if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
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
    <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-300 ${isDark ? 'bg-[#0E121A]' : 'bg-[#F7F8FA]'}`}>

      {/* Mobile Background: Image with Overlay */}
      <div className="absolute inset-0 z-0 md:hidden">
        <img
          src={HERO_IMAGE_URL}
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for mobile legibility */}
        <div className={`absolute inset-0 backdrop-blur-[2px] ${isDark ? 'bg-[#0E121A]/80' : 'bg-black/40'}`}></div>
      </div>

      {/* Left Side: Hero Image & Branding (Desktop Only) */}
      <HeroSection />

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative overflow-hidden min-h-screen z-10">

        {/* Desktop Ambient Orbs (Hidden on mobile to keep bg clean) */}
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-[#FF380B] rounded-full filter blur-[100px] opacity-[0.05] pointer-events-none"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 bg-[#FF6B3B] rounded-full filter blur-[80px] opacity-[0.05] pointer-events-none"></div>

        {/* Login Form Container */}
        <div className={`w-full max-w-md backdrop-blur-xl rounded-2xl p-8 lg:p-10 relative z-20 border transition-colors duration-300
        ${isDark
            ? 'bg-white/5 border-white/10 shadow-2xl'
            : 'bg-white/80 border-gray-200 shadow-xl'}`}>

          {/* Mobile Logo */}
          <div className="md:hidden w-full flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#FF380B]/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-md border border-[#FF380B]/20 p-4">
              <img
                src="/images/logo/restx-removebg-preview.png"
                alt="RestX Logo"
                className={`w-full h-full object-contain ${isDark ? 'filter invert hue-rotate-180 brightness-110' : ''}`}
              />
            </div>
            <span className={`font-bold uppercase tracking-[0.2em] text-2xl drop-shadow-md ${isDark ? 'text-white' : 'text-gray-900'}`}>RestX</span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className={`text-3xl font-bold tracking-tight drop-shadow-sm transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center animate-fade-in">
                  <p className="text-white text-sm">
                    {t('login_page.welcome_back')}, <span className="font-bold text-[#FF380B]">{name}</span>!
                  </p>
                </div>
              )}
            </div>

            {/* Remember Me & Terms */}
            {isNewUser && (
              <div className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('login_page.terms_text')} <a href="#" className="text-[#FF380B] hover:underline font-medium">{t('login_page.terms_of_service')}</a> & <a href="#" className="text-[#FF380B] hover:underline font-medium">{t('login_page.privacy_policy')}</a>
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
              <div className={`w-full border-t ${isDark ? 'border-white/20' : 'border-gray-200'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-3 bg-transparent backdrop-blur-xl rounded-full border md:border-none ${isDark ? 'text-gray-400 border-white/10 md:bg-[#0E121A]' : 'text-gray-500 border-gray-200 md:bg-[#F7F8FA]'}`}>
                {t('login_page.or_login_with')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/login-email'}
              className={`w-full inline-flex justify-center items-center py-3 px-4 border rounded-xl shadow-sm backdrop-blur-md text-sm font-medium transition-all duration-200 group
              ${isDark
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white hover:border-white/30'
                  : 'border-gray-200 bg-white/50 hover:bg-white/80 text-gray-700 hover:text-gray-900 hover:border-gray-300'}`}
            >
              <MailOutlined className={`text-xl mr-3 group-hover:text-inherit ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
              <span>{t('login_page.email_password')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none mix-blend-plus-lighter">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} RestX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
