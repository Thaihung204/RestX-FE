'use client';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  GiftOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  SearchOutlined,
  TableOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Result,
  Row,
  Space,
  Statistic,
  Tag,
  Typography
} from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../components/I18nProvider';
import { useThemeMode } from '../../theme/AntdProvider';

const { Title, Text } = Typography;
const { Search } = Input;

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Bill {
  id: string;
  tableId: string;
  tableName: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  guests: number;
  startTime: string;
  status: 'pending' | 'paid';
}

// Mock bills data
const initialBills: Bill[] = [
  {
    id: 'BILL001',
    tableId: 'a2',
    tableName: 'A02',
    guests: 3,
    startTime: '18:30',
    status: 'pending',
    items: [
      { id: 'i1', name: 'Bò lúc lắc', quantity: 2, price: 185000 },
      { id: 'i2', name: 'Gỏi cuốn tôm thịt', quantity: 1, price: 65000 },
      { id: 'i3', name: 'Cơm chiên hải sản', quantity: 2, price: 125000 },
      { id: 'i4', name: 'Nước ép cam', quantity: 3, price: 45000 },
    ],
    subtotal: 750000,
    discount: 0,
    tax: 75000,
    total: 825000,
  },
  {
    id: 'BILL002',
    tableId: 'a3',
    tableName: 'A03',
    guests: 2,
    startTime: '19:00',
    status: 'pending',
    items: [
      { id: 'i5', name: 'Cá hồi sốt chanh dây', quantity: 1, price: 245000 },
      { id: 'i6', name: 'Súp cua', quantity: 2, price: 55000 },
      { id: 'i7', name: 'Sinh tố bơ', quantity: 2, price: 55000 },
    ],
    subtotal: 420000,
    discount: 0,
    tax: 42000,
    total: 462000,
  },
  {
    id: 'BILL003',
    tableId: 'b1',
    tableName: 'B01',
    guests: 4,
    startTime: '18:00',
    status: 'pending',
    items: [
      { id: 'i8', name: 'Tôm hùm nướng bơ', quantity: 1, price: 650000 },
      { id: 'i9', name: 'Bò lúc lắc', quantity: 2, price: 185000 },
      { id: 'i10', name: 'Chả giò hải sản', quantity: 2, price: 85000 },
      { id: 'i11', name: 'Bia Tiger', quantity: 4, price: 35000 },
    ],
    subtotal: 1250000,
    discount: 125000,
    tax: 112500,
    total: 1237500,
  },
  {
    id: 'BILL004',
    tableId: 'v1',
    tableName: 'VIP01',
    guests: 6,
    startTime: '18:45',
    status: 'pending',
    items: [
      { id: 'i12', name: 'Tôm hùm nướng bơ', quantity: 2, price: 650000 },
      { id: 'i13', name: 'Cá hồi sốt chanh dây', quantity: 2, price: 245000 },
      { id: 'i14', name: 'Bò lúc lắc', quantity: 3, price: 185000 },
      { id: 'i15', name: 'Gỏi cuốn tôm thịt', quantity: 2, price: 65000 },
      { id: 'i16', name: 'Bia Tiger', quantity: 10, price: 35000 },
    ],
    subtotal: 3500000,
    discount: 350000,
    tax: 315000,
    total: 3465000,
  },
];

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'momo';

