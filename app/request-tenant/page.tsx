"use client";

import { tenantService } from "@/lib/services/tenantService";
import { TenantRequestInput } from "@/lib/types/tenant";
import type { FormProps } from "antd";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

/**
 * Public page for users to submit tenant creation requests
 * No authentication required - open for anyone to submit
 */
const RequestTenantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantRequestInput>();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<TenantRequestInput>["onFinish"] = async (
    values,
  ) => {
    if (loading) return;

    setLoading(true);

    try {
      // Prepare hostname (without .restx.food suffix since backend may add it)
      const hostname = values.hostname || "";

      const requestData: TenantRequestInput = {
        name: values.name,
        hostname: hostname,
        businessName: values.businessName,
        businessPrimaryPhone: values.businessPrimaryPhone,
        businessEmailAddress: values.businessEmailAddress,
        businessAddressLine1: values.businessAddressLine1,
        businessAddressLine2: values.businessAddressLine2,
        businessAddressLine3: values.businessAddressLine3,
        businessAddressLine4: values.businessAddressLine4,
        businessCountry: values.businessCountry,
      };

      console.log("[RequestTenant] Submitting request:", requestData);

      // Submit tenant request using the new API
      const requestId = await tenantService.addTenantRequest(requestData);

      console.log(
        "[RequestTenant] Request created successfully, ID:",
        requestId,
      );

      message.success(
        "Request submitted successfully! Our team will review it shortly.",
      );

      // Redirect to success page or home
      router.push("/");
    } catch (error: any) {
      console.error("[RequestTenant] Failed to submit request:", error);
      console.error("[RequestTenant] Error response:", error?.response?.data);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit request. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateSlug = (_: unknown, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(
        new Error("Only lowercase letters, numbers, and hyphens are allowed"),
      );
    }
    return Promise.resolve();
  };

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}>
      <div className="max-w-3xl mx-auto">
        <Card>
          <Title level={2}>Request a Restaurant Portal</Title>
          <Paragraph>
            Fill out the form below to request your own restaurant management
            portal. Our team will review your request and get back to you
            shortly.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="mt-8">
            <Title level={4}>Restaurant Information</Title>

            <Form.Item
              label="Restaurant Name"
              name="name"
              rules={[
                { required: true, message: "Please enter restaurant name" },
              ]}>
              <Input placeholder="e.g., My Restaurant" />
            </Form.Item>

            <Form.Item
              label="Subdomain (URL)"
              name="hostname"
              rules={[
                { required: true, message: "Please enter subdomain" },
                { validator: validateSlug },
              ]}
              tooltip="This will be your portal hostname">
              <Input placeholder="myrestaurant" />
            </Form.Item>

            <Form.Item label="Business Name" name="businessName">
              <Input placeholder="Legal business name (optional)" />
            </Form.Item>

            <Title level={4} className="mt-6">
              Contact Information
            </Title>

            <Form.Item label="Business Phone" name="businessPrimaryPhone">
              <Input placeholder="+84 123 456 789 (optional)" />
            </Form.Item>

            <Form.Item
              label="Business Email"
              name="businessEmailAddress"
              rules={[
                { type: "email", message: "Please enter a valid email" },
              ]}>
              <Input placeholder="info@yourrestaurant.com (optional)" />
            </Form.Item>

            <Title level={4} className="mt-6">
              Address
            </Title>

            <Form.Item label="Address Line 1" name="businessAddressLine1">
              <Input placeholder="Street address (optional)" />
            </Form.Item>

            <Form.Item label="Address Line 2" name="businessAddressLine2">
              <Input placeholder="District/Ward (optional)" />
            </Form.Item>

            <Form.Item label="Address Line 3" name="businessAddressLine3">
              <Input placeholder="City (optional)" />
            </Form.Item>

            <Form.Item label="Address Line 4" name="businessAddressLine4">
              <Input placeholder="State/Province (optional)" />
            </Form.Item>

            <Form.Item label="Country" name="businessCountry">
              <Input placeholder="Country (optional)" />
            </Form.Item>

            <Form.Item className="mt-8">
              <div className="flex gap-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large">
                  Submit Request
                </Button>
                <Button size="large" onClick={() => router.push("/")}>
                  Cancel
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RequestTenantPage;
