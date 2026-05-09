import { Modal } from "./Modal";

interface ResultModalProps {
  open: boolean;
  seconds: number | null;
  onRetry: () => void;
  onShare: () => void;
  /** 공유 기능 지원 여부. 미지원 환경에서는 버튼 자체를 숨깁니다. */
  shareSupported: boolean;
}

/** Unity의 `UIGameResultPopup`을 옮긴 결과 화면입니다. */
export function ResultModal({
  open,
  seconds,
  onRetry,
  onShare,
  shareSupported,
}: ResultModalProps) {
  return (
    <Modal open={open} variant="result">
      <h2 className="modal-title">완료!</h2>
      <p className="modal-result-time">
        <span className="result-seconds">{seconds ?? 0}</span>
        <span className="result-seconds-suffix">초</span>
      </p>
      <p className="modal-body">기록이 짧을수록 좋아요. 다시 도전해 볼까요?</p>
      <div className="modal-actions">
        <button
          type="button"
          className="modal-button primary"
          onClick={onRetry}
        >
          다시 하기
        </button>
        {shareSupported ? (
          <button
            type="button"
            className="modal-button ghost"
            onClick={onShare}
          >
            기록 공유하기
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
