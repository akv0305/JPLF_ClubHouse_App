"use client";

import { Modal } from "@/components/ui/Modal";
import { RejectForm } from "./RejectForm";
import type { ActionBooking } from "@/app/rep/types";

export function RejectBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: ActionBooking;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  return (
    <Modal open onClose={onClose} title="Reject request">
      <RejectForm booking={booking} onSuccess={onSuccess} onCancel={onClose} />
    </Modal>
  );
}
