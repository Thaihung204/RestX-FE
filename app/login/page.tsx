"use client";

import LoginButton from "@/components/auth/LoginButton";
import LoginHeader from "@/components/auth/LoginHeader";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useState, useEffect } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function LoginPage() {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
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
  }, []);

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

  const isDark = mounted && mode === 'dark';
  
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
          <LoginHeader />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#ECECEC' : '#374151' }}
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
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isDark ? '#141927' : '#fff',
                  color: isDark ? '#ECECEC' : '#111827',
                  borderColor: phoneTouched && phoneError 
                    ? '#ef4444' 
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                }}
                suppressHydrationWarning
              />
              {phoneTouched && phoneError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{phoneError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#ECECEC' : '#374151' }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isDark ? '#141927' : '#fff',
                  color: isDark ? '#ECECEC' : '#111827',
                  borderColor: nameTouched && nameError 
                    ? '#ef4444' 
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                }}
                suppressHydrationWarning
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{nameError}</p>
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
          </form>
        </div>
      </div>
    </div>
  );
}