export default function CheckoutPage() {
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [messageApi, contextHolder] = message.useMessage();
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false); // for widths like iPad mini/air

  // Check mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const paymentMethods = [
    { key: 'cash', label: t('staff.checkout.methods.cash'), icon: <WalletOutlined />, color: '#52c41a' },
    { key: 'transfer', label: t('staff.checkout.methods.transfer'), icon: <CreditCardOutlined />, color: '#1890ff' },
    { key: 'momo', label: t('staff.checkout.methods.momo'), icon: <QrcodeOutlined />, color: '#cf1322' },
  ];

  const filteredBills = bills.filter(
    bill =>
      bill.status === 'pending' &&
      (bill.tableName.toLowerCase().includes(searchText.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchText.toLowerCase()))
  );

  const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.total, 0);

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill);
    setDiscountPercent(0);
    setCashReceived(0);
    setIsPaymentModalOpen(true);
  };

  const calculateDiscount = () => {
    if (!selectedBill) return 0;
    return (selectedBill.subtotal * discountPercent) / 100;
  };

  const calculateFinalTotal = () => {
    if (!selectedBill) return 0;
    const discount = calculateDiscount();
    return selectedBill.subtotal - discount + selectedBill.tax;
  };

  const handlePayment = () => {
    if (paymentMethod === 'cash' && cashReceived < calculateFinalTotal()) {
      messageApi.error(t('staff.checkout.messages.insufficient_cash'));
      return;
    }

    setIsPaymentSuccess(true);
  };

  const handleCompletePayment = () => {
    if (selectedBill) {
      setBills(prev =>
        prev.map(b => (b.id === selectedBill.id ? { ...b, status: 'paid' as const } : b))
      );
      messageApi.success(t('staff.checkout.messages.payment_success'));
      setIsPaymentModalOpen(false);
      setIsPaymentSuccess(false);
      setSelectedBill(null);
      setCashReceived(0);
      setDiscountPercent(0);
    }
  };

  const renderBillCard = (bill: Bill) => (
    <div>
      <Card
        hoverable
        onClick={() => handleSelectBill(bill)}
        style={{
          borderRadius: 12,
          border: '2px solid var(--border)',
          cursor: 'pointer',
          transition: 'all 0.3s',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: isMobile ? 14 : 20 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 12 : 16 }}>
          <Avatar
            size={isMobile ? 44 : 56}
            style={{
              background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
              fontSize: isMobile ? 14 : 18,
              fontWeight: 500,
            }}
          >
            {bill.tableName}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: isMobile ? 15 : 18 }}>{bill.tableName}</Text>
            <br />
            <Space size={isMobile ? 8 : 16}>
              <Text style={{ fontSize: isMobile ? 13 : 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>
                <UserOutlined /> {bill.guests} {t('staff.checkout.bill.guests')}
              </Text>
              <Text style={{ fontSize: isMobile ? 13 : 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>
                <ClockCircleOutlined /> {bill.startTime}
              </Text>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />

        <div style={{ marginBottom: isMobile ? 8 : 12 }}>
          <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13 }}>
            {bill.items.length} {t('staff.checkout.bill.dishes')} • {bill.items.reduce((sum, i) => sum + i.quantity, 0)} {t('staff.checkout.bill.portions')}
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text style={{ fontSize: isMobile ? 13 : 14, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>{t('staff.checkout.bill.total_payment')}</Text>
            <br />
            <Text strong style={{ fontSize: isMobile ? 18 : 24, color: '#FF380B' }}>
              {bill.total.toLocaleString('vi-VN')}đ
            </Text>
          </div>
          <Button
            type="primary"
            size={isMobile ? 'middle' : 'large'}
            icon={<DollarOutlined />}
            style={{
              borderRadius: 12,
              height: isMobile ? 40 : 48,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none',
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {t('staff.checkout.bill.pay')}
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      {contextHolder}
      {/* Stats */}
      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={24} md={12} lg={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
              border: 'none',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 12 : 14 }}>{t('staff.checkout.stats.total_pending')}</Text>}
              value={totalPending}
              suffix="đ"
              styles={{ content: { color: '#fff', fontSize: isMobile ? 24 : 32, fontWeight: 500 } }}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.checkout.stats.pending_tables')}</span>}
              value={bills.filter(b => b.status === 'pending').length}
              suffix={t('staff.checkout.stats.tables')}
              styles={{ content: { color: 'var(--text)', fontSize: isMobile ? 24 : 32, fontWeight: 500 } }}
              prefix={<TableOutlined style={{ color: '#FF380B' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 13 : 15 }}>{t('staff.checkout.stats.paid')}</span>}
              value={12}
              suffix={t('staff.checkout.stats.orders')}
              styles={{ content: { color: '#52c41a', fontSize: isMobile ? 24 : 32, fontWeight: 500 } }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: isMobile ? 16 : 24,
          border: '1px solid var(--border)',
        }}
        styles={{ body: { padding: isMobile ? 12 : '16px 24px' } }}
      >
        <Search
          placeholder={isMobile ? t('staff.checkout.search.placeholder') : t('staff.checkout.search.placeholder_full')}
          allowClear
          size={isMobile ? 'middle' : 'large'}
          style={{ width: '100%', maxWidth: isMobile ? '100%' : 400 }}
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Card>

      {/* Bills List */}
      <Row gutter={[24, 24]}>
        {filteredBills.map(bill => (
          <Col xs={24} md={12} lg={8} key={bill.id}>
            {renderBillCard(bill)}
          </Col>
        ))}
      </Row>

      {/* Payment Modal */}
      <Modal
        title={null}
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          setIsPaymentSuccess(false);
          setSelectedBill(null);
          setCashReceived(0);
          setDiscountPercent(0);
        }}
        footer={null}
        width={
          isMobile
            ? '100%'
            : isTablet
              ? '94%'
              : 820
        }
        centered
        style={{
          maxWidth: isMobile ? '100%' : isTablet ? '94vw' : '820px',
          backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          border: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
          borderRadius: 12,
        }}
        styles={{
          header: {
            backgroundColor: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 122, 0, 0.2)' : '1px solid #E5E7EB',
            borderRadius: '12px 12px 0 0',
            padding: '16px 24px',
            paddingRight: '56px',
          },
          footer: {
            borderRadius: '0 0 12px 12px',
          },
          body: {
            padding: isMobile ? 12 : 16,
            maxHeight: '60vh',
            overflowY: 'auto',
            backgroundColor: mode === 'dark' ? '#0A0E14' : '#FFFFFF',
          },
          mask: {
            background: mode === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            filter: 'none',
          },
        }}
      >
        {isPaymentSuccess ? (
          <Result
            status="success"
            title={<span style={{ fontSize: isMobile ? 18 : 24 }}>{t('staff.checkout.payment.success')}</span>}
            subTitle={
              <div>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>{t('staff.checkout.payment.bill')}: {selectedBill?.id}</Text>
                <br />
                <Text strong style={{ fontSize: isMobile ? 20 : 24, color: '#52c41a' }}>
                  {calculateFinalTotal().toLocaleString('vi-VN')}đ
                </Text>
                {paymentMethod === 'cash' && cashReceived > calculateFinalTotal() && (
                  <div style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: isMobile ? 13 : 14 }}>{t('staff.checkout.payment.change')}: </Text>
                    <Text strong style={{ color: '#FF380B', fontSize: isMobile ? 15 : 16 }}>
                      {(cashReceived - calculateFinalTotal()).toLocaleString('vi-VN')}đ
                    </Text>
                  </div>
                )}
              </div>
            }
            extra={[
              <Button
                key="print"
                icon={<PrinterOutlined />}
                size={isMobile ? 'middle' : 'large'}
                style={{ borderRadius: 12 }}
              >
                {isMobile ? t('staff.orders.modal.print_short') : t('staff.orders.modal.print')}
              </Button>,
              <Button
                key="done"
                type="primary"
                size={isMobile ? 'middle' : 'large'}
                onClick={handleCompletePayment}
                style={{
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none',
                }}
              >
                {t('staff.checkout.payment.complete')}
              </Button>,
            ]}
          />
        ) : (
          selectedBill && (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: isMobile ? 16 : 24 }}>
                <Avatar
                  size={isMobile ? 52 : 64}
                  style={{
                    background: 'linear-gradient(135deg, #FF380B 0%, #FF380B 100%)',
                    fontSize: isMobile ? 18 : 24,
                    fontWeight: 500,
                  }}
                >
                  {selectedBill.tableName}
                </Avatar>
                <Title level={isMobile ? 5 : 4} style={{ margin: '12px 0 4px' }}>
                  {t('staff.checkout.payment.title')} {selectedBill.tableName}
                </Title>
                <Text style={{ fontSize: isMobile ? 13 : 15, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', fontWeight: 400 }}>{selectedBill.id}</Text>
              </div>

              <Row
                gutter={[isMobile ? 0 : 12, 10]}
                style={{
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'stretch',
                  flexDirection: isMobile ? 'column' : 'row',
                  width: '100%',
                }}
              >
                {/* Bill Details */}
                <Col xs={24} lg={14} style={{ display: 'flex', width: '100%' }}>
                  <Card
                    size="small"
                    title={<span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>{t('staff.checkout.payment.bill_detail')}</span>}
                    style={{
                      borderRadius: 16,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: mode === 'dark' ? 'var(--card)' : '#FFFFFF',
                      border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB',
                      overflow: 'hidden',
                      boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    }}
                    styles={{
                      body: { flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 18px' : '20px 24px' },
                      header: { padding: isMobile ? '14px 18px' : '16px 24px', borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5E7EB' }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {selectedBill.items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: isMobile ? '10px 0' : '14px 0',
                            borderBottom: index < selectedBill.items.length - 1
                              ? mode === 'dark'
                                ? '1px solid rgba(255, 255, 255, 0.08)'
                                : '1px solid #F0F0F0'
                              : 'none',
                          }}
                        >
                          <Text style={{ fontSize: isMobile ? 12 : 14 }}>
                            {item.name} <Tag style={{ fontSize: isMobile ? 10 : 12 }}>{item.quantity}x</Tag>
                          </Text>
                          <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                        </div>
                      ))}
                    </div>

                    {/* Discount - moved inside the card */}
                    <Divider style={{ margin: isMobile ? '12px 0' : '16px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
                      <GiftOutlined style={{ fontSize: isMobile ? 16 : 20, color: '#FF380B' }} />
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{t('staff.checkout.payment.discount')}</Text>
                      <InputNumber
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(value) => setDiscountPercent(value || 0)}
                        formatter={(value) => `${value}%`}
                        parser={(value) => Number(value?.replace('%', '') || 0)}
                        size={isMobile ? 'small' : 'middle'}
                        style={{ width: isMobile ? 80 : 100, marginLeft: 'auto' }}
                      />
                    </div>
                  </Card>
                </Col>

                {/* Payment */}
                <Col xs={24} md={24} lg={10} style={{ display: 'flex', width: '100%' }}>
                  <Card
                    style={{
                      borderRadius: 12,
                      background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      width: '100%',
                      border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E5E7EB',
                      overflow: 'hidden',
                      boxShadow: mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }}
                    styles={{ body: { padding: isMobile ? '18px 20px' : '24px 28px' } }}
                  >
                    {/* Summary */}
                    <div style={{ marginBottom: isMobile ? 18 : 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F0F0F0' }}>
                        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{t('staff.checkout.payment.subtotal')}</Text>
                        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{selectedBill.subtotal.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F0F0F0' }}>
                          <Text style={{ color: '#52c41a', fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{t('staff.checkout.payment.discount_amount', { percent: discountPercent })}</Text>
                          <Text style={{ color: '#52c41a', fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>-{calculateDiscount().toLocaleString('vi-VN')}đ</Text>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F0F0F0' }}>
                        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>VAT (10%)</Text>
                        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{selectedBill.tax.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: mode === 'dark' ? '2px solid rgba(255, 255, 255, 0.12)' : '2px solid #E5E7EB',
                      }}>
                        <Text strong style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600 }}>{t('staff.checkout.payment.total')}</Text>
                        <Text strong style={{ fontSize: isMobile ? 20 : 24, color: '#FF380B', fontWeight: 500 }}>
                          {calculateFinalTotal().toLocaleString('vi-VN')}đ
                        </Text>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div style={{ marginBottom: isMobile ? 18 : 24 }}>
                      <Text strong style={{ display: 'block', marginBottom: isMobile ? 12 : 16, fontSize: isMobile ? 14 : 15, fontWeight: 600 }}>
                        {t('staff.checkout.payment.payment_method')}
                      </Text>
                      <Radio.Group
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <Flex vertical gap={isMobile ? 6 : 8} style={{ width: '100%' }}>
                          {paymentMethods.map((method) => (
                            <Radio.Button
                              key={method.key}
                              value={method.key}
                              style={{
                                width: '100%',
                                height: isMobile ? 38 : 44,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                textAlign: 'left',
                                fontSize: isMobile ? 12 : 14,
                              }}
                            >
                              <Space size={isMobile ? 6 : 8}>
                                <span style={{ color: method.color }}>{method.icon}</span>
                                {method.label}
                              </Space>
                            </Radio.Button>
                          ))}
                        </Flex>
                      </Radio.Group>
                    </div>

                    {/* Cash Input */}
                    {paymentMethod === 'cash' && (
                      <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: isMobile ? 13 : 14 }}>
                          {t('staff.checkout.payment.cash_received')}
                        </Text>
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            size={isMobile ? 'middle' : 'large'}
                            value={cashReceived}
                            onChange={(value) => setCashReceived(value || 0)}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                            style={{ width: '100%', borderRadius: '10px 0 0 10px' }}
                          />
                          <Button size={isMobile ? 'middle' : 'large'} style={{ borderRadius: '0 10px 10px 0' }}>đ</Button>
                        </Space.Compact>
                        {cashReceived >= calculateFinalTotal() && cashReceived > 0 && (
                          <div style={{ marginTop: 8, padding: isMobile ? '6px 10px' : '8px 12px', background: '#f6ffed', borderRadius: 8 }}>
                            <Text style={{ color: '#52c41a', fontSize: isMobile ? 12 : 14 }}>
                              {t('staff.checkout.payment.change')}: <strong>{(cashReceived - calculateFinalTotal()).toLocaleString('vi-VN')}đ</strong>
                            </Text>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QR Code for transfer/momo */}
                    {(paymentMethod === 'transfer' || paymentMethod === 'momo') && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: isMobile ? 12 : 20,
                          background: mode === 'dark' ? 'var(--card)' : '#F7F8FA',
                          borderRadius: 12,
                          marginBottom: isMobile ? 16 : 20,
                          border: mode === 'dark' ? 'none' : '1px solid #E5E7EB',
                        }}
                      >
                        <div
                          style={{
                            width: isMobile ? 100 : 120,
                            height: isMobile ? 100 : 120,
                            background: mode === 'dark' ? 'var(--border)' : '#E5E7EB',
                            margin: '0 auto 12px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <QrcodeOutlined style={{ fontSize: isMobile ? 48 : 60, color: '#bbb' }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>{t('staff.checkout.payment.scan_qr')}</Text>
                      </div>
                    )}

                    {/* Pay Button */}
                    <Button
                      type="primary"
                      size={isMobile ? 'middle' : 'large'}
                      block
                      icon={<CheckCircleOutlined />}
                      onClick={handlePayment}
                      style={{
                        height: isMobile ? 44 : 52,
                        borderRadius: 12,
                        fontWeight: 500,
                        fontSize: isMobile ? 14 : 16,
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        border: 'none',
                      }}
                    >
                      {t('staff.checkout.payment.confirm')}
                    </Button>
                  </Card>
                </Col>
              </Row>
            </div>
          )
        )}
      </Modal>

      <style jsx global>{`
        /* Modal border radius */
        .ant-modal-content {
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        
        /* Modal close button positioning - inside header */
        .ant-modal-close {
          top: 16px !important;
          right: 20px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'} !important;
          transition: all 0.2s ease !important;
        }
        .ant-modal-close:hover {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'} !important;
        }
        .ant-modal-close-x {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.65)'} !important;
        }
        .ant-modal-close:hover .ant-modal-close-x {
          color: ${mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.85)'} !important;
        }
      `}</style>
    </div>
  );
}

