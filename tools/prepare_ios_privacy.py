#!/usr/bin/env python3
"""공식 해시를 확인한 iOS 의존성과 같은 Godot 버전으로 ATT/UMP bridge를 준비한다."""
import argparse
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = "4.7.2-stable"
GODOT_SHA = "ed1daf0bf001b61586d9930840f2f1394092c079"
ADMOB_URL = "https://github.com/poingstudios/godot-admob-plugin/releases/download/v5.1.0/ios-template-v4.7.2.zip"
ADMOB_SHA = "6e7f1c807761f9c0ad45d335ac4c74acd4bba7a31f9e1c7cd16a5220010cce71"
UMP_URL = "https://dl.google.com/googleadmobadssdk/90fe6bf3b0f4ce0d/googleusermessagingplatformios-spm-3.1.0.zip"
UMP_SHA = "90fe6bf3b0f4ce0d0199628c0871de58b6f673375148b98d52348aecc86db231"
CACHE = Path(os.environ.get("MP_IOS_PRIVACY_CACHE", Path.home() / ".cache/seorilabs/match-picture-app/ios-privacy"))


def run(*args, **kwargs):
    subprocess.run([str(a) for a in args], check=True, **kwargs)


def fetch(name, url, digest):
    path = CACHE / name
    if not path.is_file():
        with tempfile.NamedTemporaryFile(dir=CACHE, delete=False) as tmp:
            tmp_path = Path(tmp.name)
            with urllib.request.urlopen(url, timeout=120) as response:
                shutil.copyfileobj(response, tmp)
        if hashlib.sha256(tmp_path.read_bytes()).hexdigest() != digest:
            tmp_path.unlink()
            raise RuntimeError(f"공식 배포물 해시 불일치: {name}")
        tmp_path.replace(path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise RuntimeError(f"캐시 해시 불일치: {name}")
    return path


def extract(archive, dest):
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            target = dest / info.filename
            if not target.resolve().is_relative_to(dest.resolve()):
                raise RuntimeError("zip 경로가 대상 밖으로 나간다")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                payload = z.read(info)
                if not target.is_file() or target.read_bytes() != payload:
                    target.write_bytes(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dependencies-only", action="store_true")
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = ROOT / "godot/addons/admob/ios/bin"
    extract(fetch("ios-template-v4.7.2.zip", ADMOB_URL, ADMOB_SHA), dest)
    (dest / "package.gd").write_text('const VERSION := "v5.1.0"\n')
    print("[ios-privacy] Poing 5.1.0 / Godot 4.7.2 공식 payload 해시 확인")
    if args.dependencies_only:
        return
    extract(fetch("ump-3.1.0.zip", UMP_URL, UMP_SHA), CACHE / "ump")
    source = Path(os.environ.get("MP_GODOT_SOURCE", CACHE / "godot-4.7.2"))
    if not source.exists():
        run("git", "clone", "--depth", "1", "--branch", VERSION,
            "https://github.com/godotengine/godot.git", source)
    observed = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    if observed != GODOT_SHA or subprocess.check_output(["git", "-C", str(source), "diff", "HEAD"], text=True):
        raise RuntimeError("Godot 헤더가 검증한 4.7.2 소스와 다르다")
    scons = shutil.which("scons")
    if scons is None:
        venv = CACHE / "scons-venv"
        if not (venv / "bin/scons").is_file():
            run("python3", "-m", "venv", venv)
            run(venv / "bin/pip", "install", "SCons==4.10.1")
        scons = str(venv / "bin/scons")
    run(scons, "platform=ios", "target=template_release", "arch=arm64", "core/object/gdvirtual.gen.h", cwd=source)
    sdk = subprocess.check_output(["xcrun", "--sdk", "iphoneos", "--show-sdk-path"], text=True).strip()
    framework = CACHE / "ump/UserMessagingPlatform.xcframework/ios-arm64"
    output = ROOT / "godot/ios/plugins/ad_privacy"
    with tempfile.TemporaryDirectory(prefix="mp-ios-privacy-") as build:
        for target in ("debug", "release"):
            obj = Path(build) / f"ad_privacy.{target}.o"
            flags = ["-DDEBUG_ENABLED"] if target == "debug" else []
            run("xcrun", "--sdk", "iphoneos", "clang++", "-c", "-std=c++17", "-arch", "arm64",
                "-isysroot", sdk, "-miphoneos-version-min=15.0", "-fobjc-arc", "-fmodules", "-fcxx-modules",
                "-DUNIX_ENABLED", "-DIOS_ENABLED", "-DAPPLE_EMBEDDED_ENABLED", "-DNDEBUG", *flags,
                "-I", source, "-I", source / "platform/ios", "-I", source / "platform/apple_embedded", "-F", framework, "-O2", ROOT / "platform/ios/ad_privacy/ad_privacy.mm", "-o", obj)
            run("xcrun", "libtool", "-static", "-o", output / f"libmatch_ad_privacy.{target}.a", obj)
    print("[ios-privacy] ATT/UMP bridge debug/release arm64 빌드 완료")


if __name__ == "__main__":
    main()
