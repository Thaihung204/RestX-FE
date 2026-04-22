"use client";

import LoyaltyBandIcon from "@/components/loyalty/LoyaltyBandIcon";
import { DropDown } from "@/components/ui/DropDown";
import customerService, { Customer } from "@/lib/services/customerService";
import loyaltyService, { LoyaltyPointBand } from "@/lib/services/loyaltyService";
import { formatVND } from "@/lib/utils/currency";
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
    const [bands, setBands] = useState<LoyaltyPointBand[]>([]);

    useEffect(() => {
      loyaltyService
        .getAllBands()
        .then((data) => setBands(data))
        .catch(console.error);
    }, []);

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
              filterTier === "all" ? undefined : filterTier,
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
            filterTier === "all" ? undefined : filterTier,
        });

        triggerBrowserDownload(file.blob, file.fileName);
        message.success(t("common.messages.export_success"));
      } catch (error) {
        console.error("Error exporting customers:", error);
        message.error(t("common.messages.export_failed"));
      } finally {
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
            <div className="space-y-1">
              <label className="block text-xs" style={{ color: "var(--text-muted)" }}>
                {t("customers.list.headers.customer", { defaultValue: "Tên khách hàng" })}
              </label>
              <input
                type="text"
                placeholder={t("customers.list.headers.customer", { defaultValue: "Tên khách hàng" })}
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs" style={{ color: "var(--text-muted)" }}>
                {t("customers.list.headers.contact", { defaultValue: "Email" })}
              </label>
              <input
                type="text"
                placeholder={t("customers.list.headers.contact", { defaultValue: "Email" })}
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs" style={{ color: "var(--text-muted)" }}>
                {t("tenant_requests.form.phone_number", { defaultValue: "Số điện thoại" })}
              </label>
              <input
                type="text"
                placeholder={t("tenant_requests.form.phone_number", { defaultValue: "Số điện thoại" })}
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full h-14 px-4 rounded-lg text-sm outline-none"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs" style={{ color: "var(--text-muted)" }}>
                {t("customers.filters.tier_label", { defaultValue: "Hạng thành viên" })}
              </label>
              <DropDown
                value={filterTier}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterTier(e.target.value)}
                className="!h-14 !px-4">
                <option value="all">{t("customers.filters.all_tiers")}</option>
                {bands.map((band) => (
                  <option key={band.id} value={band.name}>{band.name}</option>
                ))}
              </DropDown>
            </div>
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
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-left"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.customer")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-left"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.contact")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.rank")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.orders")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.total_spent")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.points")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.status")}
                  </th>
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center"
                    style={{ color: "var(--text-muted)" }}>
                    {t("customers.list.headers.actions", { defaultValue: "Thao tác" })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6">
                      <div
                        className="w-full h-[320px] rounded-xl animate-pulse"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      />
                    </td>
                  </tr>
                ) : (
                  pagedCustomers.map((customer) => {
                    const contactValue = customer.email || customer.phone || "-";
                    const avatarSrc =
                      customer.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || "?")}&background=4F46E5&color=fff`;

                    return (
                      <tr key={customer.id} className="transition-colors hover:bg-[var(--surface)]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[var(--surface)] flex items-center justify-center border border-[var(--border)]">
                              <img src={avatarSrc} alt={customer.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{customer.name}</p>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{customer.phone || "-"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-sm break-all" style={{ color: "var(--text)" }}>{contactValue}</p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-center"><LoyaltyBandIcon color={customerService.getVipTierColor(customer.vipTier)} size={24} /></div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-center"><p className="text-sm font-medium" style={{ color: "var(--text)" }}>{customer.totalOrders}</p></td>

                        <td className="px-4 py-3 whitespace-nowrap text-center"><p className="text-sm font-medium" style={{ color: "var(--text)" }}>{formatVND(customer.totalSpent)}</p></td>

                        <td className="px-4 py-3 whitespace-nowrap text-center"><p className="text-sm font-medium" style={{ color: "var(--text)" }}>{customer.loyaltyPoints}</p></td>

                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            {customer.isActive ? <CheckCircle sx={{ fontSize: 20, color: "#22c55e" }} /> : <Cancel sx={{ fontSize: 20, color: "#ef4444" }} />}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            <button onClick={() => setSelectedCustomer(customer)} className="p-2 rounded-lg transition-all" style={{ background: "var(--primary-soft)", color: "var(--primary)" }} title={t("customers.list.actions.view_detail", { defaultValue: "View detail" })}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
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
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              />
            ) : (
              pagedCustomers.map((customer) => {
                const isBirthday = customerService.isBirthday(customer.birthday);
                return (
                  <div key={customer.id} className="p-4 rounded-lg border" style={{ background: "var(--bg-surface)", borderColor: isBirthday ? "#FBBF24" : "var(--border)" }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ background: "var(--primary)" }}>
                          <img src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=4F46E5&color=fff`} alt={customer.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-lg truncate" style={{ color: "var(--text)" }}>{customer.name}</p>
                          <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 ml-2" title={customerService.getVipTierName(customer.vipTier)}>
                        <LoyaltyBandIcon color={customerService.getVipTierColor(customer.vipTier)} size={32} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                      <div><span className="block text-xs" style={{ color: "var(--text-muted)" }}>{t("customers.list.headers.orders")}</span><span className="font-semibold" style={{ color: "var(--text)" }}>{customer.totalOrders}</span></div>
                      <div><span className="block text-xs" style={{ color: "var(--text-muted)" }}>{t("customers.list.headers.total_spent")}</span><span className="font-semibold" style={{ color: "var(--text)" }}>{formatVND(customer.totalSpent)}</span></div>
                      <div><span className="block text-xs" style={{ color: "var(--text-muted)" }}>{t("customers.list.headers.points")}</span><span className="font-semibold" style={{ color: "var(--text)" }}>{customer.loyaltyPoints}</span></div>
                      <div><span className="block text-xs" style={{ color: "var(--text-muted)" }}>{t("customers.list.headers.status")}</span><div className="flex items-center gap-1">{customer.isActive ? <CheckCircle sx={{ fontSize: 18, color: "#22c55e" }} /> : <Cancel sx={{ fontSize: 18, color: "#ef4444" }} />}<span style={{ color: customer.isActive ? "#22c55e" : "#ef4444", fontSize: "0.875rem" }}>{customer.isActive ? t("customers.list.status.active") : t("customers.list.status.inactive")}</span></div></div>
                    </div>

                    <button onClick={() => setSelectedCustomer(customer)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary-border)" }} title={t("customers.list.actions.view_detail", { defaultValue: "View detail" })}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_info_compact", {
                    page: currentPage,
                    total: totalPages,
                    defaultValue: `Trang ${currentPage}/${totalPages} ·`,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <DropDown
                    value={String(PAGE_SIZE)}
                    onChange={() => {}}
                    containerClassName="w-[110px]"
                    className="!h-9 !py-1.5 !pl-3 !pr-8 !text-sm"
                    aria-label={t("common.pagination.items_per_page", { defaultValue: "Items/page" })}>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </DropDown>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("admin.reservations.pagination.results_label", { defaultValue: "kết quả" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {t("admin.reservations.pagination.prev", { defaultValue: "Trước" })}
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                      style={
                        p === currentPage
                          ? { background: "var(--primary)", color: "white" }
                          : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                      }>
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  {t("admin.reservations.pagination.next", { defaultValue: "Sau" })}
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
