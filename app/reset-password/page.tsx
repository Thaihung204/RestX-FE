"use client";

import LoginButton from "@/components/auth/LoginButton";
import React, { useState, useEffect } from "react";
import { useThemeMode } from "../theme/AutoDarkThemeProvider";

export default function ResetPasswordPage() {
  const { mode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('restx-theme-mode');
      return stored === 'dark' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(mode === 'dark');
  }, [mode]);

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Please enter a password");
      return false;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }

    if (!/(?=.*\d)/.test(password)) {
      setPasswordError("Password must contain at least one number");
      return false;
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      setPasswordError("Password must contain at least one special character (!@#$%...)");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }

    setConfirmPasswordError("");
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordTouched) {
      validatePassword(value);
    }
    // Re-validate confirm password if it's already filled
    if (confirmPassword && confirmPasswordTouched) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordTouched) {
      validateConfirmPassword(value);
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) {
      setPasswordError("Please enter a password");
    } else {
      validatePassword(password);
    }
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordTouched(true);
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
    } else {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    // Check if fields are empty
    if (!password || !password.trim()) {
      setPasswordError("Please enter a password");
      if (!confirmPassword || !confirmPassword.trim()) {
        setConfirmPasswordError("Please confirm your password");
      }
      return;
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      return;
    }

    // Validate password
    const isPasswordValid = validatePassword(password);
    if (!isPasswordValid) {
      return;
    }

    // Validate confirm password
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    if (!isConfirmPasswordValid) {
      return;
    }

    // Don't proceed if there are any errors
    if (passwordError || confirmPasswordError) {
      return;
    }

    // Simulate loading for demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        `Password Reset Successfully!\n\nYour password has been updated.\n\n(This is UI demo only - No API integration)`
      );
      // Redirect to login page
      window.location.href = '/login';
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
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl" style={{ background: '#FF380B' }}>
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
              className="text-3xl font-bold mb-2 auth-title"
            >
              Reset Password
            </h2>
            <p className="auth-text">
              Enter your new password to secure your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 auth-label"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: passwordTouched && passwordError ? '#ef4444' : undefined,
                }}
              />
              {passwordTouched && passwordError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{passwordError}</p>
              )}
              {passwordTouched && !passwordError && password && (
                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>Password is strong</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 auth-label"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: confirmPasswordTouched && confirmPasswordError ? '#ef4444' : undefined,
                }}
              />
              {confirmPasswordTouched && confirmPasswordError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{confirmPasswordError}</p>
              )}
              {confirmPasswordTouched && !confirmPasswordError && confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: '#22c55e' }}>Passwords match</p>
              )}
            </div>

            <LoginButton loading={loading} text="RESET PASSWORD" />
          </form>
        </div>
      </div>
    </div>
  );
}
