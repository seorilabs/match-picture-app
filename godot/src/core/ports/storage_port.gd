class_name MpStoragePort
extends RefCounted
## 세이브 저장소 추상. 코어는 파일 경로도 저장 매체도 모른다.
##
## 구현체는 src/platform/ 에만 둔다. 앱인토스 WebView 의 user:// 는 IndexedDB 라
## 브라우저 저장소가 비워지면 사라질 수 있는데, 그때 AIT Storage 미러링으로 갈아끼우는
## 자리가 여기다.


## 저장된 내용을 읽는다. 없거나 손상됐으면 빈 Dictionary 를 돌려준다.
func read() -> Dictionary:
	return {}


## 전부 덮어쓴다. 성공 여부를 돌려주고, 실패를 조용히 삼키지 않는다.
func write(data: Dictionary) -> bool:
	return false
