'use client';

import { useNotifications } from '@/lib/contexts/NotificationContext';
import { BellOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface FloatingNotificationButtonProps {
  onOpen: () => void;
}

const STORAGE_KEY = 'restx-notification-button-position';
const DRAG_THRESHOLD = 8;
const MIN_MARGIN = 12;
const BUTTON_SIZE = 56;
const FORBIDDEN_ZONE = {
  bottom: 0,
  right: 0,
  width: 100,
  height: 100,
};

const getDefaultPosition = (): Position => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }
  return {
    x: window.innerWidth - BUTTON_SIZE - MIN_MARGIN,
    y: window.innerHeight * 0.5,
  };
};

export default function FloatingNotificationButton({ onOpen }: FloatingNotificationButtonProps) {
  const { unreadCount } = useNotifications();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosRef = useRef<Position | null>(null);
  const initialButtonPosRef = useRef<Position | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clampPosition = useCallback((pos: Position): Position => {
    if (typeof window === 'undefined') return pos;

    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0', 10);
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10);
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0', 10);
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0', 10);

    const maxX = window.innerWidth - BUTTON_SIZE - MIN_MARGIN - safeAreaRight;
    const maxY = window.innerHeight - BUTTON_SIZE - MIN_MARGIN - safeAreaBottom;
    const minX = MIN_MARGIN + safeAreaLeft;
    const minY = MIN_MARGIN + safeAreaTop;

    let clampedX = Math.max(minX, Math.min(maxX, pos.x));
    let clampedY = Math.max(minY, Math.min(maxY, pos.y));

    const isInForbiddenZone =
      clampedX >= window.innerWidth - FORBIDDEN_ZONE.width &&
      clampedY >= window.innerHeight - FORBIDDEN_ZONE.height;

    if (isInForbiddenZone) {
      const distToLeft = clampedX;
      const distToRight = window.innerWidth - clampedX - BUTTON_SIZE;
      const distToTop = clampedY;
      const distToBottom = window.innerHeight - clampedY - BUTTON_SIZE;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft) {
        clampedX = MIN_MARGIN + safeAreaLeft;
      } else if (minDist === distToRight) {
        clampedX = window.innerWidth - BUTTON_SIZE - MIN_MARGIN - safeAreaRight;
      } else if (minDist === distToTop) {
        clampedY = MIN_MARGIN + safeAreaTop;
      } else {
        clampedY = window.innerHeight - BUTTON_SIZE - MIN_MARGIN - safeAreaBottom;
      }
    }

    return { x: clampedX, y: clampedY };
  }, []);

  const snapToEdge = useCallback((pos: Position): Position => {
    if (typeof window === 'undefined') return pos;

    const centerX = window.innerWidth / 2;
    const clamped = clampPosition(pos);

    if (clamped.x < centerX) {
      clamped.x = MIN_MARGIN + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0', 10);
    } else {
      clamped.x = window.innerWidth - BUTTON_SIZE - MIN_MARGIN - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0', 10);
    }

    return clamped;
  }, [clampPosition]);

  const savePosition = useCallback((pos: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Position;
        const clamped = clampPosition(parsed);
        setPosition(clamped);
      } catch {
        setPosition(getDefaultPosition());
      }
    } else {
      setPosition(getDefaultPosition());
    }
  }, [clampPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointerPos = { x: e.clientX, y: e.clientY };
    dragStartPosRef.current = pointerPos;
    initialButtonPosRef.current = { x: position.x, y: position.y };
    setIsDragging(false);

    buttonRef.current?.setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartPosRef.current || !initialButtonPosRef.current) return;

    const currentPos = { x: e.clientX, y: e.clientY };
    const deltaX = currentPos.x - dragStartPosRef.current.x;
    const deltaY = currentPos.y - dragStartPosRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > DRAG_THRESHOLD && !isDragging) {
      setIsDragging(true);
    }

    if (isDragging || distance > DRAG_THRESHOLD) {
      const newPos = {
        x: initialButtonPosRef.current.x + deltaX,
        y: initialButtonPosRef.current.y + deltaY,
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const clamped = clampPosition(newPos);
        setPosition(clamped);
      });
    }
  }, [isDragging, clampPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartPosRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const currentPos = { x: e.clientX, y: e.clientY };
    const deltaX = currentPos.x - dragStartPosRef.current.x;
    const deltaY = currentPos.y - dragStartPosRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= DRAG_THRESHOLD) {
      onOpen();
    } else if (isDragging || distance > DRAG_THRESHOLD) {
      const snapped = snapToEdge(position);
      setPosition(snapped);
      savePosition(snapped);
    }

    dragStartPosRef.current = null;
    initialButtonPosRef.current = null;
    setIsDragging(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    buttonRef.current?.releasePointerCapture(e.pointerId);
  }, [isDragging, position, snapToEdge, savePosition, onOpen]);

  useEffect(() => {
    const handleResize = () => {
      const clamped = clampPosition(position);
      setPosition(clamped);
      savePosition(clamped);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampPosition, savePosition]);

  const badgeText = unreadCount > 9 ? '9+' : unreadCount > 0 ? unreadCount.toString() : null;

  if (!isMounted) {
    return (
      <div
        style={{
          position: 'fixed',
          right: MIN_MARGIN,
          top: '50%',
          transform: 'translateY(-50%)',
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(255, 122, 0, 0.5)',
          zIndex: 98,
          opacity: 0,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: '0 8px 30px rgba(255, 122, 0, 0.5)',
        zIndex: 98,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        transform: `translate3d(0, 0, 0) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 122, 0, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 122, 0, 0.5)';
        }
      }}
    >
      <BellOutlined style={{ color: '#fff', fontSize: 24 }} />
      {badgeText && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#ff4d4f',
            color: '#fff',
            fontSize: 11,
            fontWeight: 'bold',
            padding: badgeText.length === 1 ? '2px 6px' : '2px 5px',
            borderRadius: 10,
            border: '2px solid #fff',
            minWidth: 18,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {badgeText}
        </div>
      )}
    </div>
  );
}

