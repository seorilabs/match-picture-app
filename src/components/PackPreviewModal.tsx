import { Modal } from "./Modal";
import { useI18n } from "../i18n/i18nContext";
import { SYMBOL_IDS, symbolSrc, type SymbolPack } from "../symbols/packs";

interface PackPreviewModalProps {
  /** 미리볼 팩. null이면 닫힌 상태. */
  pack: SymbolPack | null;
  onClose: () => void;
}

/** 선택한 팩의 전체 심볼(57개)을 그리드로 보여주는 미리보기 모달. */
export function PackPreviewModal({ pack, onClose }: PackPreviewModalProps) {
  const { t } = useI18n();
  return (
    <Modal
      open={pack !== null}
      variant="pack-preview"
      dismissOnBackdrop
      onDismiss={onClose}
    >
      {pack ? (
        <div className="pack-preview">
          <div className="pack-preview-head">
            <strong className="pack-preview-title">
              {t(`pack.${pack.id}.label`)}
            </strong>
            <span className="pack-preview-desc">
              {t(`pack.${pack.id}.desc`)}
            </span>
          </div>
          <div className="pack-preview-grid">
            {SYMBOL_IDS.map((id) => (
              <img
                key={id}
                className="pack-preview-cell"
                src={symbolSrc(pack, id)}
                alt=""
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
          <button type="button" className="result-button" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
