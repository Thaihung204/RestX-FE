"use client";

import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
              <p className="text-orange-100">Detailed insights and performance metrics</p>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Analytics Page</h3>
              <p className="text-gray-400 mb-4">Advanced analytics features coming soon</p>
              <div className="inline-flex items-center gap-2 text-orange-500 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                Under Development
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
