"use client";

import KPISection from "@/components/admin/KPISection";
import OrdersBarChart from "@/components/admin/charts/OrdersBarChart";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import ReservationList from "@/components/admin/reservations/ReservationList";
import reservationService, { PaginatedReservations } from "@/lib/services/reservationService";
import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
  const [reservationData, setReservationData] = useState<PaginatedReservations | null>(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [reservationPage, setReservationPage] = useState(1);

  const fetchReservations = useCallback(async () => {
    setReservationLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: reservationPage,
        pageSize: 5,
        sortBy: "reservationDateTime",
        sortDescending: false,
      });
      setReservationData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setReservationLoading(false);
    }
  }, [reservationPage]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
    <main
      className="flex-1 p-6 lg:p-8"
      style={{ background: "var(--bg-base)", color: "var(--text)" }}
    >
      <div className="space-y-6">
        <section>
          <KPISection />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <OrdersBarChart />
        </section>

        <section>
          <ReservationList
            data={reservationData}
            loading={reservationLoading}
            setPage={setReservationPage}
            onStatusUpdated={fetchReservations}
          />
        </section>
      </div>
    </main>
  );
}
