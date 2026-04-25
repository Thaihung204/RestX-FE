"use client";

import VnAddressSelect from "@/components/ui/VnAddressSelect";
import VnStreetAutocomplete from "@/components/ui/VnStreetAutocomplete";
import { tenantService } from "@/lib/services/tenantService";
import { TenantRequestInput } from "@/lib/types/tenant";
import type { FormProps } from "antd";
import { App, Button, Card, Form, Input, Typography, Checkbox } from "antd";
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
  const [hostNameValue, setHostNameValue] = useState("");
  const [isCustomDomain, setIsCustomDomain] = useState(false);
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
        isCustomDomain: isCustomDomain,
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

    const regex = isCustomDomain ? /^[a-z0-9-\.]+$/ : /^[a-z0-9-]+$/;

    if (!regex.test(value)) {
      return Promise.reject(
        new Error(isCustomDomain ? "Only lowercase letters, numbers, hyphens, and dots are allowed" : "Only lowercase letters, numbers, and hyphens are allowed"),
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
              <Input />
            </Form.Item>

            <Form.Item
              label="Hostname"
              name="hostname"
              rules={[
                { required: true, message: "Please enter hostname" },
                { validator: validateSlug },
              ]}
              tooltip="This will be your portal hostname"
              extra={
                <div className="flex flex-col gap-2 mt-2">
                  <Checkbox
                    checked={isCustomDomain}
                    onChange={(e) => {
                      setIsCustomDomain(e.target.checked);
                      form.validateFields(['hostname']);
                    }}
                  >
                    Use custom domain
                  </Checkbox>
                  {!isCustomDomain && (
                    <span className="text-sm text-gray-500">
                      Access URL: hostname.restx.food
                    </span>
                  )}
                </div>
              }>
              {isCustomDomain ? (
                <Input
                  value={hostNameValue}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-\.]/g, "");
                    form.setFieldValue("hostname", value);
                    setHostNameValue(value);
                  }}
                  size="large"
                />
              ) : (
                <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden" style={{ background: "var(--surface)" }}>
                  <span className="px-3 bg-gray-100 text-gray-500 border-r border-gray-300 dark:bg-zinc-800 dark:border-zinc-700">https://</span>
                  <Input
                    value={hostNameValue}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      form.setFieldValue("hostname", value);
                      setHostNameValue(value);
                    }}
                    bordered={false}
                    className="flex-1 rounded-none px-3 py-2"
                  />
                  <span className="px-3 bg-gray-100 text-gray-500 border-l border-gray-300 dark:bg-zinc-800 dark:border-zinc-700">.restx.food</span>
                </div>
              )}
            </Form.Item>

            <Form.Item label="Business Name" name="businessName">
              <Input />
            </Form.Item>

            <Title level={4} className="mt-6">
              Contact Information
            </Title>

            <Form.Item label="Business Phone" name="businessPrimaryPhone">
              <Input />
            </Form.Item>

            <Form.Item
              label="Business Email"
              name="businessEmailAddress"
              rules={[
                { type: "email", message: "Please enter a valid email" },
              ]}>
              <Input />
            </Form.Item>

            <Title level={4} className="mt-6">
              Address
            </Title>

            <Form.Item label="Address Line 1" name="businessAddressLine1">
              <VnStreetAutocomplete
                form={form}
                fieldName="businessAddressLine1"
                cityFieldName="businessAddressLine3"
                districtWardFieldName="businessAddressLine2"
              />
            </Form.Item>

            <VnAddressSelect
              form={form}
              cityFieldName="businessAddressLine3"
              districtWardFieldName="businessAddressLine2"
              stateProvinceFieldName="businessAddressLine4"
              countryFieldName="businessCountry"
              required
              cityRequiredMessage={t("request_tenant.city_required", { defaultValue: "Vui lòng chọn tỉnh/thành phố" })}
              districtRequiredMessage={t("request_tenant.district_required", { defaultValue: "Vui lòng chọn quận/huyện" })}
              wardRequiredMessage={t("request_tenant.ward_required", { defaultValue: "Vui lòng chọn phường/xã" })}
            />

            <Form.Item label="Address Line 4" name="businessAddressLine4" initialValue="Việt Nam">
              <Input />
            </Form.Item>

            <Form.Item label="Country" name="businessCountry" initialValue="Việt Nam">
              <Input />
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
