#!/usr/bin/env python3
"""Upload or promote a Google Play release through the Android Publisher API."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path

import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
CONFIG_PATH = Path("play-store/google-play.config.json")


def load_credentials():
    raw = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")
    encoded = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64")
    path = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_FILE")
    if raw:
        return service_account.Credentials.from_service_account_info(
            json.loads(raw), scopes=SCOPES
        )
    if encoded:
        return service_account.Credentials.from_service_account_info(
            json.loads(base64.b64decode(encoded)), scopes=SCOPES
        )
    if path and Path(path).exists():
        return service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
    credentials, _ = google.auth.default(scopes=SCOPES)
    return credentials


def package_name() -> str:
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    value = data.get("packageName")
    if not value:
        sys.exit(f"packageName missing in {CONFIG_PATH}")
    return str(value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--aab-path")
    parser.add_argument("--release-name", required=True)
    parser.add_argument(
        "--release-status",
        default="completed",
        choices=["draft", "inProgress", "halted", "completed"],
    )
    parser.add_argument("--track", default="internal")
    parser.add_argument("--changes-not-sent-for-review", action="store_true")
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--promote-from-track", default="internal")
    parser.add_argument("--promote-to-track", default="production")
    # 승격 대상 build는 릴리즈 태그가 정한 versionCode 하나다. 트랙의 최신 build를 쓰지 않는다.
    parser.add_argument("--promote-version-code", type=int)
    parser.add_argument("--rollout", type=float)
    parser.add_argument(
        "--release-notes-json",
        default=os.environ.get("RELEASE_NOTES_JSON") or None,
    )
    return parser.parse_args()


def release_notes(
    edits, app_id: str, edit_id: str, path: str | None
) -> list[dict[str, str]]:
    if not path or not Path(path).exists():
        return []
    document = json.loads(Path(path).read_text(encoding="utf-8"))
    notes = document.get("notes", {}) if isinstance(document, dict) else {}
    try:
        listings = (
            edits.listings().list(packageName=app_id, editId=edit_id).execute()
        )
        languages = {
            item.get("language")
            for item in listings.get("listings", [])
            if item.get("language")
        }
    except Exception as error:
        print(f"Warning: failed to list store languages: {error}", file=sys.stderr)
        languages = set()
    return [
        {"language": language, "text": text}
        for language, text in notes.items()
        if isinstance(language, str)
        and isinstance(text, str)
        and text.strip()
        and (not languages or language in languages)
    ]


def promote(edits, app_id: str, args: argparse.Namespace) -> None:
    edit_id = edits.insert(packageName=app_id, body={}).execute()["id"]
    try:
        source = (
            edits.tracks()
            .get(
                packageName=app_id,
                editId=edit_id,
                track=args.promote_from_track,
            )
            .execute()
        )
        codes = {
            int(code)
            for release in source.get("releases", [])
            for code in release.get("versionCodes", [])
        }
        if not codes:
            sys.exit(f"No versionCode on {args.promote_from_track}")
        version_code = args.promote_version_code
        if version_code is None:
            sys.exit("--promote-version-code is required: the release tag decides the build")
        if version_code not in codes:
            sys.exit(
                f"versionCode {version_code} is not on {args.promote_from_track}: "
                f"{sorted(codes)}"
            )
        release = {
            "name": args.release_name,
            "versionCodes": [str(version_code)],
            "status": args.release_status,
        }
        notes = release_notes(edits, app_id, edit_id, args.release_notes_json)
        if notes:
            release["releaseNotes"] = notes
        if args.rollout is not None:
            if not 0 < args.rollout <= 1:
                sys.exit("--rollout must be in (0, 1]")
            release["status"] = "inProgress"
            release["userFraction"] = args.rollout
        (
            edits.tracks()
            .update(
                packageName=app_id,
                editId=edit_id,
                track=args.promote_to_track,
                body={"track": args.promote_to_track, "releases": [release]},
            )
            .execute()
        )
        edits.commit(packageName=app_id, editId=edit_id).execute()
        print(
            f"Promoted {args.promote_from_track}->{args.promote_to_track}: "
            f"versionCode={version_code} status={release['status']}"
        )
    except Exception:
        try:
            edits.delete(packageName=app_id, editId=edit_id).execute()
        except Exception:
            pass
        raise


def upload(edits, app_id: str, args: argparse.Namespace) -> None:
    if not args.aab_path or not Path(args.aab_path).exists():
        sys.exit("--aab-path must point to an existing AAB")
    edit_id = edits.insert(packageName=app_id, body={}).execute()["id"]
    media = MediaFileUpload(
        args.aab_path, mimetype="application/octet-stream", resumable=True
    )
    bundle = (
        edits.bundles()
        .upload(packageName=app_id, editId=edit_id, media_body=media)
        .execute()
    )
    release = {
        "name": args.release_name,
        "status": args.release_status,
        "versionCodes": [str(bundle["versionCode"])],
    }
    notes = release_notes(edits, app_id, edit_id, args.release_notes_json)
    if notes:
        release["releaseNotes"] = notes
    (
        edits.tracks()
        .update(
            packageName=app_id,
            editId=edit_id,
            track=args.track,
            body={"track": args.track, "releases": [release]},
        )
        .execute()
    )
    edits.commit(
        packageName=app_id,
        editId=edit_id,
        changesNotSentForReview=args.changes_not_sent_for_review,
    ).execute()
    print(
        f"Uploaded versionCode={bundle['versionCode']} "
        f"track={args.track} status={args.release_status}"
    )


def main() -> None:
    args = parse_args()
    service = build(
        "androidpublisher",
        "v3",
        credentials=load_credentials(),
        cache_discovery=False,
    )
    edits = service.edits()
    if args.promote:
        promote(edits, package_name(), args)
    else:
        upload(edits, package_name(), args)


if __name__ == "__main__":
    main()
