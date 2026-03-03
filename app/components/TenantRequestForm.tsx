"use client";

import { tenantService } from "@/lib/services/tenantService";
import { TenantRequestInput } from "@/lib/types/tenant";
import {
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { App, Col, Form, Input, Modal, Row } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;

interface TenantRequestFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

export const TenantRequestForm: React.FC<TenantRequestFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<TenantRequestInput>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: TenantRequestInput) => {
    setLoading(true);

    try {
      console.log("[TenantRequestForm] Submitting request:", values);

      // Call real API
      const requestId = await tenantService.addTenantRequest(values);

      console.log(
        "[TenantRequestForm] Request created successfully, ID:",
        requestId,
      );

      message.success({
        content: t("tenant_requests.form.success_message"),
        duration: 5,
      });

      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error: any) {
      console.error("[TenantRequestForm] Failed to submit request:", error);
      console.error(
        "[TenantRequestForm] Error response:",
        error?.response?.data,
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("tenant_requests.form.error_message");
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const validateSlug = (_: unknown, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(
        new Error(t("tenant_requests.form.hostname_invalid")),
      );
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShopOutlined className="text-orange-500" />
          <span>
            {t("tenant_requests.form.title")}
          </span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText={t("tenant_requests.form.submit")}
      cancelText={t("tenant_requests.form.cancel")}
      confirmLoading={loading}
      width="90%"
      style={{ maxWidth: 700 }}
      styles={{
        body: {
          maxHeight: "75vh",
          overflowY: "auto",
          paddingTop: 16,
          paddingBottom: 16,
        },
      }}
      destroyOnHidden>
      <div className="py-2">
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("tenant_requests.form.description")}
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenant_requests.form.restaurant_name")}
                name="name"
                rules={[
                  { required: true, message: t("tenant_requests.form.restaurant_name_required") },
                  {
                    min: 3,
                    message: t("tenant_requests.form.restaurant_name_min"),
                  },
                ]}>
                <Input
                  prefix={<ShopOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder={t("tenant_requests.form.restaurant_name_placeholder")}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenant_requests.form.hostname")}
                name="hostname"
                rules={[
                  { required: true, message: t("tenant_requests.form.hostname_required") },
                  { validator: validateSlug },
                ]}
                tooltip={t("tenant_requests.form.hostname_tooltip")}
              >
                <Input
                  prefix={<GlobalOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder={t("tenant_requests.form.hostname_placeholder")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t("tenant_requests.form.business_name")} name="businessName">
            <Input
              prefix={<ShopOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder={t("tenant_requests.form.business_name_placeholder")}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("tenant_requests.form.business_email")}
                name="businessEmailAddress"
                rules={[
                  { type: "email", message: t("tenant_requests.form.business_email_invalid") },
                ]}>
                <Input
                  prefix={<MailOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder={t("tenant_requests.form.business_email_placeholder")}
                  type="email"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label={t("tenant_requests.form.phone_number")} name="businessPrimaryPhone">
                <Input
                  prefix={<PhoneOutlined style={{ color: "var(--text-muted)" }} />}
                  placeholder={t("tenant_requests.form.phone_number_placeholder")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t("tenant_requests.form.address_line_1")} name="businessAddressLine1">
            <Input
              prefix={<EnvironmentOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder={t("tenant_requests.form.address_line_1_placeholder")}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t("tenant_requests.form.address_line_2")} name="businessAddressLine2">
                <Input placeholder={t("tenant_requests.form.address_line_2_placeholder")}/>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label={t("tenant_requests.form.address_line_3")} name="businessAddressLine3">
                <Input placeholder={t("tenant_requests.form.address_line_3_placeholder")}/>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label={t("tenant_requests.form.country")} name="businessCountry">
                <Input placeholder={t("tenant_requests.form.country_placeholder")}/>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default TenantRequestForm;
