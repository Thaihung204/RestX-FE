"use client";

import customerService, { Customer } from "@/lib/services/customerService";
import { Cake, Cancel, CheckCircle, Diamond, EmojiEvents, Star, WorkspacePremium } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomerDetail from "./CustomerDetail";

export default function CustomerList() {
  const { t } = useTranslation('common');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    const matchesTier = filterTier === "all" || customer.vipTier === filterTier;
    
    return matchesSearch && matchesTier;
  });

  // Sort: birthday customers first
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aIsBirthday = customerService.isBirthday(a.birthday);
    const bIsBirthday = customerService.isBirthday(b.birthday);
    
    if (aIsBirthday && !bIsBirthday) return -1;
    if (!aIsBirthday && bIsBirthday) return 1;
    return 0;
  });

  const birthdayCount = customers.filter(c => customerService.isBirthday(c.birthday)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Birthday Alert */}
      {birthdayCount > 0 && (
        <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "var(--bg-surface)", border: "2px solid #FBBF24" }}>
          <Cake className="text-3xl text-yellow-500" />
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              {t('customers.birthday_alert.title')}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t('customers.birthday_alert.message', { count: birthdayCount })}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg p-6" style={{ background: "var(--bg-surface)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
              {t('customers.search.label')}
            </label>
            <input
              type="text"
              placeholder={t('customers.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                background: "var(--bg-base)", 
                color: "var(--text)",
                borderColor: "var(--border)"
              }}
            />
          </div>

          {/* VIP Tier Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
              {t('customers.filters.tier')}
            </label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{ 
                background: "var(--bg-base)", 
                color: "var(--text)",
                borderColor: "var(--border)"
              }}
            >
              <option value="all">{t('customers.filters.all_tiers')}</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Vàng</option>
              <option value="silver">Bạc</option>
              <option value="bronze">Đồng</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t('customers.list.found_count', { count: sortedCustomers.length })}
          </p>
        </div>
      </div>

      {/* Customer List Container */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)" }}>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.customer')}
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.contact')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.rank')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.orders')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.total_spent')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.points')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {t('customers.list.headers.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => {
                const isBirthday = customerService.isBirthday(customer.birthday);
                
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer hover:opacity-80 transition-all"
                    style={{ 
                      background: isBirthday ? "rgba(251, 191, 36, 0.1)" : "var(--bg-surface)",
                      borderBottom: "1px solid var(--border)",
                      borderLeft: isBirthday ? "4px solid #FBBF24" : "4px solid transparent"
                    }}
                  >
                    {/* Customer Info */}
                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`}
                            alt={customer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: "var(--text)" }}>
                            {customer.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "var(--text)" }}>
                        {customer.email}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {customer.phone}
                      </p>
                    </td>

                    {/* VIP Tier (Rank) - Icons */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center" title={customerService.getVipTierName(customer.vipTier)}>
                         {customer.vipTier === 'platinum' ? <Diamond sx={{ fontSize: 24, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                          customer.vipTier === 'gold' ? <EmojiEvents sx={{ fontSize: 24, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                          customer.vipTier === 'silver' ? <Star sx={{ fontSize: 24, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                          <WorkspacePremium sx={{ fontSize: 24, color: customerService.getVipTierColor(customer.vipTier) }} />}
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {customer.totalOrders}
                      </p>
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {customer.totalSpent.toLocaleString('vi-VN')}₫
                      </p>
                    </td>

                    {/* Loyalty Points */}
                    <td className="px-6 py-4 text-center">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {customer.loyaltyPoints}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {isBirthday ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 animate-pulse">
                          <Cake sx={{ fontSize: 14 }} /> {t('customers.list.status.birthday')}
                        </span>
                      ) : (
                        <div className="flex justify-center" title={customer.isActive ? t('customers.list.status.active') : t('customers.list.status.inactive')}>
                          {customer.isActive ? (
                            <CheckCircle sx={{ fontSize: 20, color: "#22c55e" }} />
                          ) : (
                            <Cancel sx={{ fontSize: 20, color: "#ef4444" }} />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Customer List (Mobile Cards) */}
        <div className="md:hidden space-y-4 p-4">
          {sortedCustomers.map((customer) => {
            const isBirthday = customerService.isBirthday(customer.birthday);
            return (
              <div 
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="p-4 rounded-lg cursor-pointer hover:opacity-90 transition-all border"
                style={{ 
                  background: isBirthday ? "rgba(251, 191, 36, 0.1)" : "var(--bg-surface)",
                  borderColor: isBirthday ? "#FBBF24" : "var(--border)",
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                     <div className="relative flex-shrink-0">
                      <img
                          src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`}
                          alt={customer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-lg truncate" style={{ color: "var(--text)" }}>
                          {customer.name}
                        </p>
                        <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                          {customer.email}
                        </p>
                      </div>
                  </div>
                   <div className="flex flex-col items-end flex-shrink-0 ml-2" title={customerService.getVipTierName(customer.vipTier)}>
                      {customer.vipTier === 'platinum' ? <Diamond sx={{ fontSize: 32, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                       customer.vipTier === 'gold' ? <EmojiEvents sx={{ fontSize: 32, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                       customer.vipTier === 'silver' ? <Star sx={{ fontSize: 32, color: customerService.getVipTierColor(customer.vipTier) }} /> : 
                       <WorkspacePremium sx={{ fontSize: 32, color: customerService.getVipTierColor(customer.vipTier) }} />}
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{t('customers.list.headers.orders')}</span>
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{customer.totalOrders}</span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{t('customers.list.headers.total_spent')}</span>
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{customer.totalSpent.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{t('customers.list.headers.points')}</span>
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{customer.loyaltyPoints}</span>
                    </div>
                    <div>
                      <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{t('customers.list.headers.status')}</span>
                      {isBirthday ? (
                          <span className="inline-flex items-center gap-1 font-bold text-yellow-500">
                            <Cake sx={{ fontSize: 14 }} /> Birthday
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                             {customer.isActive ? (
                                <CheckCircle sx={{ fontSize: 18, color: "#22c55e" }} />
                              ) : (
                                <Cancel sx={{ fontSize: 18, color: "#ef4444" }} />
                              )}
                              <span style={{ color: customer.isActive ? "#22c55e" : "#ef4444", fontSize: "0.875rem" }}>
                                {customer.isActive ? t('customers.list.status.active') : t('customers.list.status.inactive')}
                              </span>
                          </div>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-secondary)" }}>
              {t('customers.list.empty')}
            </p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
