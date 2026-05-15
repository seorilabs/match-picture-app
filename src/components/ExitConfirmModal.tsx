import { Modal } from "./Modal";

interface ExitConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExitConfirmModal({
  open,
  onCancel,
  onConfirm,
}: ExitConfirmModalProps) {
  return (
    <Modal
      open={open}
      variant="exit-confirm"
      dismissOnBackdrop
      onDismiss={onCancel}
    >
      <div className="confirm-panel">
        <div className="confirm-title">EXIT?</div>
        <button type="button" className="result-button" onClick={onCancel}>
          CANCEL
        </button>
        <button type="button" className="result-button" onClick={onConfirm}>
          EXIT
        </button>
      </div>
    </Modal>
  );
}
