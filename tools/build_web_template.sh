#!/usr/bin/env bash
# 같은그림찾기용 Godot Web export 템플릿 빌드.
# 2D 전용 게임이라 3D·물리3D·XR·불필요 포맷 모듈을 뺀다.
# javascript_eval 은 끄지 않는다. 그 플래그는 JavaScriptBridge.get_interface() 까지
# 함께 제거하는데, 앱인토스 래퍼와 주고받는 창구가 바로 그 함수다.
#
# 사전 준비(한 번만):
#   mkdir -p ~/Workspace/godot-web-build && cd ~/Workspace/godot-web-build
#   git clone --depth 1 https://github.com/emscripten-core/emsdk.git emsdk
#   ./emsdk/emsdk install 4.0.11 && ./emsdk/emsdk activate 4.0.11
#   git clone --depth 1 --branch 4.7.2-stable https://github.com/godotengine/godot.git godot-src
#
# Emscripten 버전은 Godot 4.7.2 공식 Web 빌드와 같은 4.0.11 로 맞춘다. 버전이 어긋나면
# export 는 되는데 브라우저에서 링크 오류로 멈추는 사례가 보고돼 있다(godot#105369).
#
# 결과: bin/godot.web.template_release.wasm32.nothreads.zip
#   → godot/export_templates/web_release.zip 로 복사한다.
set -euo pipefail
BUILD_ROOT="${GODOT_WEB_BUILD_ROOT:-$HOME/Workspace/godot-web-build}"
cd "$BUILD_ROOT/godot-src"
source "$BUILD_ROOT/emsdk/emsdk_env.sh" >/dev/null 2>&1

exec scons platform=web target=template_release \
  production=yes \
  threads=no \
  disable_3d=yes \
  disable_physics_3d=yes \
  deprecated=no \
  module_mono_enabled=no \
  module_openxr_enabled=no \
  module_webxr_enabled=no \
  module_mobile_vr_enabled=no \
  module_camera_enabled=no \
  module_gltf_enabled=no \
  module_fbx_enabled=no \
  module_csg_enabled=no \
  module_gridmap_enabled=no \
  module_lightmapper_rd_enabled=no \
  module_raycast_enabled=no \
  module_meshoptimizer_enabled=no \
  module_vhacd_enabled=no \
  module_xatlas_unwrap_enabled=no \
  module_theora_enabled=no \
  module_webrtc_enabled=no \
  module_websocket_enabled=no \
  module_upnp_enabled=no \
  module_visual_shader_enabled=no \
  module_noise_enabled=no \
  module_tinyexr_enabled=no \
  module_hdr_enabled=no \
  module_dds_enabled=no \
  module_bmp_enabled=no \
  module_tga_enabled=no \
  module_jpg_enabled=no \
  module_basis_universal_enabled=no \
  module_cvtt_enabled=no \
  module_betsy_enabled=no \
  module_astcenc_enabled=no \
  module_ktx_enabled=no \
  module_msdfgen_enabled=no \
  -j8
