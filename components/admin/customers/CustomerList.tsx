"use client";

import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import customerService, { Customer } from "@/lib/services/customerService";
import { triggerBrowserDownload } from "@/lib/utils/fileDownload";
import { Cake, Cancel, CheckCircle } from "@mui/icons-material";
import { message } from "antd";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import CustomerDetail from "./CustomerDetail";

const PAGE_SIZE = 10;

export interface CustomerListHandle {
  refresh: () => Promise<void>;
  exportExcel: () => Promise<void>;
}

const CustomerList = forwardRef<CustomerListHandle>(
  function CustomerList(_props, ref) {
    const { t } = useTranslation("common");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
      null,
    );
    const [nameSearch, setNameSearch] = useState("");
    const [emailSearch, setEmailSearch] = useState("");
    const [phoneSearch, setPhoneSearch] = useState("");
    const [filterTier, setFilterTier] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false);

    const loadCustomers = useCallback(
      async (targetPage = page) => {
        try {
          setLoading(true);

          const search = [
            nameSearch.trim(),
            emailSearch.trim(),
            phoneSearch.trim(),
          ]
            .filter(Boolean)
            .join(" ");

          const response = await customerService.getCustomersWithMeta({
            pageNumber: targetPage,
            pageSize: PAGE_SIZE,
            search: search || undefined,
            membershipLevel:
              filterTier === "all" ? undefined : filterTier.toUpperCase(),
          });

          setCustomers(response.items);
          setTotalCount(response.totalCount);
          setTotalPages(Math.max(1, response.totalPages || 1));
          if (response.pageNumber !== targetPage) {
            setPage(response.pageNumber || 1);
          }
        } catch (error) {
          console.error("Error loading customers:", error);
        } finally {
          setLoading(false);
        }
      },
      [emailSearch, filterTier, nameSearch, page, phoneSearch],
    );

    useEffect(() => {
      setPage(1);
    }, [nameSearch, emailSearch, phoneSearch, filterTier]);

    useEffect(() => {
      loadCustomers(page);
    }, [page, nameSearch, emailSearch, phoneSearch, filterTier]);

    const handleExportCustomers = useCallback(async () => {
      setExporting(true);
      try {
        const search = [
          nameSearch.trim(),
          emailSearch.trim(),
          phoneSearch.trim(),
        ]
          .filter(Boolean)
          .join(" ");

        const file = await customerService.exportCustomers({
          search: search || undefined,
          membershipLevel:
            filterTier === "all" ? undefined : filterTier.toUpperCase(),
        });

        triggerBrowserDownload(file.blob, file.fileName);
        message.success(t("common.messages.export_success"));
      } catch (error) {
        console.error("Error exporting customers:", error);
        message.error(t("common.messages.export_failed"));
      } finally {
        setExporting(false);
      }
    }, [emailSearch, filterTier, nameSearch, phoneSearch, t]);

    useImperativeHandle(
      ref,
      () => ({
        refresh: () => loadCustomers(page),
        exportExcel: handleExportCustomers,
      }),
      [handleExportCustomers, loadCustomers, page],
    );

    const sortedCustomers = useMemo(() => {
      return [...customers].sort((a, b) => {
        const aIsBirthday = customerService.isBirthday(a.birthday);
        const bIsBirthday = customerService.isBirthday(b.birthday);

        if (aIsBirthday && !bIsBirthday) return -1;
        if (!aIsBirthday && bIsBirthday) return 1;
        return 0;
      });
    }, [customers]);

    const birthdayCount = sortedCustomers.filter((c) =>
      customerService.isBirthday(c.birthday),
    ).length;
    const currentPage = Math.min(page, totalPages);
    const pagedCustomers = sortedCustomers;

    return (
      <div className="space-y-6">
        {/* Birthday Alert */}
        {birthdayCount > 0 && (
          <div
            className="rounded-lg p-4 flex items-center gap-3"
            style={{
              background: "var(--bg-surface)",
              border: "2px solid #FBBF24",
            }}>
            <Cake className="text-3xl text-yellow-500" />
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                {t("customers.birthday_alert.title")}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("customers.birthday_alert.message", {
                  count: birthdayCount,
                })}
              </p>
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder={t("customers.list.headers.customer", {
                defaultValue: "Tên khách hàng",
              })}
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />

            <input
              type="text"
              placeholder={t("customers.list.headers.contact", {
                defaultValue: "Email",
              })}
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />

            <input
              type="text"
              placeholder={t("tenant_requests.form.phone_number", {
                defaultValue: "Số điện thoại",
              })}
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              <option value="all">{t("customers.filters.all_tiers")}</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Vàng</option>
              <option value="silver">Bạc</option>
              <option value="bronze">Đồng</option>
            </select>
          </div>

          {(nameSearch ||
            emailSearch ||
            phoneSearch ||
            filterTier !== "all") && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setNameSearch("");
                  setEmailSearch("");
                  setPhoneSearch("");
                  setFilterTier("all");
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                {t("admin.reservations.filter.clear", {
                  defaultValue: "Xóa lọc",
                })}
              </button>
            </div>
          )}
        </div>

        {/* Customer List Container */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-surface)" }}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: "var(--bg-base)",
                    borderBottom: "2px solid var(--border)",
                  }}>
                  <th
                    className="text-left px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.customer")}
                  </th>
                  <th
                    className="text-left px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.contact")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.rank")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.orders")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.total_spent")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.points")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.status")}
                  </th>
                  <th
                    className="text-center px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--text)" }}>
                    {t("customers.list.headers.actions", {
                      defaultValue: "Actions",
                    })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-6">
                      <div
                        className="w-full h-[320px] rounded-xl animate-pulse"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  pagedCustomers.map((customer) => {
                    const isBirthday = customerService.isBirthday(
                      customer.birthday,
                    );

                    return (
                      <tr
                        key={customer.id}
                        className="hover:opacity-80 transition-all"
                        style={{
                          background: isBirthday
                            ? "rgba(251, 191, 36, 0.1)"
                            : "var(--bg-surface)",
                          borderBottom: "1px solid var(--border)",
                          borderLeft: isBirthday
                            ? "4px solid #FBBF24"
                            : "4px solid transparent",
                        }}>
                        {/* Customer Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  customer.avatar ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`
                                }
                                alt={customer.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="font-semibold truncate"
                                style={{ color: "var(--text)" }}>
                                {customer.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <p
                            className="text-sm"
                            style={{ color: "var(--text)" }}>
                            {customer.email}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}>
                            {customer.phone}
                          </p>
                        </td>

                        {/* VIP Tier (Rank) - Icons */}
                        <td className="px-6 py-4 text-center">
                          <div
                            className="flex justify-center items-center"
                            title={customerService.getVipTierName(
                              customer.vipTier,
                            )}>
                            <LoyaltyBandIcon
                              color={customerService.getVipTierColor(
                                customer.vipTier,
                              )}
                              size={24}
                            />
                          </div>
                        </td>

                        {/* Total Orders */}
                        <td className="px-6 py-4 text-center">
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text)" }}>
                            {customer.totalOrders}
                          </p>
                        </td>

                        {/* Total Spent */}
                        <td className="px-6 py-4 text-center">
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text)" }}>
                            {customer.totalSpent.toLocaleString("vi-VN")}₫
                          </p>
                        </td>

                        {/* Loyalty Points */}
                        <td className="px-6 py-4 text-center">
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text)" }}>
                            {customer.loyaltyPoints}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          {isBirthday ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 animate-pulse">
                              <Cake sx={{ fontSize: 14 }} />{" "}
                              {t("customers.list.status.birthday")}
                            </span>
                          ) : (
                            <div
                              className="flex justify-center"
                              title={
                                customer.isActive
                                  ? t("customers.list.status.active")
                                  : t("customers.list.status.inactive")
                              }>
                              {customer.isActive ? (
                                <CheckCircle
                                  sx={{ fontSize: 20, color: "#22c55e" }}
                                />
                              ) : (
                                <Cancel
                                  sx={{ fontSize: 20, color: "#ef4444" }}
                                />
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: "var(--primary-soft)",
                              color: "var(--primary)",
                              border: "1px solid var(--primary-border)",
                            }}>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            {t("customers.list.actions.view_detail", {
                              defaultValue: "View detail",
                            })}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Customer List (Mobile Cards) */}
          <div className="md:hidden space-y-4 p-4">
            {loading ? (
              <div
                className="w-full h-[220px] rounded-xl animate-pulse"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              />
            ) : (
              pagedCustomers.map((customer) => {
                const isBirthday = customerService.isBirthday(
                  customer.birthday,
                );
                return (
                  <div
                    key={customer.id}
                    className="p-4 rounded-lg hover:opacity-90 transition-all border"
                    style={{
                      background: isBirthday
                        ? "rgba(251, 191, 36, 0.1)"
                        : "var(--bg-surface)",
                      borderColor: isBirthday ? "#FBBF24" : "var(--border)",
                    }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              customer.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`
                            }
                            alt={customer.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-lg truncate"
                            style={{ color: "var(--text)" }}>
                            {customer.name}
                          </p>
                          <p
                            className="text-sm truncate"
                            style={{ color: "var(--text-secondary)" }}>
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex flex-col items-end flex-shrink-0 ml-2"
                        title={customerService.getVipTierName(
                          customer.vipTier,
                        )}>
                        <LoyaltyBandIcon
                          color={customerService.getVipTierColor(
                            customer.vipTier,
                          )}
                          size={32}
                        />
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t"
                      style={{ borderColor: "var(--border)" }}>
                      <div>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--text-secondary)" }}>
                          {t("customers.list.headers.orders")}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text)" }}>
                          {customer.totalOrders}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--text-secondary)" }}>
                          {t("customers.list.headers.total_spent")}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text)" }}>
                          {customer.totalSpent.toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                      <div>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--text-secondary)" }}>
                          {t("customers.list.headers.points")}
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text)" }}>
                          {customer.loyaltyPoints}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--text-secondary)" }}>
                          {t("customers.list.headers.status")}
                        </span>
                        {isBirthday ? (
                          <span className="inline-flex items-center gap-1 font-bold text-yellow-500">
                            <Cake sx={{ fontSize: 14 }} /> Birthday
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {customer.isActive ? (
                              <CheckCircle
                                sx={{ fontSize: 18, color: "#22c55e" }}
                              />
                            ) : (
                              <Cancel sx={{ fontSize: 18, color: "#ef4444" }} />
                            )}
                            <span
                              style={{
                                color: customer.isActive
                                  ? "#22c55e"
                                  : "#ef4444",
                                fontSize: "0.875rem",
                              }}>
                              {customer.isActive
                                ? t("customers.list.status.active")
                                : t("customers.list.status.inactive")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary-border)",
                      }}>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {t("customers.list.actions.view_detail", {
                        defaultValue: "View detail",
                      })}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {!loading && totalCount === 0 && (
            <div className="text-center py-12">
              <p style={{ color: "var(--text-secondary)" }}>
                {t("customers.list.empty")}
              </p>
            </div>
          )}

          {!loading && totalCount > 0 && totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("admin.reservations.pagination.page_info", {
                  page: currentPage,
                  total: totalPages,
                  count: totalCount,
                  defaultValue: `Trang ${currentPage}/${totalPages} • ${totalCount} khách hàng`,
                })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}>
                  {t("admin.reservations.pagination.prev", {
                    defaultValue: "Trước",
                  })}
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                      style={
                        p === currentPage
                          ? { background: "var(--primary)", color: "white" }
                          : {
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }
                      }>
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}>
                  {t("admin.reservations.pagination.next", {
                    defaultValue: "Sau",
                  })}
                </button>
              </div>
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
  },
);

export default CustomerList;
