#!/usr/bin/env python3
"""Android Publisher API로 .aab를 트랙에 업로드한다.

업로드 키(SHA1)가 Play에 등록된 업로드 인증서와 다르면 bundles.upload 단계에서
거부되므로, 이 스크립트의 성공 자체가 서명 키 전략의 결정적 검증이 된다.

인증: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON / _BASE64 / _JSON_FILE → ADC 순으로 시도.
(전역 GOOGLE_APPLICATION_CREDENTIALS는 Play 권한이 없을 수 있어 사용하지 않는다.)
"""
import argparse
import base64
import json
import os
import sys

from google.oauth2 import service_account
import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]


def load_credentials():
    raw = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")
    b64 = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64")
    path = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_FILE")
    if raw:
        info = json.loads(raw)
        return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    if b64:
        info = json.loads(base64.b64decode(b64))
        return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    if path and os.path.exists(path):
        return service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
    creds, _ = google.auth.default(scopes=SCOPES)
    return creds


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--package", required=True)
    ap.add_argument("--aab", required=True)
    ap.add_argument("--track", default="internal")
    ap.add_argument("--status", default="draft",
                    choices=["draft", "completed", "inProgress", "halted"])
    ap.add_argument("--version-name", default=None)
    args = ap.parse_args()

    if not os.path.exists(args.aab):
        sys.exit(f"AAB 없음: {args.aab}")

    creds = load_credentials()
    service = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    edits = service.edits()

    edit_id = edits.insert(packageName=args.package, body={}).execute()["id"]
    print(f"edit 생성: {edit_id}")

    media = MediaFileUpload(args.aab, mimetype="application/octet-stream", resumable=True)
    bundle = edits.bundles().upload(
        packageName=args.package, editId=edit_id, media_body=media
    ).execute()
    version_code = bundle["versionCode"]
    print(f"번들 업로드 성공: versionCode={version_code}  (업로드 키 수락됨 ✅)")

    release = {"status": args.status, "versionCodes": [version_code]}
    if args.version_name:
        release["name"] = args.version_name
    edits.tracks().update(
        packageName=args.package, editId=edit_id, track=args.track,
        body={"track": args.track, "releases": [release]},
    ).execute()
    print(f"트랙 '{args.track}' 갱신: status={args.status}")

    edits.commit(packageName=args.package, editId=edit_id).execute()
    print(f"커밋 완료. Play Console > 테스트 > {args.track} 에서 확인 가능.")


if __name__ == "__main__":
    main()
