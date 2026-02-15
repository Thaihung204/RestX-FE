"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, App, Typography, Card } from "antd";
import type { FormProps } from "antd";
import { tenantService } from "@/lib/services/tenantService";
import { TenantCreateInput } from "@/lib/types/tenant";
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
  const [form] = Form.useForm<TenantCreateInput>();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<TenantCreateInput>["onFinish"] = async (values) => {
    if (loading) return;

    setLoading(true);

    try {
      // Prepare hostname with .restx.food suffix
      const hostname = values.hostName
        ? `${values.hostName}.restx.food`
        : undefined;

      const requestData: TenantCreateInput = {
        ...values,
        hostName: hostname,
        networkIp: hostname,
        plan: "basic", // Default plan for requests
      };

      // Submit tenant request (will be created with status = false)
      await tenantService.submitTenantRequest(requestData);
      
      message.success("Request submitted successfully! Our team will review it shortly.");
      
      // Redirect to success page or home
      router.push("/");
    } catch (error: any) {
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
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <Title level={2}>Request a Restaurant Portal</Title>
          <Paragraph>
            Fill out the form below to request your own restaurant management portal.
            Our team will review your request and get back to you shortly.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="mt-8"
          >
            <Title level={4}>Restaurant Information</Title>

            <Form.Item
              label="Restaurant Name"
              name="name"
              rules={[
                { required: true, message: "Please enter restaurant name" },
              ]}
            >
              <Input placeholder="e.g., My Restaurant" />
            </Form.Item>

            <Form.Item
              label="Subdomain (URL)"
              name="hostName"
              rules={[
                { required: true, message: "Please enter subdomain" },
                { validator: validateSlug },
              ]}
              tooltip="This will be your portal URL: yourname.restx.food"
            >
              <Input
                placeholder="yourname"
                addonAfter=".restx.food"
              />
            </Form.Item>

            <Form.Item
              label="Business Name"
              name="businessName"
              rules={[
                { required: true, message: "Please enter business name" },
              ]}
            >
              <Input placeholder="Legal business name" />
            </Form.Item>

            <Title level={4} className="mt-6">Contact Information</Title>

            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[
                { required: true, message: "Please enter phone number" },
              ]}
            >
              <Input placeholder="+84 123 456 789" />
            </Form.Item>

            <Form.Item
              label="Restaurant Email"
              name="mailRestaurant"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="info@yourrestaurant.com" />
            </Form.Item>

            <Form.Item
              label="Owner Email"
              name="ownerEmail"
              rules={[
                { required: true, message: "Please enter owner email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="owner@email.com" />
            </Form.Item>

            <Form.Item
              label="Password (for your admin account)"
              name="ownerPassword"
              rules={[
                { required: true, message: "Please create a password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password placeholder="Minimum 8 characters" />
            </Form.Item>

            <Title level={4} className="mt-6">Address</Title>

            <Form.Item
              label="Address Line 1"
              name="addressLine1"
              rules={[
                { required: true, message: "Please enter address" },
              ]}
            >
              <Input placeholder="Street address" />
            </Form.Item>

            <Form.Item label="Address Line 2" name="addressLine2">
              <Input placeholder="District/Ward" />
            </Form.Item>

            <Form.Item label="Address Line 3" name="addressLine3">
              <Input placeholder="City" />
            </Form.Item>

            <Form.Item label="Address Line 4" name="addressLine4">
              <Input placeholder="Country" />
            </Form.Item>

            <Form.Item className="mt-8">
              <div className="flex gap-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  Submit Request
                </Button>
                <Button
                  size="large"
                  onClick={() => router.push("/")}
                >
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
