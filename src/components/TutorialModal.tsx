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
      <h2 className="modal-title">같은 그림을 찾아주세요</h2>
      <p className="modal-body">
        위/아래 두 카드 사이에는 같은 그림이 정확히 한 개 있어요.
        아래 카드에서 같은 그림을 빠르게 찾아 눌러주세요.
      </p>
      <ul className="modal-list">
        <li>맞히면 다음 카드로 넘어가요.</li>
        <li>틀리면 잠시 입력이 잠겨요.</li>
        <li>모든 카드를 마치는 데 걸린 시간이 기록돼요.</li>
      </ul>
      <button
        type="button"
        className="modal-button primary"
        onClick={onClose}
      >
        시작하기
      </button>
    </Modal>
  );
}
