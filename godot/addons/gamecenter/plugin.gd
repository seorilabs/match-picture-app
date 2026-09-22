@tool
extends EditorPlugin

## bin 은 .gdignore 로 에디터 스캔에서 빼 둔다. 그래야 Linux 에디터가 iOS 전용
## GDExtension 을 현재 OS 용으로 열려다 ERROR 를 내지 않는다. iOS 내보낼 때 아래
## 훅이 원래 경로의 설명자와 XCFramework 를 다시 넣는다.
const RUNTIME_DESCRIPTOR_PATH := "res://addons/gamecenter/bin/gamecenter.gdextension"
const EXPORTED_DESCRIPTOR_PATH := "res://addons/gamecenter/gamecenter.gdextension"
const IOS_XCFRAMEWORK_PATH := "res://addons/gamecenter/bin/libgamecenter.ios.xcframework"
const ENTRY_SYMBOL := "gamecenter_library_init"

var ios_export_plugin: IosExportPlugin


func _enter_tree() -> void:
	ios_export_plugin = IosExportPlugin.new()
	add_export_plugin(ios_export_plugin)


func _exit_tree() -> void:
	remove_export_plugin(ios_export_plugin)
	ios_export_plugin = null


class IosExportPlugin extends EditorExportPlugin:
	func _supports_platform(platform: EditorExportPlatform) -> bool:
		return platform is EditorExportPlatformIOS


	func _get_name() -> String:
		return "GameCenterExport"


	func _export_begin(
		_features: PackedStringArray,
		_is_debug: bool,
		_path: String,
		_flags: int,
	) -> void:
		if not _supports_platform(get_export_platform()):
			return
		var descriptor := FileAccess.get_file_as_bytes(RUNTIME_DESCRIPTOR_PATH)
		if descriptor.is_empty():
			push_error("GameCenterKit iOS GDExtension 설명자를 읽지 못했습니다.")
			return
		# GDExtensionExportPlugin 이 원래 하던 작업을 iOS에서만 명시적으로 한다.
		# add_file 은 pck 안에 설명자를 원래 res 경로로 복원하고, XCFramework 와 C++
		# 초기화 코드는 iOS Xcode 프로젝트가 정적 GameKit 구현을 링크하게 만든다.
		add_file(EXPORTED_DESCRIPTOR_PATH, descriptor, false)
		add_shared_object(IOS_XCFRAMEWORK_PATH, PackedStringArray(["ios"]), "")
		add_apple_embedded_platform_cpp_code(
			"extern void register_dynamic_symbol(char *name, void *address);\n"
			+ "extern void add_apple_embedded_platform_init_callback(void (*cb)());\n\n"
			+ "extern \"C\" void %s();\n" % ENTRY_SYMBOL
			+ "void %s_init() {\n" % ENTRY_SYMBOL
			+ "  if (&%s) register_dynamic_symbol((char *)\"%s\", (void *)%s);\n" % [ENTRY_SYMBOL, ENTRY_SYMBOL, ENTRY_SYMBOL]
			+ "}\n"
			+ "struct %s_struct {\n" % ENTRY_SYMBOL
			+ "  %s_struct() {\n" % ENTRY_SYMBOL
			+ "    add_apple_embedded_platform_init_callback(%s_init);\n" % ENTRY_SYMBOL
			+ "  }\n"
			+ "};\n"
			+ "%s_struct %s_struct_instance;\n" % [ENTRY_SYMBOL, ENTRY_SYMBOL]
		)
		add_apple_embedded_platform_linker_flags("-Wl,-U,_%s" % ENTRY_SYMBOL)
		add_apple_embedded_platform_framework("GameKit.framework")
