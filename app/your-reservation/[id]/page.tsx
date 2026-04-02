"use client";

import ReservationDetailsView from "@/components/customer/ReservationDetailsView";
import { useParams } from "next/navigation";

export default function CustomerReservationDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const reservationId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  return <ReservationDetailsView reservationId={reservationId} mode="customer" />;
}
