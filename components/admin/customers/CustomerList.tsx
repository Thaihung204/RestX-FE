"use client";

import customerService, { Customer } from "@/lib/services/customerService";
import { Cake, Diamond, EmojiEvents, Star, WorkspacePremium } from "@mui/icons-material";
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

      {/* Customer Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div className="overflow-x-auto">
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
                  {t('customers.list.headers.vip_tier')}
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`}
                            alt={customer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {customer.vipTier && (
                            <div 
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2"
                              style={{ 
                                background: customerService.getVipTierColor(customer.vipTier),
                                borderColor: 'var(--bg-surface)'
                              }}
                            >
                              {customer.vipTier === 'platinum' ? <Diamond sx={{ fontSize: 12 }} /> : 
                               customer.vipTier === 'gold' ? <EmojiEvents sx={{ fontSize: 12 }} /> : 
                               customer.vipTier === 'silver' ? <Star sx={{ fontSize: 12 }} /> : <WorkspacePremium sx={{ fontSize: 12 }} />}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "var(--text)" }}>
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

                    {/* VIP Tier */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ 
                        background: customerService.getVipTierColor(customer.vipTier) + '20',
                        color: customerService.getVipTierColor(customer.vipTier)
                      }}>
                        {customerService.getVipTierName(customer.vipTier)}
                      </span>
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
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {t('customers.list.status.active')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
