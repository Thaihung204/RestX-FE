"use client";

import LoginButton from "@/components/auth/LoginButton";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useEffect, useState } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function RegisterPage() {
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
    // Improved email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
    // Remove all non-digit characters
    const phoneDigits = phone.replace(/\D/g, "");
    // Accept 10 digits (0123456789) or 11 digits starting with 84 (84123456789)
    if (phoneDigits.length === 10 && /^0[0-9]{9}$/.test(phoneDigits)) {
      return "";
    }
    if (phoneDigits.length === 11 && /^84[0-9]{9}$/.test(phoneDigits)) {
      return "";
    }
    return "Please enter a valid phone number (10 digits starting with 0, or 11 digits starting with 84)";
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    // Simulate API call to check if email exists
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate: admin@restx.com and user@restx.com already exist
        const exists =
          email.toLowerCase() === "admin@restx.com" ||
          email.toLowerCase() === "user@restx.com";
        resolve(exists);
      }, 300);
    });
  };

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    // Simulate API call to check if phone exists
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate: 0123456789 already exists
        const phoneDigits = phone.replace(/\D/g, "");
        const exists = phoneDigits === "0123456789";
        resolve(exists);
      }, 300);
    });
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
    // Update isDark when mode changes
    setIsDark(mode === "dark");
  }, [mode]);

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
            value,
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    if (name === "firstName") {
      setErrors((prev) => ({
        ...prev,
        firstName: !formData.firstName ? "Please enter your first name" : "",
      }));
    } else if (name === "lastName") {
      setErrors((prev) => ({
        ...prev,
        lastName: !formData.lastName ? "Please enter your last name" : "",
      }));
    } else if (name === "email") {
      if (!formData.email) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter your email address",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          email: validateEmail(formData.email),
        }));
      }
    } else if (name === "phone") {
      if (!formData.phone) {
        setErrors((prev) => ({
          ...prev,
          phone: "Please enter your phone number",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          phone: validatePhone(formData.phone),
        }));
      }
    } else if (name === "password") {
      if (!formData.password) {
        setErrors((prev) => ({
          ...prev,
          password: ["Please enter a password"],
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(formData.password),
        }));
      }
    } else if (name === "confirmPassword") {
      if (!formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Please confirm your password",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(
            formData.confirmPassword,
            formData.password,
          ),
        }));
      }
    }
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
      firstName:
        !formData.firstName || !formData.firstName.trim()
          ? "Please enter your first name"
          : "",
      lastName:
        !formData.lastName || !formData.lastName.trim()
          ? "Please enter your last name"
          : "",
      email:
        !formData.email || !formData.email.trim()
          ? "Please enter your email address"
          : validateEmail(formData.email),
      phone:
        !formData.phone || !formData.phone.trim()
          ? "Please enter your phone number"
          : validatePhone(formData.phone),
      password:
        !formData.password || !formData.password.trim()
          ? ["Please enter a password"]
          : validatePassword(formData.password),
      confirmPassword:
        !formData.confirmPassword || !formData.confirmPassword.trim()
          ? "Please confirm your password"
          : validateConfirmPassword(
              formData.confirmPassword,
              formData.password,
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
      alert("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    // Check for duplicate email and phone
    setLoading(true);

    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      setLoading(false);
      setErrors((prev) => ({
        ...prev,
        email: "This email is already registered",
      }));
      return;
    }

    const phoneExists = await checkPhoneExists(formData.phone);
    if (phoneExists) {
      setLoading(false);
      setErrors((prev) => ({
        ...prev,
        phone: "This phone number is already registered",
      }));
      return;
    }

    // Simulate registration
    setTimeout(() => {
      setLoading(false);
      alert(
        `Registration Submitted!\n\nName: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\n(This is UI demo only - No API integration)`,
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-bg-gradient">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 animate-pulse auth-decorative"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 auth-decorative"></div>

      <div className="max-w-[480px] w-full space-y-8 relative z-10">
        <div className="backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border auth-card">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 auth-title">
              Create Account
            </h2>
            <p className="auth-text">Join RestX today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2 auth-label">
                  First Name
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
                  className="block text-sm font-medium mb-2 auth-label">
                  Last Name
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
                className="block text-sm font-medium mb-2 auth-label">
                Email
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
                className="block text-sm font-medium mb-2 auth-label">
                Phone Number
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
                className="block text-sm font-medium mb-2 auth-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
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
                className="block text-sm font-medium mb-2 auth-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
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
                I agree to RestX&apos;s{" "}
                <a
                  href="/terms"
                  className="font-medium"
                  style={{ color: "#FF380B" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#CC2D08")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#FF380B")
                  }>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="font-medium"
                  style={{ color: "#FF380B" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#CC2D08")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#FF380B")
                  }>
                  Privacy Policy
                </a>
              </label>
            </div>

            <RememberCheckbox checked={remember} onChange={setRemember} />
            <LoginButton loading={loading} text="CREATE ACCOUNT" />

            <div
              className="text-center text-sm auth-text mt-4 pt-4 border-t"
              style={{ borderColor: "var(--border)" }}>
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold transition-colors"
                style={{ color: "#FF380B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#CC2D08")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FF380B")}>
                Sign in here
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
