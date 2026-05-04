"use client";

import ReservationDetailsView from "@/components/reservation/ReservationDetailsView";
import { useParams } from "next/navigation";

export default function AdminReservationDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const reservationId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  return <ReservationDetailsView reservationId={reservationId} mode="admin" />;
}