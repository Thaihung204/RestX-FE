'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Avatar,
  Tabs,
  Input,
  Divider,
  message,
  Radio,
  InputNumber,
  Result,
  Statistic,
  Flex,
} from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  WalletOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  TableOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  GiftOutlined,
  PercentageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

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

const paymentMethods = [
  { key: 'cash', label: 'Tiền mặt', icon: <WalletOutlined />, color: '#52c41a' },
  { key: 'card', label: 'Thẻ ngân hàng', icon: <CreditCardOutlined />, color: '#1890ff' },
  { key: 'transfer', label: 'Chuyển khoản', icon: <QrcodeOutlined />, color: '#722ed1' },
  { key: 'momo', label: 'MoMo', icon: <WalletOutlined />, color: '#d82d8b' },
];

export default function CheckoutPage() {
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
      message.error('Số tiền nhận chưa đủ');
      return;
    }

    setIsPaymentSuccess(true);
  };

  const handleCompletePayment = () => {
    if (selectedBill) {
      setBills(prev =>
        prev.map(b => (b.id === selectedBill.id ? { ...b, status: 'paid' as const } : b))
      );
      message.success('Thanh toán thành công!');
      setIsPaymentModalOpen(false);
      setIsPaymentSuccess(false);
      setSelectedBill(null);
      setCashReceived(0);
      setDiscountPercent(0);
    }
  };

  const renderBillCard = (bill: Bill) => (
    <motion.div
      key={bill.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isMobile ? { scale: 1.02 } : undefined}
    >
      <Card
        hoverable
        onClick={() => handleSelectBill(bill)}
        style={{
          borderRadius: isMobile ? 12 : 16,
          border: '2px solid var(--border)',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
        styles={{ body: { padding: isMobile ? 14 : 20 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 12 : 16 }}>
          <Avatar
            size={isMobile ? 44 : 56}
            style={{
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
              fontSize: isMobile ? 14 : 18,
              fontWeight: 700,
            }}
          >
            {bill.tableName}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: isMobile ? 15 : 18 }}>{bill.tableName}</Text>
            <br />
            <Space size={isMobile ? 8 : 16}>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13 }}>
                <UserOutlined /> {bill.guests} khách
              </Text>
              <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13 }}>
                <ClockCircleOutlined /> {bill.startTime}
              </Text>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: isMobile ? '8px 0' : '12px 0' }} />

        <div style={{ marginBottom: isMobile ? 8 : 12 }}>
          <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13 }}>
            {bill.items.length} món • {bill.items.reduce((sum, i) => sum + i.quantity, 0)} phần
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>Tổng thanh toán</Text>
            <br />
            <Text strong style={{ fontSize: isMobile ? 18 : 24, color: '#FF7A00' }}>
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
              fontWeight: 600,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none',
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {isMobile ? 'Thanh toán' : 'Thanh toán'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div>
      {/* Stats */}
      <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
              border: 'none',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 12 : 14 }}>Tổng tiền chờ thanh toán</Text>}
              value={totalPending}
              suffix="đ"
              styles={{ content: { color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 700 } }}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              border: '1px solid var(--border)',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Bàn chờ thanh toán</span>}
              value={bills.filter(b => b.status === 'pending').length}
              suffix="bàn"
              styles={{ content: { color: 'var(--text)', fontSize: isMobile ? 22 : 28, fontWeight: 700 } }}
              prefix={<TableOutlined style={{ color: '#FF7A00' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: isMobile ? 12 : 16,
              border: '1px solid var(--border)',
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>Đã thanh toán</span>}
              value={12}
              suffix="đơn"
              styles={{ content: { color: '#52c41a', fontSize: isMobile ? 22 : 28, fontWeight: 700 } }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card
        style={{
          borderRadius: isMobile ? 12 : 16,
          marginBottom: isMobile ? 16 : 24,
          border: '1px solid var(--border)',
        }}
        styles={{ body: { padding: isMobile ? 12 : '16px 24px' } }}
      >
        <Search
          placeholder={isMobile ? "Tìm bàn hoặc hóa đơn..." : "Tìm theo tên bàn hoặc mã hóa đơn..."}
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
          backgroundColor: '#0A0E14',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        styles={{
          header: { backgroundColor: '#0A0E14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
          body: { padding: isMobile ? 12 : 16, maxHeight: '60vh', overflowY: 'auto', backgroundColor: '#0A0E14' },
          mask: {
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            filter: 'none',
          },
        }}
      >
        {isPaymentSuccess ? (
          <Result
            status="success"
            title={<span style={{ fontSize: isMobile ? 18 : 24 }}>Thanh toán thành công!</span>}
            subTitle={
              <div>
                <Text style={{ fontSize: isMobile ? 13 : 14 }}>Hóa đơn: {selectedBill?.id}</Text>
                <br />
                <Text strong style={{ fontSize: isMobile ? 20 : 24, color: '#52c41a' }}>
                  {calculateFinalTotal().toLocaleString('vi-VN')}đ
                </Text>
                {paymentMethod === 'cash' && cashReceived > calculateFinalTotal() && (
                  <div style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: isMobile ? 13 : 14 }}>Tiền thừa: </Text>
                    <Text strong style={{ color: '#FF7A00', fontSize: isMobile ? 15 : 16 }}>
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
                {isMobile ? 'In' : 'In hóa đơn'}
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
                Hoàn tất
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
                    background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                    fontSize: isMobile ? 18 : 24,
                    fontWeight: 700,
                  }}
                >
                  {selectedBill.tableName}
                </Avatar>
                <Title level={isMobile ? 5 : 4} style={{ margin: '12px 0 4px' }}>
                  Thanh toán {selectedBill.tableName}
                </Title>
                <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>{selectedBill.id}</Text>
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
                    title={<span style={{ fontSize: isMobile ? 13 : 14 }}>Chi tiết hóa đơn</span>}
                    style={{ borderRadius: 12, width: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? 14 : 16 } }}
                  >
                    <div style={{ flex: 1 }}>
                      {selectedBill.items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: isMobile ? '8px 0' : '12px 0',
                            borderBottom: index < selectedBill.items.length - 1 ? '1px solid var(--border)' : 'none',
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
                      <GiftOutlined style={{ fontSize: isMobile ? 16 : 20, color: '#FF7A00' }} />
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>Giảm giá</Text>
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
                <Col xs={24} lg={10} style={{ display: 'flex', width: '100%' }}>
                  <Card
                    style={{
                      borderRadius: 12,
                      background: 'var(--card)',
                      width: '100%',
                    }}
                    styles={{ body: { padding: isMobile ? 14 : 24 } }}
                  >
                    {/* Summary */}
                    <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: isMobile ? 12 : 14 }}>Tạm tính</Text>
                        <Text style={{ fontSize: isMobile ? 12 : 14 }}>{selectedBill.subtotal.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#52c41a', fontSize: isMobile ? 12 : 14 }}>Giảm giá ({discountPercent}%)</Text>
                          <Text style={{ color: '#52c41a', fontSize: isMobile ? 12 : 14 }}>-{calculateDiscount().toLocaleString('vi-VN')}đ</Text>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: isMobile ? 12 : 14 }}>VAT (10%)</Text>
                        <Text style={{ fontSize: isMobile ? 12 : 14 }}>{selectedBill.tax.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      <Divider style={{ margin: isMobile ? '10px 0' : '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>Tổng cộng</Text>
                        <Text strong style={{ fontSize: isMobile ? 17 : 20, color: '#FF7A00' }}>
                          {calculateFinalTotal().toLocaleString('vi-VN')}đ
                        </Text>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                      <Text strong style={{ display: 'block', marginBottom: isMobile ? 8 : 12, fontSize: isMobile ? 13 : 14 }}>
                        Phương thức thanh toán
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
                          Tiền khách đưa
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
                              Tiền thừa: <strong>{(cashReceived - calculateFinalTotal()).toLocaleString('vi-VN')}đ</strong>
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
                          background: 'var(--card)',
                          borderRadius: 12,
                          marginBottom: isMobile ? 16 : 20,
                        }}
                      >
                        <div
                          style={{
                            width: isMobile ? 100 : 120,
                            height: isMobile ? 100 : 120,
                            background: 'var(--border)',
                            margin: '0 auto 12px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <QrcodeOutlined style={{ fontSize: isMobile ? 48 : 60, color: '#bbb' }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Quét mã QR để thanh toán</Text>
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
                        fontWeight: 600,
                        fontSize: isMobile ? 14 : 16,
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        border: 'none',
                      }}
                    >
                      Xác nhận thanh toán
                    </Button>
                  </Card>
                </Col>
              </Row>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}

