'use client';

import { useNotifications } from '@/lib/contexts/NotificationContext';
import { CheckOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Empty, Modal, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

interface NotificationSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationSheet({ open, onClose }: NotificationSheetProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[0] | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const focusableElements = sheetRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      const handleTab = (e: KeyboardEvent) => {
        if (!sheetRef.current) return;

        const focusableElements = Array.from(
          sheetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTab);
        document.body.style.overflow = '';
        previousActiveElementRef.current?.focus();
      };
    } else {
      document.body.style.overflow = '';
      previousActiveElementRef.current?.focus();
    }
  }, [open, onClose]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(420px, 88vw)',
          height: '100vh',
          background: 'var(--surface, #141927)',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid var(--border, #1F2433)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Text
            strong
            style={{
              fontSize: 18,
              color: 'var(--text, #ECECEC)',
            }}
          >
            Thông báo
          </Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {notifications.some(n => n.unread) && (
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={markAllAsRead}
                style={{
                  color: 'var(--text-muted, #C5C5C5)',
                  fontSize: 13,
                  padding: '4px 8px',
                  height: 'auto',
                }}
              >
                Đánh dấu đã đọc
              </Button>
            )}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{
                color: 'var(--text-muted, #C5C5C5)',
                fontSize: 16,
                width: 32,
                height: 32,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Đóng"
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {notifications.length === 0 ? (
            <Empty
              description="Không có thông báo"
              style={{
                marginTop: 60,
                color: 'var(--text-muted, #C5C5C5)',
              }}
            />
          ) : (
            <div>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedNotification(item);
                    setDetailModalOpen(true);
                    if (item.unread) {
                      markAsRead(item.id);
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border, #1F2433)',
                    cursor: 'pointer',
                    background: item.unread ? 'rgba(255, 122, 0, 0.05)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.unread ? 'rgba(255, 122, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.unread ? 'rgba(255, 122, 0, 0.05)' : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {item.icon && (
                      <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: 'rgba(255, 122, 0, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#FF7A00',
                            }}
                          >
                            {item.icon}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong={item.unread}
                            style={{
                              display: 'block',
                              fontSize: 15,
                              color: 'var(--text, #ECECEC)',
                              marginBottom: 4,
                            }}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={{
                              display: 'block',
                              fontSize: 13,
                              color: 'var(--text-muted, #C5C5C5)',
                              lineHeight: 1.5,
                            }}
                          >
                            {item.description}
                          </Text>
                          <Text
                            style={{
                              display: 'block',
                              fontSize: 11,
                              color: 'var(--text-muted, #C5C5C5)',
                              marginTop: 6,
                              opacity: 0.7,
                            }}
                          >
                            {formatTimestamp(item.timestamp)}
                          </Text>
                        </div>
                        {item.unread && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#FF7A00',
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        closeIcon={null}
        centered
        width="100%"
        style={{ maxWidth: 500, padding: '0 16px' }}
        styles={{
          mask: {
            backdropFilter: 'blur(12px)',
            background: 'rgba(0,0,0,0.7)',
          },
          wrapper: {
            background: 'transparent',
          },
          body: {
            background: 'transparent',
            padding: 0,
          },
        }}
        wrapClassName="notification-detail-modal"
      >
        {selectedNotification && (
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(160deg, #1f1f1f 0%, #0a0a0a 100%)',
              borderRadius: 24,
              padding: '18px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginLeft: '20px',
              marginRight: '20px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 150,
                height: 150,
                background: '#ff5722',
                filter: 'blur(90px)',
                opacity: 0.15,
                pointerEvents: 'none',
              }}
            />

            <div
              onClick={() => setDetailModalOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ color: '#888', fontSize: 14 }}>✕</div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,87,34,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,87,34,0.25)',
                }}
              >
                {selectedNotification.icon ? (
                  <div style={{ color: '#ff5722', fontSize: 20 }}>
                    {selectedNotification.icon}
                  </div>
                ) : (
                  <InfoCircleOutlined style={{ color: '#ff5722', fontSize: 20 }} />
                )}
              </div>
              <div>
                <Text
                  style={{
                    color: '#ff5722',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 700,
                  }}
                >
                  Thông báo
                </Text>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: -2,
                  }}
                >
                  {selectedNotification.title}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: 2,
                paddingBottom: 6,
              }}
            >
              <div
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                {formatTimestamp(selectedNotification.timestamp)}
              </div>
              <div
                style={{
                  color: '#fff',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {selectedNotification.description}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

