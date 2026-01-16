"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useState } from "react";

interface Staff {
  id: string;
  name: string;
  role: "Manager" | "Chef" | "Waiter" | "Cashier" | "Cleaner";
  email: string;
  phone: string;
  status: "active" | "off-duty" | "on-leave";
  shift: "Morning" | "Afternoon" | "Evening" | "Night";
  joinDate: string;
  rating: number;
}

export default function StaffPage() {
  const [staff] = useState<Staff[]>([
    {
      id: "1",
      name: "Michael Chen",
      role: "Manager",
      email: "michael.chen@restx.com",
      phone: "+1 234-567-8901",
      status: "active",
      shift: "Morning",
      joinDate: "Jan 2023",
      rating: 4.9,
    },
    {
      id: "2",
      name: "Emily Rodriguez",
      role: "Chef",
      email: "emily.r@restx.com",
      phone: "+1 234-567-8902",
      status: "active",
      shift: "Afternoon",
      joinDate: "Mar 2023",
      rating: 4.8,
    },
    {
      id: "3",
      name: "James Wilson",
      role: "Waiter",
      email: "james.w@restx.com",
      phone: "+1 234-567-8903",
      status: "active",
      shift: "Evening",
      joinDate: "Jun 2023",
      rating: 4.7,
    },
    {
      id: "4",
      name: "Sophia Taylor",
      role: "Waiter",
      email: "sophia.t@restx.com",
      phone: "+1 234-567-8904",
      status: "active",
      shift: "Morning",
      joinDate: "May 2023",
      rating: 4.6,
    },
    {
      id: "5",
      name: "David Kim",
      role: "Chef",
      email: "david.k@restx.com",
      phone: "+1 234-567-8905",
      status: "off-duty",
      shift: "Night",
      joinDate: "Feb 2023",
      rating: 4.8,
    },
    {
      id: "6",
      name: "Lisa Anderson",
      role: "Cashier",
      email: "lisa.a@restx.com",
      phone: "+1 234-567-8906",
      status: "active",
      shift: "Afternoon",
      joinDate: "Apr 2023",
      rating: 4.5,
    },
  ]);

  const roleConfig = {
    Manager: {
      color: "bg-purple-500",
      badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
    Chef: {
      color: "",
      badge: "",
      style: { backgroundColor: '#FF380B' },
      badgeStyle: { backgroundColor: 'rgba(255, 56, 11, 0.1)', color: '#FF380B', borderColor: 'rgba(255, 56, 11, 0.2)' },
    },
    Waiter: {
      color: "bg-blue-500",
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    Cashier: {
      color: "bg-green-500",
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    Cleaner: {
      color: "bg-gray-500",
      badge: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
  };

  const statusConfig = {
    active: {
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
      text: "Active",
    },
    "off-duty": {
      badge: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      text: "Off Duty",
    },
    "on-leave": {
      badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      text: "On Leave",
    },
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Staff Management
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Manage your restaurant team members
                </p>
              </div>
              <button
                className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                style={{ background: '#FF380B' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#CC2D08'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FF380B'}
                suppressHydrationWarning>
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Staff
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Total Staff
                    </p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                      {staff.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      On Duty
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      {staff.filter((s) => s.status === "active").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(255, 56, 11, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Departments
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: '#FF380B' }}>5</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 56, 11, 0.1)' }}>
                    <svg
                      className="w-6 h-6"
                      style={{ color: '#FF380B' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Avg Rating
                    </p>
                    <p className="text-3xl font-bold text-purple-500 mt-1">
                      4.7
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl overflow-hidden transition-all group"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid rgba(255, 56, 11, 0.3)',
                  }}>
                  <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: '#FF380B' }}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold transition-colors" style={{ color: 'var(--text)' }}>
                            {member.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                roleConfig[member.role].badge
                              }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          statusConfig[member.status].badge
                        }`}>
                        {statusConfig[member.status].text}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          Shift
                        </p>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>
                          {member.shift}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          Joined
                        </p>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>
                          {member.joinDate}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(member.rating)
                                ? "text-yellow-500"
                                : ""
                            }`}
                            style={
                              i >= Math.floor(member.rating)
                                ? { color: 'var(--text-muted)' }
                                : undefined
                            }
                            fill="currentColor"
                            viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {member.rating}/5.0
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg transition-all font-medium text-sm"
                        style={{ backgroundColor: 'rgba(255, 56, 11, 0.1)', color: '#FF380B' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FF380B'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 56, 11, 0.1)'; e.currentTarget.style.color = '#FF380B'; }}
                        suppressHydrationWarning>
                        View Profile
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: 'var(--surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                        suppressHydrationWarning>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
