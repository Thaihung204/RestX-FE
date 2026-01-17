"use client";

import LoginButton from "@/components/auth/LoginButton";
import React, { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

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
              Forgot Password
            </h2>
            <p className="auth-text">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 auth-label"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 rounded-lg outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 auth-input"
                style={{
                  borderColor: emailTouched && emailError ? '#ef4444' : undefined,
                }}
              />
              {emailTouched && emailError && (
                <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{emailError}</p>
              )}
            </div>

            <LoginButton loading={loading} text="SEND RESET LINK" />

            <div 
              className="text-center pt-4 border-t"
              style={{ 
                borderColor: 'var(--border)'
              }}
            >
              <a
                href="/login"
                className="text-sm font-semibold transition-colors inline-flex items-center"
                style={{ color: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF380B'}
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
