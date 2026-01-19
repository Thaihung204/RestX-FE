"use client";

import LoginButton from "@/components/auth/LoginButton";
import LoginHeader from "@/components/auth/LoginHeader";

import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useState, useEffect } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";


export default function LoginPage() {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  // Get initial theme from localStorage to prevent flash
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('restx-theme-mode');
      return stored === 'dark' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Update isDark when mode changes
    setIsDark(mode === 'dark');
  }, [mode]);

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError("");
      return false;
    }

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }

    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      setPhoneError("Phone number must contain only digits");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
      if (phoneTouched) {
        validatePhone(value);
      }
    }
  };

  const validateName = (name: string) => {
    if (!name) {
      setNameError("");
      return false;
    }

    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }

    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameTouched) {
      validateName(value);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!phone || !name) {
      if (!phone) setPhoneTouched(true);
      if (!name) setNameTouched(true);
      return;
    }

    // Phone validation
    if (!validatePhone(phone)) {
      setPhoneTouched(true);
      return;
    }

    // Name validation
    if (!validateName(name)) {
      setNameTouched(true);
      return;
    }

    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        `Login Form Submitted!\n\nPhone: ${phone}\nName: ${name}\nRemember Me: ${remember}\n\n(This is UI demo only - No API integration)`
      );
    }, 1000);
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
          <LoginHeader />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2 auth-label"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="0123456789"
                maxLength={10}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: phoneTouched && phoneError ? '#ef4444' : undefined,
                }}
              />
              {phoneTouched && phoneError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{phoneError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 auth-label"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: nameTouched && nameError ? '#ef4444' : undefined,
                }}
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{nameError}</p>
              )}
            </div>

            <LoginButton loading={loading} text="LOGIN" />

            <div className="text-center text-sm mt-6 auth-text">
              By continuing, you agree to RestX&apos;s{" "}
              <a
                href="/terms"
                className="font-medium"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-medium"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
              >
                Privacy Policy
              </a>
            </div>

            <div 
              className="text-center text-sm mt-4 auth-text"
            >
              Or login with{" "}
              <a
                href="/login-email"
                className="font-semibold transition-colors"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
              >
                Email & Password
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
