class_name MpAitInterstitialAds
extends MpInterstitialAdPort
## 앱인토스 전면광고. 래퍼가 SDK 를 다루고 여기서는 창구만 부른다.


func is_available() -> bool:
	return Platform.ait_bridge() != null


func show() -> bool:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return false
	return bool(bridge.showInterstitial())
