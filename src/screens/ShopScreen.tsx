import { useState } from "react";

import {
  PREVIEW_SYMBOL_IDS,
  SYMBOL_PACKS,
  symbolSrc,
  type SymbolPack,
} from "../symbols/packs";
import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { trackEvent } from "../firebase/analytics";
import { CoinBadge } from "../components/CoinBadge";
import { PackPreviewModal } from "../components/PackPreviewModal";

export function ShopScreen() {
  const { profile, ownsPack, buyPack, equip } = useProfile();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [previewPack, setPreviewPack] = useState<SymbolPack | null>(null);

  const handleBuy = (pack: SymbolPack) => {
    const result = buyPack(pack.id);
    if (result.ok) {
      equip(pack.id);
      void trackEvent("pack_unlock", { pack: pack.id, price: pack.price });
      setMessage(t("shop.bought", { name: t(`pack.${pack.id}.label`) }));
    } else if (result.reason === "not-enough-coins") {
      setMessage(t("shop.notEnough"));
    } else {
      setMessage(null);
    }
  };

  return (
    <div className="screen shop-screen">
      <header className="screen-header">
        <h1 className="screen-title">{t("shop.title")}</h1>
        <CoinBadge coins={profile.coins} />
      </header>

      <p className="screen-subtitle">{t("shop.subtitle")}</p>

      {message ? <p className="shop-message">{message}</p> : null}

      <ul className="pack-list">
        {SYMBOL_PACKS.map((pack) => {
          const owned = ownsPack(pack.id);
          const equipped = profile.equippedPackId === pack.id;
          return (
            <li key={pack.id} className="pack-card">
              <div className="pack-card-top">
                <div className="pack-card-info">
                  <span className="pack-card-label">
                    {t(`pack.${pack.id}.label`)}
                  </span>
                  <span className="pack-card-desc">
                    {t(`pack.${pack.id}.desc`)}
                  </span>
                </div>

                {equipped ? (
                  <button
                    type="button"
                    className="pack-button is-equipped"
                    disabled
                  >
                    {t("shop.equipped")}
                  </button>
                ) : owned ? (
                  <button
                    type="button"
                    className="pack-button"
                    onClick={() => equip(pack.id)}
                  >
                    {t("shop.use")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pack-button is-buy"
                    disabled={profile.coins < pack.price}
                    onClick={() => handleBuy(pack)}
                  >
                    🪙 {pack.price.toLocaleString()}
                  </button>
                )}
              </div>

              <button
                type="button"
                className="pack-preview-strip"
                onClick={() => setPreviewPack(pack)}
                aria-label={t("shop.previewAria", {
                  name: t(`pack.${pack.id}.label`),
                })}
              >
                {PREVIEW_SYMBOL_IDS.map((id) => (
                  <img
                    key={id}
                    className="pack-preview-thumb"
                    src={symbolSrc(pack, id)}
                    alt=""
                    draggable={false}
                  />
                ))}
                <span className="pack-preview-more" aria-hidden="true">
                  {t("shop.previewMore")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <PackPreviewModal pack={previewPack} onClose={() => setPreviewPack(null)} />
    </div>
  );
}
