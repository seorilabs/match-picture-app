import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  /** 모달 식별자 (테스트용 dataset). */
  variant: string;
  children: ReactNode;
  /** 백드롭 클릭으로 닫을 수 있는지. 기본값 false (게임 흐름이 명시 액션을 요구). */
  dismissOnBackdrop?: boolean;
  onDismiss?: () => void;
}

/**
 * 가벼운 모달 래퍼입니다. 별도의 라이브러리를 끌어오지 않고, 게임에 필요한 단일
 * 활성 모달 흐름만 다룹니다.
 */
export function Modal({
  open,
  variant,
  children,
  dismissOnBackdrop = false,
  onDismiss,
}: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      data-modal={variant}
      onClick={() => {
        if (dismissOnBackdrop) onDismiss?.();
      }}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
