"use client";

import customerService, { Customer } from "@/lib/services/customerService";
import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import {
    Cake,
    Cancel,
    CheckCircle,
    Close,
    Email,
    History,
    Phone,
    Star,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
  const { t } = useTranslation('common');
  const isBirthday = customerService.isBirthday(customer.birthday);
  const primaryColor = "var(--primary)";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getVipIcon = (tier?: string) => {
    return <LoyaltyBandIcon color={getVipBadgeColor(tier)} size={20} />;
  };

  const getVipBadgeColor = (tier?: string) => {
     switch(tier) {
      case 'platinum': return '#E5E7EB'; 
      case 'gold': return '#EAB308';    
      case 'silver': return '#9CA3AF';   
      default: return '#FB923C';         
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-[#18181b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple Header with Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="p-8">
          {/* Profile Header - Clean & Centered */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4 group">
              <div className="relative inline-block">
                <img
                  src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`}
                  alt={customer.name}
                  className="w-24 h-24 rounded-full border-2 border-[#27272a] object-cover"
                />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2 justify-center">
              {customer.name}
              {customer.isActive ? (
                <CheckCircle sx={{ fontSize: 20, color: '#22c55e' }} titleAccess={t('customers.list.status.active')} />
              ) : (
                <Cancel sx={{ fontSize: 20, color: '#ef4444' }} titleAccess={t('customers.list.status.inactive')} />
              )}
              {isBirthday && <Cake sx={{ fontSize: 20, color: primaryColor }} className="animate-pulse" />}
            </h2>
            
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--text-muted)" }}>
               <div className="flex items-center gap-1" title={t('customers.detail.member_tier', { tier: customer.vipTier })}>
                 {getVipIcon(customer.vipTier)}
                 <span style={{ color: getVipBadgeColor(customer.vipTier) }} className="font-bold uppercase text-[12px]">
                   {customer.vipTier || 'Member'}
                 </span>
               </div>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--border)" }}></span>
              <span>{t('customers.detail.member_since', { date: formatDate(customer.memberSince) })}</span>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
              <span className="text-[11px] uppercase tracking-wider font-semibold">Customer ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--text)" }}>{customer.id}</span>
            </div>

            <div className="flex gap-4 items-center justify-center w-full flex-wrap">
              {customer.email && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#27272a] text-xs text-gray-300 border border-white/5">
                  <Email sx={{ fontSize: 14, color: primaryColor }} />
                  <span className="truncate max-w-[150px]">{customer.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#27272a] text-xs text-gray-300 border border-white/5">
                <Phone sx={{ fontSize: 14, color: primaryColor }} />
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics - Simple Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
             <div className="p-3 rounded-xl bg-[#27272a] text-center border border-white/5">
              <div className="mb-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">{t('customers.detail.orders')}</div>
              <div className="text-xl font-bold text-white">{customer.totalOrders}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#27272a] text-center border border-white/5">
               <div className="mb-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">{t('customers.detail.spent')}</div>
              <div className="text-xl font-bold text-white" style={{ color: primaryColor }}>
                {(customer.totalSpent / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#27272a] text-center border border-white/5">
               <div className="mb-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">{t('customers.detail.points')}</div>
              <div className="text-xl font-bold text-white">{customer.loyaltyPoints}</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            {/* Last Activity */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#27272a]/50 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#27272a]">
                   <History sx={{ fontSize: 16, color: 'gray' }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t('customers.detail.last_visit')}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{formatDate(customer.lastVisit)}</span>
            </div>

            {/* Favorite Items */}
            {customer.favoriteItems && customer.favoriteItems.length > 0 && (
              <div className="p-3 rounded-xl bg-[#27272a]/50 border border-white/5">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#27272a]">
                      <Star sx={{ fontSize: 16, color: 'gray' }} />
                    </div>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t('customers.detail.favorite_items')}</span>
                 </div>
                 <div className="flex flex-wrap gap-2 pl-[44px]">
                    {customer.favoriteItems.map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-md text-xs border"
                        style={{ background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }}
                      >
                        {item}
                      </span>
                    ))}
                 </div>
              </div>
            )}
          </div>
          
          {/* Birthday Banner */}
          {isBirthday && (
            <div className="mt-6 p-3 rounded-xl bg-[#27272a] border border-[var(--primary)]/30 flex items-center gap-3">
              <div className="p-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <Cake sx={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{t('customers.detail.birthday_banner.title')}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('customers.detail.birthday_banner.subtitle')}</p>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
