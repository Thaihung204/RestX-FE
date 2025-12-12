"use client";

import LoginButton from "@/components/auth/LoginButton";
import React, { useState, useEffect } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function ForgotPasswordPage() {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && mode === 'dark';
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Please enter your email address");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setEmailTouched(true);

    if (!validateEmail(email)) {
      return;
    }

    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        `Password Reset Link Sent!\n\nEmail: ${email}\n\nPlease check your email for the reset link.\n\n(This is UI demo only - No API integration)`
      );
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #0E121A 0%, #141927 50%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #1f2937 0%, #000000 50%, #7c2d12 100%)'
      }}
    >
      {/* Decorative elements */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse"
        style={{ background: isDark ? '#FF7A00' : '#ea580c' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10"
        style={{ background: isDark ? '#FF7A00' : '#f97316' }}
      ></div>

      <div className="max-w-[420px] w-full space-y-8 relative z-10">
        <div 
          className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border"
          style={{
            background: isDark ? 'rgba(20, 25, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 122, 0, 0.2)'
          }}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
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
              className="text-3xl font-bold mb-2"
              style={{ color: isDark ? '#ECECEC' : '#111827' }}
            >
              Forgot Password
            </h2>
            <p style={{ color: isDark ? '#C5C5C5' : '#4b5563' }}>
              Enter your email address and we will send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#ECECEC' : '#374151' }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your.email@example.com"
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

            <LoginButton loading={loading} text="SEND RESET LINK" />

            <div 
              className="text-center pt-4 border-t"
              style={{ 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
              }}
            >
              <a
                href="/login"
                className="text-sm font-semibold transition-colors inline-flex items-center"
                style={{ color: '#FF7A00' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E06000'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF7A00'}
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
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
