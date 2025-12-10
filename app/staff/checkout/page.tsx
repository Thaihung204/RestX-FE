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
  List,
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
      whileHover={{ scale: 1.02 }}
    >
      <Card
        hoverable
        onClick={() => handleSelectBill(bill)}
        style={{
          borderRadius: 16,
          border: '2px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar
            size={56}
            style={{
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {bill.tableName}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 18 }}>{bill.tableName}</Text>
            <br />
            <Space size={16}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <UserOutlined /> {bill.guests} khách
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <ClockCircleOutlined /> Từ {bill.startTime}
              </Text>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {bill.items.length} món • {bill.items.reduce((sum, i) => sum + i.quantity, 0)} phần
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Tổng thanh toán</Text>
            <br />
            <Text strong style={{ fontSize: 24, color: '#FF7A00' }}>
              {bill.total.toLocaleString('vi-VN')}đ
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<DollarOutlined />}
            style={{
              borderRadius: 12,
              height: 48,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none',
            }}
          >
            Thanh toán
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div>
      {/* Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
              border: 'none',
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng tiền chờ thanh toán</Text>}
              value={totalPending}
              suffix="đ"
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
              formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 16,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title="Số bàn chờ thanh toán"
              value={bills.filter(b => b.status === 'pending').length}
              suffix="bàn"
              valueStyle={{ color: '#111', fontSize: 28, fontWeight: 700 }}
              prefix={<TableOutlined style={{ color: '#FF7A00' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{
              borderRadius: 16,
              border: '1px solid #f0f0f0',
            }}
          >
            <Statistic
              title="Đã thanh toán hôm nay"
              value={12}
              suffix="đơn"
              valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 24,
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Search
          placeholder="Tìm theo tên bàn hoặc mã hóa đơn..."
          allowClear
          size="large"
          style={{ maxWidth: 400 }}
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
        width={700}
        centered
      >
        {isPaymentSuccess ? (
          <Result
            status="success"
            title="Thanh toán thành công!"
            subTitle={
              <div>
                <Text>Hóa đơn: {selectedBill?.id}</Text>
                <br />
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                  {calculateFinalTotal().toLocaleString('vi-VN')}đ
                </Text>
                {paymentMethod === 'cash' && cashReceived > calculateFinalTotal() && (
                  <div style={{ marginTop: 12 }}>
                    <Text>Tiền thừa: </Text>
                    <Text strong style={{ color: '#FF7A00' }}>
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
                size="large"
                style={{ borderRadius: 12 }}
              >
                In hóa đơn
              </Button>,
              <Button
                key="done"
                type="primary"
                size="large"
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
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar
                  size={64}
                  style={{
                    background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {selectedBill.tableName}
                </Avatar>
                <Title level={4} style={{ margin: '12px 0 4px' }}>
                  Thanh toán {selectedBill.tableName}
                </Title>
                <Text type="secondary">{selectedBill.id}</Text>
              </div>

              <Row gutter={24} style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Bill Details */}
                <Col span={14} style={{ display: 'flex' }}>
                  <Card
                    size="small"
                    title="Chi tiết hóa đơn"
                    style={{ borderRadius: 12, width: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                  >
                    <div style={{ flex: 1 }}>
                      <List
                        size="small"
                        dataSource={selectedBill.items}
                        renderItem={(item) => (
                          <List.Item style={{ padding: '12px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Text>
                                {item.name} <Tag>{item.quantity}x</Tag>
                              </Text>
                              <Text strong>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>

                    {/* Discount - moved inside the card */}
                    <Divider style={{ margin: '16px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <GiftOutlined style={{ fontSize: 20, color: '#FF7A00' }} />
                      <Text strong>Giảm giá</Text>
                      <InputNumber
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(value) => setDiscountPercent(value || 0)}
                        formatter={(value) => `${value}%`}
                        parser={(value) => Number(value?.replace('%', '') || 0)}
                        style={{ width: 100, marginLeft: 'auto' }}
                      />
                    </div>
                  </Card>
                </Col>

                {/* Payment */}
                <Col span={10} style={{ display: 'flex' }}>
                  <Card
                    style={{
                      borderRadius: 12,
                      background: '#fafafa',
                      width: '100%',
                    }}
                  >
                    {/* Summary */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Tạm tính</Text>
                        <Text>{selectedBill.subtotal.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#52c41a' }}>Giảm giá ({discountPercent}%)</Text>
                          <Text style={{ color: '#52c41a' }}>-{calculateDiscount().toLocaleString('vi-VN')}đ</Text>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>VAT (10%)</Text>
                        <Text>{selectedBill.tax.toLocaleString('vi-VN')}đ</Text>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: 16 }}>Tổng cộng</Text>
                        <Text strong style={{ fontSize: 20, color: '#FF7A00' }}>
                          {calculateFinalTotal().toLocaleString('vi-VN')}đ
                        </Text>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div style={{ marginBottom: 20 }}>
                      <Text strong style={{ display: 'block', marginBottom: 12 }}>
                        Phương thức thanh toán
                      </Text>
                      <Radio.Group
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <Flex vertical gap={8} style={{ width: '100%' }}>
                          {paymentMethods.map((method) => (
                            <Radio.Button
                              key={method.key}
                              value={method.key}
                              style={{
                                width: '100%',
                                height: 44,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                textAlign: 'left',
                              }}
                            >
                              <Space>
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
                      <div style={{ marginBottom: 20 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                          Tiền khách đưa
                        </Text>
                        <InputNumber
                          size="large"
                          value={cashReceived}
                          onChange={(value) => setCashReceived(value || 0)}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                          style={{ width: '100%', borderRadius: 10 }}
                          addonAfter="đ"
                        />
                        {cashReceived >= calculateFinalTotal() && cashReceived > 0 && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 8 }}>
                            <Text style={{ color: '#52c41a' }}>
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
                          padding: 20,
                          background: '#fff',
                          borderRadius: 12,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 120,
                            height: 120,
                            background: '#f0f0f0',
                            margin: '0 auto 12px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <QrcodeOutlined style={{ fontSize: 60, color: '#bbb' }} />
                        </div>
                        <Text type="secondary">Quét mã QR để thanh toán</Text>
                      </div>
                    )}

                    {/* Pay Button */}
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<CheckCircleOutlined />}
                      onClick={handlePayment}
                      style={{
                        height: 52,
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 16,
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

