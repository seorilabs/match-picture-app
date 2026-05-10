import { Modal } from "./Modal";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 최초 1회 노출되는 튜토리얼 모달입니다.
 * Unity의 `UITutorialPanel`은 PlayerPrefs `HasPlayed` 키 한 개만 사용했고, 텍스트 자체는
 * 씬 안에 박혀 있었습니다. 여기서는 핵심 규칙을 짧게 알려주는 텍스트로 옮깁니다.
 */
export function TutorialModal({ open, onClose }: TutorialModalProps) {
  return (
    <Modal open={open} variant="tutorial">
      <h2 className="modal-title">같은 그림 찾기</h2>
      <p className="modal-body">
        두 카드에 공통 그림이 하나 있어요. 아래 카드에서 찾아 누르세요.
        오답은 잠시 잠기고, 기록은 클리어 시간으로 남아요.
      </p>
      <button
        type="button"
        className="modal-button primary"
        onClick={onClose}
      >
        시작
      </button>
    </Modal>
  );
}
