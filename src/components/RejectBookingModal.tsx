"use client";

import { Modal } from "@/components/ui/Modal";
import { RejectForm } from "./RejectForm";
import type { RepRow } from "@/app/rep/types";

export function RejectBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: RepRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  return (
    <Modal open onClose={onClose} title="Reject request">
      <RejectForm booking={booking} onSuccess={onSuccess} onCancel={onClose} />
    </Modal>
  );
}
