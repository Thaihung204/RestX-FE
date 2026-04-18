"use client";

import ContentAreaLoader from "@/components/admin/ContentAreaLoader";
import { DropDown } from "@/components/ui/DropDown";
import StatusToggle from "@/components/ui/StatusToggle";
import employeeService from "@/lib/services/employeeService";
import { App } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Staff {
  id: string;
  name: string;
  code: string;
  email: string;
  role: string;
  position: string;
  status: "active" | "inactive";
  joinDate: string;
  createdDate: string;
  avatarUrl?: string;
}

const PAGE_SIZE = 12;

export default function StaffPage() {
  const { t } = useTranslation(["common", "dashboard"]);
  const { message } = App.useApp();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Stats from full DB (from totalCount metadata)
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalPositions, setTotalPositions] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const roles = ["Manager", "Staff"];

  const fetchStaffList = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await employeeService.getEmployees({
        page,
        itemsPerPage: PAGE_SIZE,
        search: searchQuery.trim() || undefined,
        position: filterRole === "all" ? undefined : filterRole,
      });

      const paginatedData = data.data;
      const arrayData =
        paginatedData?.items ||
        paginatedData?.employees ||
        paginatedData?.data ||
        data.employees ||
        (Array.isArray(data.data) ? data.data : null);

      if (arrayData && Array.isArray(arrayData)) {
        const mappedData = arrayData.map((item: any, index: number) => ({
          id: item.id?.toString() || `staff-${index}-${Date.now()}`,
          name: item.fullName || "",
          code: item.code || "",
          email: item.email || "",
          role: item.position || "Staff",
          position: item.position || "",
          status: (item.isActive ? "active" : "inactive") as
            | "active"
            | "inactive",
          joinDate: item.hireDate || new Date().toISOString(),
          createdDate: item.createdDate || new Date().toISOString(),
          avatarUrl: item.avatarUrl,
        }));

        setStaffList(mappedData);

        // Pagination metadata
        const tc =
          paginatedData?.totalCount ?? data.totalCount ?? mappedData.length;
        const tp =
          (paginatedData?.totalPages ?? Math.ceil(tc / PAGE_SIZE)) || 1;
        setTotalCount(tc);
        setTotalPages(tp);

        setTotalPositions(
          new Set(mappedData.map((s) => s.position).filter(Boolean)).size,
        );

        // Use global active/inactive stats from main API metadata
        setTotalActive(
          paginatedData?.totalActive ??
            mappedData.filter((s) => s.status === "active").length,
        );
        setTotalInactive(
          paginatedData?.totalInactive ??
            mappedData.filter((s) => s.status === "inactive").length,
        );

        setError(null);
      } else {
        setError(t("dashboard.staff.errors.load_failed"));
      }
    } catch {
      setError(t("dashboard.staff.errors.load_failed"));
      message.error(t("dashboard.toasts.staff.load_error_message"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, filterRole]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleToggleStatus = async (
    id: string,
    name: string,
    currentStatus: "active" | "inactive",
  ) => {
    try {
      const newStatus = currentStatus !== "active";
      await employeeService.updateEmployee(id, {
        isActive: newStatus,
      });

      message.success(
        newStatus
          ? t("dashboard.staff.modal.activate_success", {
              name,
              defaultValue: `${name} has been activated successfully`,
            })
          : t("dashboard.staff.modal.deactivate_success", {
              name,
              defaultValue: `${name} has been deactivated successfully`,
            }),
      );

      setStaffList((prev) =>
        prev.map((member) =>
          member.id === id
            ? {
                ...member,
                status: newStatus ? "active" : "inactive",
              }
            : member,
        ),
      );

      setTotalActive((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
      setTotalInactive((prev) =>
        newStatus ? Math.max(0, prev - 1) : prev + 1,
      );
    } catch {
      message.error(t("dashboard.staff.errors.update_failed"));
    }
  };

  // Build pagination page numbers array
  const buildPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8">
        {loading && <ContentAreaLoader />}
        {!loading && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{ color: "var(--text)" }}>
                  {t("dashboard.staff.title")}
                </h2>
                <p style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.staff.subtitle")}
                </p>
              </div>
              <Link href="/admin/staff/new">
                <button
                  className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                  style={{ background: "var(--primary)", color: "white" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(to right, #B32607)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "linear-gradient(to right, var(--primary))")
                  }
                  suppressHydrationWarning>
                  <svg
                    className="w-5 h-5 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {t("dashboard.staff.add_staff")}
                </button>
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              </div>
              <DropDown
                containerClassName="sm:w-48"
                value={filterRole}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilterRole(e.target.value);
                }}
                className="py-3 font-medium">
                <option value="all">{t("dashboard.staff.all_roles")}</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </DropDown>
            </div>

            {/* Stats — totalCount từ API metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.stats.total_staff")}
                    </p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                      {totalCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.stats.on_duty")}
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                      {totalActive}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(255, 56, 11, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.stats.inactive")}
                    </p>
                    <p
                      className="text-3xl font-bold mt-1"
                      style={{ color: "var(--primary)" }}>
                      {totalInactive}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--primary-soft)" }}>
                    <svg
                      className="w-6 h-6"
                      style={{ color: "var(--primary)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.stats.positions")}
                    </p>
                    <p className="text-3xl font-bold text-purple-500 mt-1">
                      {totalPositions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl overflow-hidden transition-all group"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--primary-border)",
                  }}>
                  <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--primary)]">
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `<div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style="background: var(--primary)">${member.name.charAt(0).toUpperCase()}</div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                            style={{ background: "var(--primary)" }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3
                            className="text-lg font-bold"
                            style={{ color: "var(--text)" }}>
                            {member.name}
                          </h3>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium mt-1 ${
                              member.role === "Manager"
                                ? "bg-purple-500/10 text-purple-500"
                                : member.role === "Staff"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-gray-500/10 text-gray-500"
                            }`}>
                            {t(
                              `dashboard.staff.roles.${member.role.toLowerCase()}`,
                            )}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          member.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-gray-500/10 text-gray-500"
                        }`}>
                        {member.status === "active"
                          ? t("dashboard.staff.status.active")
                          : t("dashboard.staff.status.inactive")}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-4">
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>

                    {/* Employee Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                          <p
                            className="text-xs mb-1"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.staff.employee_code")}
                          </p>
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--text)" }}>
                            {member.code || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs mb-1"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.staff.hire_date")}
                          </p>
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--text)" }}>
                            {new Date(member.joinDate).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <StatusToggle
                        checked={member.status === "active"}
                        onChange={() =>
                          handleToggleStatus(
                            member.id,
                            member.name,
                            member.status,
                          )
                        }
                        ariaLabel={
                          member.status === "active"
                            ? t("dashboard.staff.deactivate")
                            : t("dashboard.staff.activate")
                        }
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/staff/${member.id}`}
                        className="flex-1 py-2.5 rounded-lg transition-all font-medium text-sm text-center flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: "var(--primary-soft)",
                          color: "var(--primary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--primary)";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--primary-soft)";
                          e.currentTarget.style.color = "var(--primary)";
                        }}>
                        {t("dashboard.staff.view_profile")}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {staffList.length === 0 && !loading && (
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--text)" }}>
                  {t("dashboard.staff.no_staff_found")}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.staff.try_adjusting_filters")}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("common.showing", {
                    from: (currentPage - 1) * PAGE_SIZE + 1,
                    to: Math.min(currentPage * PAGE_SIZE, totalCount),
                    total: totalCount,
                    defaultValue: `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount}`,
                  })}
                </p>
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {buildPageNumbers().map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-9 h-9 flex items-center justify-center text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p as number)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all"
                        style={
                          currentPage === p
                            ? {
                                background: "var(--primary)",
                                color: "white",
                                border: "1px solid var(--primary)",
                              }
                            : {
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                              }
                        }>
                        {p}
                      </button>
                    ),
                  )}

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
