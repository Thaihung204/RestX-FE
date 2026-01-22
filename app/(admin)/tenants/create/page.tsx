"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import {
    ArrowLeftOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    ShopOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type { FormProps } from "antd";
import {
    Breadcrumb,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Select,
    Space,
    Typography,
    message,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface CreateTenantFormValues {
  name: string;
  hostName: string;
  businessName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  ownerEmail: string;
  ownerPassword: string;
  mailRestaurant: string;
  plan: "basic" | "pro" | "enterprise";
}

const CreateTenantPage: React.FC = () => {
  const router = useRouter();
  const [form] = Form.useForm<CreateTenantFormValues>();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<CreateTenantFormValues>["onFinish"] = async (
    values
  ) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success("Restaurant created successfully!");
      router.push("/tenants");
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/tenants");
  };

  // Slug validation: only lowercase letters, numbers, and hyphens
  const validateSlug = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject(new Error("Slug is required"));
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject(
        new Error("Slug can only contain lowercase letters, numbers, and hyphens")
      );
    }
    return Promise.resolve();
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      <main
        className="px-6 lg:px-8 py-8"
        style={{ background: "var(--bg-base)", color: "var(--text)" }}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* --- Header Section --- */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Breadcrumb
                items={[
                  { title: "Admin" },
                  { title: "Tenants" },
                  { title: "Create" },
                ]}
                className="text-xs font-medium mb-1"
              />
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "var(--text)",
                }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  Create New Restaurant
                </span>
              </Title>
              <Paragraph
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                }}
              >
                Add a new tenant (restaurant) to the RestX system.
              </Paragraph>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/tenants">
                <Button 
                  size="large" 
                  icon={<ArrowLeftOutlined />}
                  className="bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Back
                </Button>
              </Link>
            </div>
          </div>

          {/* --- Main Form --- */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              plan: "basic",
            }}
            requiredMark="optional" // Cleaner look
          >
            <Row gutter={[24, 24]}>
              {/* Left Column: Restaurant Info */}
              <Col xs={24} lg={14}>
                <Card
                  variant="borderless"
                  className="shadow-md h-full"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                  }}
                  title={
                    <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                      Restaurant Information
                    </Title>
                  }
                >
                  <Form.Item
                    label={<span style={{ color: "var(--text-muted)" }}>Name</span>}
                    name="name"
                    rules={[{ required: true, message: "Please enter name" }]}
                  >
                    <Input 
                      size="large" 
                      placeholder="e.g., ABC" 
                      prefix={<ShopOutlined className="text-gray-400 mr-1" />}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: "var(--text-muted)" }}>Host Name</span>}
                    name="hostName"
                    rules={[{ validator: validateSlug }]}
                    extra={
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Access URL: <Text code>hostname.restx.food</Text>
                      </span>
                    }
                  >
                    <Space.Compact className="w-full">
                      <Input
                        size="large"
                        disabled
                        value="https://"
                        className="w-24 text-center"
                        style={{
                            background: "var(--bg-base)",
                            color: "var(--text-muted)",
                            cursor: "default"
                        }}
                      />
                      <Input
                        size="large"
                        placeholder="my-restaurant"
                        prefix={<GlobalOutlined className="text-gray-400 mr-1" />}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-]/g, "");
                          form.setFieldValue("hostName", value);
                        }}
                      />
                      <Input
                        size="large"
                        disabled
                        value=".restx.food"
                        className="w-32 text-center"
                         style={{
                            background: "var(--bg-base)",
                            color: "var(--text-muted)",
                            cursor: "default"
                        }}
                      />
                    </Space.Compact>
                  </Form.Item>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label={<span style={{ color: "var(--text-muted)" }}>Business Name</span>}
                        name="businessName"
                        rules={[{ required: true, message: "Please enter business name" }]}
                    >
                        <Input 
                            size="large" 
                            placeholder="ABC Restaurant" 
                            prefix={<ShopOutlined className="text-gray-400 mr-1" />}
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label={<span style={{ color: "var(--text-muted)" }}>Phone Number</span>}
                        name="phoneNumber"
                        rules={[
                        { required: true, message: "Please enter phone number" },
                        { pattern: /^[0-9]{10,11}$/, message: "Invalid phone number" },
                        ]}
                    >
                        <Input 
                            size="large" 
                            placeholder="0912..." 
                            prefix={<PhoneOutlined className="text-gray-400 mr-1" />}
                        />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={<span style={{ color: "var(--text-muted)" }}>Mail Restaurant</span>}
                    name="mailRestaurant"
                    rules={[
                      { required: true, message: "Please enter restaurant email" },
                      { type: "email", message: "Invalid email" },
                    ]}
                  >
                    <Input 
                      size="large" 
                      type="email" 
                      placeholder="restaurant@example.com" 
                      prefix={<MailOutlined className="text-gray-400 mr-1" />}
                    />
                  </Form.Item>

                  <div className="space-y-3">
                    <label className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Restaurant Address
                    </label>
                    
                    <Form.Item
                      name="addressLine1"
                      rules={[{ required: true, message: "Please enter street number" }]}
                    >
                      <Input 
                        size="large" 
                        placeholder="Street number (e.g., 123)" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="addressLine2"
                      rules={[{ required: true, message: "Please enter street name" }]}
                    >
                      <Input 
                        size="large" 
                        placeholder="Street name (e.g., Nguyen Van Linh)" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="addressLine3"
                      rules={[{ required: true, message: "Please enter city" }]}
                    >
                      <Input 
                        size="large" 
                        placeholder="City (e.g., Da Nang)" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="addressLine4"
                      rules={[{ required: true, message: "Please enter country" }]}
                    >
                      <Input 
                        size="large" 
                        placeholder="Country (e.g., Vietnam)" 
                      />
                    </Form.Item>
                  </div>
                </Card>
              </Col>

              {/* Right Column: Owner & Plan */}
              <Col xs={24} lg={10}>
                <div className="flex flex-col gap-6 h-full">
                    {/* Owner Info Card */}
                    <Card
                    variant="borderless"
                    className="shadow-md"
                    style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                    }}
                    title={
                        <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                        Owner Information
                        </Title>
                    }
                    >
                    <Form.Item
                        label={<span style={{ color: "var(--text-muted)" }}>Owner Email</span>}
                        name="ownerEmail"
                        rules={[
                        { required: true, message: "Please enter email" },
                        { type: "email", message: "Invalid email" },
                        ]}
                    >
                        <Input 
                            size="large" 
                            type="email" 
                            placeholder="owner@example.com" 
                            prefix={<MailOutlined className="text-gray-400 mr-1" />}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: "var(--text-muted)" }}>Owner Password</span>}
                        name="ownerPassword"
                        rules={[
                        { required: true, message: "Please enter password" },
                        { min: 6, message: "Password must be at least 6 characters" },
                        ]}
                    >
                        <Input.Password 
                            size="large" 
                            placeholder="Enter password" 
                        />
                    </Form.Item>
                    </Card>

                    {/* Plan Selection Card */}
                    <Card
                    variant="borderless"
                    className="shadow-md flex-1"
                    style={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                    }}
                    title={
                        <Title level={5} style={{ margin: 0, color: "var(--text)" }}>
                        Subscription Plan
                        </Title>
                    }
                    >
                    <Form.Item
                        name="plan"
                        rules={[{ required: true, message: "Please select a plan" }]}
                    >
                        <Select size="large" placeholder="Select service plan">
                        <Select.Option value="basic">
                            <span className="font-medium text-emerald-500">Basic Plan</span> 
                            <span className="text-gray-400 text-xs ml-2">- Basic</span>
                        </Select.Option>
                        <Select.Option value="pro">
                            <span className="font-medium text-blue-500">Pro Plan</span>
                            <span className="text-gray-400 text-xs ml-2">- Popular</span>
                        </Select.Option>
                        <Select.Option value="enterprise">
                            <span className="font-medium text-purple-500">Enterprise</span>
                            <span className="text-gray-400 text-xs ml-2">- Full</span>
                        </Select.Option>
                        </Select>
                    </Form.Item>
                    
                    {/* Action Buttons inside the flow or fixed at bottom */}
                    <div className="pt-4 mt-auto border-t border-dashed border-gray-200 dark:border-gray-700">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            block
                            className="shadow-orange-900/20 shadow-lg border-none h-12 text-base font-medium"
                        >
                            Complete & Create
                        </Button>
                        <Button 
                            onClick={handleCancel} 
                            size="large" 
                            block 
                            type="text" 
                            className="mt-2 text-gray-500"
                        >
                            Cancel
                        </Button>
                    </div>
                    </Card>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default CreateTenantPage;