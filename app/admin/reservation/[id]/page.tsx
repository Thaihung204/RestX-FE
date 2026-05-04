"use client";

import ReservationDetailsModal from "@/components/admin/reservations/ReservationDetailsModal";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AdminReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const reservationId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  return (
    <ReservationDetailsModal
      reservationId={reservationId}
      onClose={() => router.back()}
      onStatusUpdated={() => router.refresh()}
    />
  );
}
