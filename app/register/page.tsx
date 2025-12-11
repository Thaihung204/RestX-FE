"use client";

import LoginButton from "@/components/auth/LoginButton";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useState, useEffect } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function RegisterPage() {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && mode === 'dark';
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
    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
    if (!/^[0-9]{10}$/.test(phone)) {
      return "Please enter a valid 10-digit phone number";
    }
    return "";
  };

  const validatePassword = (pwd: string): string[] => {
    if (!pwd) return [];

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
    if (!/(?=.*[0-9])/.test(pwd)) {
      errors.push("At least one number (0-9)");
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pwd)) {
      errors.push("At least one special character (!@#$%...)");
    }

    return errors;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateConfirmPassword = (confirmPwd: string, pwd: string) => {
    if (!confirmPwd) return "";
    if (confirmPwd !== pwd) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name as keyof typeof touched]) {
      // Validate on change if already touched
      if (name === "email") {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      } else if (name === "phone") {
        setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
      } else if (name === "password") {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value),
          confirmPassword: validateConfirmPassword(
            formData.confirmPassword,
            value
          ),
        }));
      } else if (name === "confirmPassword") {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(value, formData.password),
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      firstName: !formData.firstName ? "Please enter your first name" : "",
      lastName: !formData.lastName ? "Please enter your last name" : "",
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
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

    if (hasErrors) return;

    if (!acceptTerms) {
      alert("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        `Registration Submitted!\n\nName: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\n(This is UI demo only - No API integration)`
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

      <div className="max-w-[480px] w-full space-y-8 relative z-10">
        <div 
          className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border"
          style={{
            background: isDark ? 'rgba(20, 25, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 122, 0, 0.2)'
          }}
        >
          <div className="text-center mb-6">
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ color: isDark ? '#ECECEC' : '#111827' }}
            >
              Create Account
            </h2>
            <p style={{ color: isDark ? '#C5C5C5' : '#4b5563' }}>Join RestX today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#ECECEC' : '#374151' }}
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isDark ? '#141927' : '#fff',
                    color: isDark ? '#ECECEC' : '#111827',
                    borderColor: touched.firstName && errors.firstName 
                      ? '#ef4444' 
                      : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                  }}
                  suppressHydrationWarning
                />
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#ECECEC' : '#374151' }}
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isDark ? '#141927' : '#fff',
                    color: isDark ? '#ECECEC' : '#111827',
                    borderColor: touched.lastName && errors.lastName 
                      ? '#ef4444' 
                      : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                  }}
                  suppressHydrationWarning
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isDark ? '#141927' : '#fff',
                  color: isDark ? '#ECECEC' : '#111827',
                  borderColor: touched.email && errors.email 
                    ? '#ef4444' 
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                }}
                suppressHydrationWarning
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
              )}
            </div>

            {/* Phone */}
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
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isDark ? '#141927' : '#fff',
                  color: isDark ? '#ECECEC' : '#111827',
                  borderColor: touched.phone && errors.phone 
                    ? '#ef4444' 
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                }}
                suppressHydrationWarning
              />
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#ECECEC' : '#374151' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isDark ? '#141927' : '#fff',
                    color: isDark ? '#ECECEC' : '#111827',
                    borderColor: touched.password && errors.password.length > 0 
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
              {touched.password && errors.password.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {errors.password.map((error, index) => (
                    <p key={index} className="text-sm" style={{ color: '#ef4444' }}>
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
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#ECECEC' : '#374151' }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isDark ? '#141927' : '#fff',
                    color: isDark ? '#ECECEC' : '#111827',
                    borderColor: touched.confirmPassword && errors.confirmPassword 
                      ? '#ef4444' 
                      : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'),
                  }}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#d1d5db' : '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'}
                  suppressHydrationWarning>
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
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
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
                  className="w-4 h-4 border rounded focus:ring-3 focus:ring-orange-300 cursor-pointer"
                  style={{
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                    background: isDark ? '#141927' : '#f9fafb',
                  }}
                />
              </div>
              <label htmlFor="terms" className="ml-3 text-sm" style={{ color: isDark ? '#C5C5C5' : '#4b5563' }}>
                I agree to RestX&apos;s{" "}
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
              </label>
            </div>

            <RememberCheckbox checked={remember} onChange={setRemember} />
            <LoginButton loading={loading} text="CREATE ACCOUNT" />

            <div className="text-center text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
              Already have an account?{" "}
              <a
                href="/login-admin"
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                Sign in here
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
