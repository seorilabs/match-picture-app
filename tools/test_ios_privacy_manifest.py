"""Apple TN3181과 고정 SDK 선언을 실제 매니페스트 검사에 대조한다."""
import copy
import json
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
import unittest

import finish_ios_privacy as privacy

ROOT = Path(__file__).resolve().parents[1]
DOMAINS = ["googleads.g.doubleclick.net", "pagead2.googlesyndication.com"]


class PrivacyManifestTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.app = Path(self.directory.name) / "Fixture.app"
        self.app.mkdir()
        self.expected = json.loads((ROOT / "app-store/releases/1.1.7/sdk-privacy-manifests.json").read_text())
        self.root = {
            "NSPrivacyTracking": True,
            "NSPrivacyTrackingDomains": DOMAINS,
            "NSPrivacyCollectedDataTypes": copy.deepcopy(privacy.ROOT_COLLECTION),
            "NSPrivacyAccessedAPITypes": [
                {"NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp", "NSPrivacyAccessedAPITypeReasons": ["DDA9.1", "C617.1"]},
                {"NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime", "NSPrivacyAccessedAPITypeReasons": ["35F9.1"]},
                {"NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace", "NSPrivacyAccessedAPITypeReasons": ["E174.1", "85F4.1"]},
            ],
        }
        for sdk in self.expected["manifests"]:
            path = self.app / "Frameworks" / Path(sdk["manifestPath"]).parent.name / "PrivacyInfo.xcprivacy"
            path.parent.mkdir(parents=True)
            path.write_bytes(plistlib.dumps(sdk["declaration"]))

    def check(self, manifest):
        (self.app / "PrivacyInfo.xcprivacy").write_bytes(plistlib.dumps(manifest))
        return privacy.check_manifests(self.app, self.expected)

    def test_approved_tracking_domains_and_exact_sdk_manifests_are_accepted(self):
        self.assertEqual(self.check(self.root), 3)

    def test_tracking_with_empty_domains_is_rejected(self):
        self.root["NSPrivacyTrackingDomains"] = []
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_tracking_without_domains_is_rejected(self):
        del self.root["NSPrivacyTrackingDomains"]
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_tracking_key_must_be_a_boolean(self):
        for value in ["true", 1, [], {}]:
            with self.subTest(value=value), self.assertRaises(RuntimeError):
                self.check({**self.root, "NSPrivacyTracking": value})

    def test_nontracking_with_domains_is_rejected(self):
        with self.assertRaises(RuntimeError):
            self.check({**self.root, "NSPrivacyTracking": False})

    def test_domains_must_be_a_nonempty_string_array(self):
        for value in ["googleads.g.doubleclick.net", {}, [1], [True], [""]]:
            with self.subTest(value=value), self.assertRaises(RuntimeError):
                self.check({**self.root, "NSPrivacyTrackingDomains": value})

    def test_invalid_or_unreviewed_domains_are_rejected(self):
        for value in ["https://googleads.g.doubleclick.net", "googleads.g.doubleclick.net/", "googleads.g.doubleclick.net?a=1", "googleads.g.doubleclick.net:443", "*.doubleclick.net", " googleads.g.doubleclick.net", "googleads..g.doubleclick.net", "-googleads.g.doubleclick.net", "googleads.g.doubleclick.net.", "127.0.0.1", "other.example.com"]:
            with self.subTest(value=value), self.assertRaises(RuntimeError):
                self.check({**self.root, "NSPrivacyTrackingDomains": [value, DOMAINS[1]]})

    def test_duplicate_missing_or_added_domains_are_rejected(self):
        for domains in [[DOMAINS[0], DOMAINS[0]], [DOMAINS[0]], DOMAINS + ["other.example.com"]]:
            with self.subTest(domains=domains), self.assertRaises(RuntimeError):
                self.check({**self.root, "NSPrivacyTrackingDomains": domains})

    def test_root_collection_tampering_is_rejected(self):
        changed = copy.deepcopy(self.root)
        changed["NSPrivacyCollectedDataTypes"][0]["NSPrivacyCollectedDataTypeTracking"] = True
        with self.assertRaises(RuntimeError):
            self.check(changed)

    def test_root_accessed_api_tampering_or_missing_is_rejected(self):
        for mode in ["missing", "empty", "reason", "extra"]:
            changed = copy.deepcopy(self.root)
            if mode == "missing":
                del changed["NSPrivacyAccessedAPITypes"]
            elif mode == "empty":
                changed["NSPrivacyAccessedAPITypes"] = []
            elif mode == "reason":
                changed["NSPrivacyAccessedAPITypes"][0]["NSPrivacyAccessedAPITypeReasons"] = ["INVALID.1"]
            else:
                changed["UnreviewedRootKey"] = "unreviewed"
            with self.subTest(mode=mode), self.assertRaises(RuntimeError):
                self.check(changed)

    def test_root_collection_boolean_cannot_be_an_integer(self):
        changed = copy.deepcopy(self.root)
        changed["NSPrivacyCollectedDataTypes"][0]["NSPrivacyCollectedDataTypeLinked"] = 1
        with self.assertRaises(RuntimeError):
            self.check(changed)

    def test_sdk_collection_boolean_cannot_be_an_integer(self):
        path = next((self.app / "Frameworks").rglob("PrivacyInfo.xcprivacy"))
        declaration = plistlib.loads(path.read_bytes())
        declaration["NSPrivacyCollectedDataTypes"][0]["NSPrivacyCollectedDataTypeLinked"] = int(declaration["NSPrivacyCollectedDataTypes"][0]["NSPrivacyCollectedDataTypeLinked"])
        path.write_bytes(plistlib.dumps(declaration))
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_missing_sdk_manifest_is_rejected(self):
        path = next((self.app / "Frameworks").rglob("PrivacyInfo.xcprivacy"))
        path.unlink()
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_unexpected_sdk_manifest_is_rejected(self):
        path = self.app / "Frameworks/Unknown.framework/PrivacyInfo.xcprivacy"
        path.parent.mkdir()
        path.write_bytes(plistlib.dumps({}))
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_sdk_collection_tampering_is_rejected(self):
        path = next((self.app / "Frameworks").rglob("PrivacyInfo.xcprivacy"))
        manifest = plistlib.loads(path.read_bytes())
        manifest["NSPrivacyCollectedDataTypes"] = []
        path.write_bytes(plistlib.dumps(manifest))
        with self.assertRaises(RuntimeError):
            self.check(self.root)

    def test_actual_godot_configfile_reads_the_tracking_preset(self):
        godot = shutil.which("godot")
        self.assertIsNotNone(godot, "Godot 실행 파일이 필요하다; ConfigFile 검수를 생략하지 않는다")
        isolated = Path(self.directory.name)
        (isolated / "project.godot").write_text("config_version=5\n")
        shutil.copyfile(ROOT / "godot/export_presets.cfg", isolated / "export_presets.cfg")
        script = isolated / "preset_check.gd"
        script.write_text('''extends SceneTree
func _initialize() -> void:
    var config := ConfigFile.new()
    if config.load("res://export_presets.cfg") != OK:
        quit(1)
        return
    var enabled: Variant = config.get_value("preset.2.options", "privacy/tracking_enabled", false)
    var domains: Variant = config.get_value("preset.2.options", "privacy/tracking_domains", PackedStringArray())
    if enabled != true or domains != PackedStringArray(["googleads.g.doubleclick.net", "pagead2.googlesyndication.com"]):
        print("[tracking-preset] INVALID enabled=", enabled, " domains=", domains)
        quit(1)
        return
    print("[tracking-preset] VERIFIED")
    quit(0)
''')
        result = subprocess.run([godot, "--headless", "--path", str(isolated), "--script", str(script)], text=True, capture_output=True, timeout=30)
        output = result.stdout + result.stderr
        self.assertEqual(result.returncode, 0, output)
        self.assertIn("[tracking-preset] VERIFIED", output)
        self.assertNotRegex(output, r"SCRIPT ERROR|Parse Error|ERROR:")


if __name__ == "__main__":
    unittest.main()
