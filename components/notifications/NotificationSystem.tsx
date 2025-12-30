'use client';

import { useState } from 'react';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import FloatingNotificationButton from './FloatingNotificationButton';
import NotificationSheet from './NotificationSheet';

export default function NotificationSystem() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <NotificationProvider>
      <FloatingNotificationButton onOpen={() => setSheetOpen(true)} />
      <NotificationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </NotificationProvider>
  );
}

