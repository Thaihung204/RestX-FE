"use client";

import React from "react";
import { Breadcrumb, Typography, Card } from "antd";
import { HomeOutlined, FileTextOutlined } from "@ant-design/icons";
import Link from "next/link";
import TenantRequestList from "@/components/(admin)/tenants/TenantRequestList";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

/**
 * Admin page to view and manage pending tenant requests
 * Path: /tenants/requests
 */
const TenantRequestsPage: React.FC = () => {
  const { t } = useTranslation();

  const handleRequestUpdated = () => {
    // This callback is called after approving or rejecting a request
    console.log("Request updated - list will refresh automatically");
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      {/* Header */}
      <div
        className="px-6 lg:px-8 py-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Breadcrumb
          className="mb-4"
          items={[
            {
              href: "/",
              title: (
                <>
                  <HomeOutlined />
                  <span>Home</span>
                </>
              ),
            },
            {
              href: "/tenants",
              title: "Tenants",
            },
            {
              title: "Requests",
            },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="!mb-2">
              Tenant Requests
            </Title>
            <Paragraph className="!mb-0 opacity-70">
              Review and approve new restaurant registration requests
            </Paragraph>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-8">
        <TenantRequestList onRequestUpdated={handleRequestUpdated} />
      </main>
    </div>
  );
};

export default TenantRequestsPage;
