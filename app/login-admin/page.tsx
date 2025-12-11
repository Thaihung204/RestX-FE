"use client";

import AdminLoginHeader from "@/components/auth/AdminLoginHeader";
import LoginButton from "@/components/auth/LoginButton";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useState } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function AdminLoginPage() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
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

    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
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
      errors.push("At least 8 characters");
    }

    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push("At least one lowercase letter (a-z)");
    }

    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push("At least one uppercase letter (A-Z)");
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pwd)) {
      errors.push("At least one special character (!@#$%...)");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      if (!email) setEmailTouched(true);
      if (!password) setPasswordTouched(true);
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setEmailTouched(true);
      return;
    }

    // Strong password validation
    if (!validatePassword(password)) {
      setPasswordTouched(true);
      return;
    }

    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        `Login Form Submitted!\n\nEmail: ${email}\nRemember Me: ${remember}\n\n(This is UI demo only - No API integration)`
      );
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex"
      style={{ background: isDark ? '#0E121A' : '#f3f4f6' }}
    >
      {/* Left side - Empty space for future design */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: isDark ? '#141927' : '#fff' }}
      >
        <div className="text-center" style={{ color: isDark ? '#9ca3af' : '#9ca3af' }}>
          {/* Placeholder for future design */}
          <p className="text-sm">Design placeholder</p>
        </div>
      </div>

      {/* Right side - Background with Login Form */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #0E121A 0%, #141927 50%, #1a1a2e 100%)'
            : 'linear-gradient(135deg, #1f2937 0%, #000000 50%, #7c2d12 100%)'
        }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-10 right-10 w-64 h-64 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ background: isDark ? '#FF7A00' : '#ea580c' }}
        ></div>
        <div 
          className="absolute bottom-10 left-10 w-64 h-64 rounded-full filter blur-3xl opacity-10"
          style={{ background: isDark ? '#FF7A00' : '#f97316' }}
        ></div>

        {/* Login Form Container */}
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">
          <div className="w-full max-w-[420px]">
            <div 
              className="rounded-2xl shadow-2xl p-6 sm:p-8 border"
              style={{
                background: isDark ? 'rgba(20, 25, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 122, 0, 0.2)'
              }}
            >
              <AdminLoginHeader />

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                    style={{ color: isDark ? '#ECECEC' : '#374151' }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="admin@restx.com"
                    className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: isDark ? '#141927' : '#fff',
                      color: isDark ? '#ECECEC' : '#111827',
                      borderColor: emailTouched && emailError 
                        ? '#ef4444' 
                        : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                    }}
                    suppressHydrationWarning
                  />
                  {emailTouched && emailError && (
                    <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{emailError}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium"
                      style={{ color: isDark ? '#ECECEC' : '#374151' }}
                    >
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#FF7A00' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#E06000'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#FF7A00'}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: isDark ? '#141927' : '#fff',
                        color: isDark ? '#ECECEC' : '#111827',
                        borderColor: passwordTouched && passwordErrors.length > 0 
                          ? '#ef4444' 
                          : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                      }}
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                      style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#d1d5db' : '#374151'}
                      onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'}
                      suppressHydrationWarning>
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
                  {passwordTouched && passwordErrors.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {passwordErrors.map((error, index) => (
                        <p key={index} className="text-sm" style={{ color: '#ef4444' }}>
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <RememberCheckbox checked={remember} onChange={setRemember} />
                <LoginButton loading={loading} text="LOGIN" />
                <div className="text-center text-sm mt-6" style={{ color: isDark ? '#C5C5C5' : '#4b5563' }}>
                  By continuing, you agree to RestX&apos;s{" "}
                  <a
                    href="/terms"
                    className="font-medium"
                    style={{ color: '#FF7A00' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#E06000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FF7A00'}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="font-medium"
                    style={{ color: '#FF7A00' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#E06000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FF7A00'}
                  >
                    Privacy Policy
                  </a>
                </div>
                <div 
                  className="text-center text-sm mt-4 pt-4 border-t"
                  style={{ 
                    color: isDark ? '#C5C5C5' : '#4b5563',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
                  }}
                >
                  Don&apos;t have an account?{" "}
                  <a
                    href="/register"
                    className="font-semibold transition-colors"
                    style={{ color: '#FF7A00' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#E06000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FF7A00'}
                  >
                    Sign up here
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
