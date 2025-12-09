"use client";

import LoginButton from "@/components/auth/LoginButton";
import LoginHeader from "@/components/auth/LoginHeader";
import RememberCheckbox from "@/components/auth/RememberCheckbox";
import React, { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-orange-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl opacity-10"></div>

      <div className="max-w-[420px] w-full space-y-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-orange-100">
          <LoginHeader />

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="0123456789"
                maxLength={10}
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all
                         text-gray-900 placeholder-gray-400
                         ${
                           phoneTouched && phoneError
                             ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                             : "border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                         }
                         disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                suppressHydrationWarning
              />
              {phoneTouched && phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all
                         text-gray-900 placeholder-gray-400
                         ${
                           nameTouched && nameError
                             ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                             : "border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                         }
                         disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                suppressHydrationWarning
              />
              {nameTouched && nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <RememberCheckbox checked={remember} onChange={setRemember} />
            <LoginButton loading={loading} text="LOGIN" />

            <div className="text-center text-sm text-gray-600 mt-6">
              By continuing, you agree to RestX&apos;s{" "}
              <a
                href="/terms"
                className="text-orange-600 hover:text-orange-700 font-medium">
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-orange-600 hover:text-orange-700 font-medium">
                Privacy Policy
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
