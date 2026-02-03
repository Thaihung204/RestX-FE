"use client";

import { useToast } from "@/lib/contexts/ToastContext";
import employeeService from "@/lib/services/employeeService";
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
}

export default function StaffPage() {
  const { t } = useTranslation(["common", "dashboard"]);
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const roles = ["Manager", "Waiter", "Chef", "Cashier"];

  const fetchStaffList = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await employeeService.getEmployees({
        page: 1,
        itemsPerPage: 100,
      });

      // Extract array from response
      const arrayData =
        data.data?.employees ||
        data.data?.data ||
        data.data?.items ||
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
        }));

        setStaffList(mappedData);
        setError(null);
      } else {
        setError("Data structure not supported");
      }
    } catch (err: any) {
      if (err.response) {
        const msg = `API Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`;
        setError(msg);
        showToast(
          "error",
          t("dashboard.toasts.staff.load_error_title"),
          msg || t("dashboard.toasts.staff.load_error_message"),
        );
      } else if (err.request) {
        const msg = t("dashboard.toasts.staff.load_error_message");
        setError(msg);
        showToast(
          "error",
          t("dashboard.toasts.staff.load_network_error_title"),
          msg,
        );
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : t("dashboard.toasts.staff.load_error_message");
        setError(msg);
        showToast(
          "error",
          t("dashboard.toasts.staff.load_error_title"),
          msg,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    setItemToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      // Soft delete: set isActive = false instead of hard delete
      await employeeService.updateEmployee(itemToDelete.id, {
        isActive: false,
      });
      showToast(
        "success",
        t("dashboard.toasts.staff.deactivated_title"),
        t("dashboard.toasts.staff.deactivated_message"),
      );
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await fetchStaffList();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || "Unknown error";
      showToast(
        "error",
        t("dashboard.toasts.staff.action_failed_title"),
        errorMsg,
      );
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      staff.role === filterRole ||
      staff.position === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
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
            <Link
              href="/admin/staff/new"
              className="px-6 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg flex items-center gap-2"
              style={{ background: "#FF380B" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#CC2D08")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#FF380B")
              }>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("dashboard.staff.add_staff")}
            </Link>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div className="relative sm:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer font-medium"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}>
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.staff.stats.total_staff")}
                  </p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">
                    {staffList.length}
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
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.staff.stats.on_duty")}
                  </p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {staffList.filter((s) => s.status === "active").length}
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
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Inactive
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "#FF380B" }}>
                    {staffList.filter((s) => s.status === "inactive").length}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255, 56, 11, 0.1)" }}>
                  <svg
                    className="w-6 h-6"
                    style={{ color: "#FF380B" }}
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
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Positions
                  </p>
                  <p className="text-3xl font-bold text-purple-500 mt-1">
                    {
                      new Set(staffList.map((s) => s.position).filter(Boolean))
                        .size
                    }
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
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="rounded-xl overflow-hidden transition-all group"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(255, 56, 11, 0.3)",
                }}>
                <div className="p-6">
                  {/* Profile Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                        style={{ background: "#FF380B" }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
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
                              : member.role === "Chef"
                                ? "bg-orange-500/10 text-orange-500"
                                : member.role === "Waiter"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-gray-500/10 text-gray-500"
                          }`}>
                          {t(
                            `dashboard.staff.roles.${member.role.toLowerCase()}`,
                          )}
                        </span>
                        {/* Role badge translated */}
                        <div className="flex items-center gap-2 mt-1">
                          {/* Removed duplicate/broken role badge code */}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        member.status === "active"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      }`}>
                      {member.status === "active" ? "Active" : "Inactive"}
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
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--text-muted)" }}>
                        Employee Code
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
                        Hire Date
                      </p>
                      <p
                        className="font-medium text-sm"
                        style={{ color: "var(--text)" }}>
                        {new Date(member.joinDate).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="flex-1 py-2.5 rounded-lg transition-all font-medium text-sm text-center flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "rgba(255, 56, 11, 0.1)",
                        color: "#FF380B",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FF380B";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 56, 11, 0.1)";
                        e.currentTarget.style.color = "#FF380B";
                      }}>
                      View Profile
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
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "rgb(239, 68, 68)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgb(239, 68, 68)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(239, 68, 68, 0.1)";
                        e.currentTarget.style.color = "rgb(239, 68, 68)";
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStaff.length === 0 && !loading && (
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
                No staff found
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 max-w-md w-full"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--text)" }}>
                  Deactivate Staff Member
                </h3>
                <p style={{ color: "var(--text-muted)" }}>
                  Are you sure you want to deactivate{" "}
                  <strong>{itemToDelete.name}</strong>? This will set their
                  status to inactive.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}>
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
