"use client";

import CustomerReservationDetailsView from "@/components/customer/ReservationDetailsView";

interface ReservationDetailsViewProps {
  reservationId: string;
  mode: "admin" | "customer";
}

export default function ReservationDetailsView(props: ReservationDetailsViewProps) {
  return <CustomerReservationDetailsView {...props} />;
}
