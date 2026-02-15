'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, App, Row, Col } from 'antd';
import {
  ShopOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ITenantRequest } from '@/lib/types/tenant';

const { TextArea } = Input;

interface TenantRequestFormData {
  businessName: string;
  contactPersonName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  requestedPlan: 'basic' | 'pro' | 'enterprise';
  notes?: string;
}

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
  const [form] = Form.useForm<TenantRequestFormData>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: TenantRequestFormData) => {
    setLoading(true);
    
    // Simulate API call - sẽ thay thế bằng real API
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Tenant Request Submitted:', values);
      
      message.success({
        content: t('tenant_requests.form.success_message'),
        duration: 5,
      });
      
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(t('tenant_requests.form.error_message'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShopOutlined className="text-orange-500" />
          <span>{t('tenant_requests.form.title')}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText={t('tenant_requests.form.submit')}
      cancelText={t('tenant_requests.form.cancel')}
      confirmLoading={loading}
      width="90%"
      style={{ maxWidth: 700 }}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingTop: 16, paddingBottom: 16 } }}
      destroyOnClose
    >
      <div className="py-2">
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Fill in your restaurant information and our team will contact you to set up your account.
        </p>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ requestedPlan: 'basic' }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('tenant_requests.form.business_name')}
                name="businessName"
                rules={[
                  { required: true, message: t('tenant_requests.form.business_name_required') },
                  { min: 3, message: t('tenant_requests.form.business_name_required') },
                ]}
              >
                <Input
                  prefix={<ShopOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('tenant_requests.form.business_name_placeholder')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t('tenant_requests.form.contact_person')}
                name="contactPersonName"
                rules={[
                  { required: true, message: t('tenant_requests.form.contact_person_required') },
                  { min: 2, message: t('tenant_requests.form.contact_person_required') },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('tenant_requests.form.contact_person_placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('tenant_requests.form.business_email')}
                name="businessEmail"
                rules={[
                  { required: true, message: t('tenant_requests.form.business_email_required') },
                  { type: 'email', message: t('tenant_requests.form.business_email_invalid') },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('tenant_requests.form.business_email_placeholder')}
                  type="email"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t('tenant_requests.form.phone_number')}
                name="businessPhone"
                rules={[
                  { required: true, message: t('tenant_requests.form.phone_number_required') },
                  { 
                    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                    message: t('tenant_requests.form.phone_number_required') 
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('tenant_requests.form.phone_number_placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('tenant_requests.form.business_address')}
            name="businessAddress"
            rules={[
              { required: true, message: t('tenant_requests.form.business_address_required') },
              { min: 10, message: t('tenant_requests.form.business_address_required') },
            ]}
          >
            <Input
              prefix={<EnvironmentOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder={t('tenant_requests.form.business_address_placeholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('tenant_requests.form.select_plan')}
            name="requestedPlan"
            rules={[{ required: true, message: t('tenant_requests.form.select_plan_required') }]}
          >
            <Select placeholder={t('tenant_requests.form.select_plan_placeholder')}>
              <Select.Option value="basic">
                <div className="py-1">
                  <div className="font-medium">{t('tenant_requests.form.plan_basic')}</div>
                  <div className="text-xs text-gray-500">{t('tenant_requests.form.plan_basic_desc')}</div>
                </div>
              </Select.Option>
              <Select.Option value="pro">
                <div className="py-1">
                  <div className="font-medium">{t('tenant_requests.form.plan_professional')}</div>
                  <div className="text-xs text-gray-500">{t('tenant_requests.form.plan_professional_desc')}</div>
                </div>
              </Select.Option>
              <Select.Option value="enterprise">
                <div className="py-1">
                  <div className="font-medium">{t('tenant_requests.form.plan_enterprise')}</div>
                  <div className="text-xs text-gray-500">{t('tenant_requests.form.plan_enterprise_desc')}</div>
                </div>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t('tenant_requests.form.additional_notes')}
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder={t('tenant_requests.form.additional_notes_placeholder')}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default TenantRequestForm;
