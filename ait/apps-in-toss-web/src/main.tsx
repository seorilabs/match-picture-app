import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installMpTossFullScreenAdBridge } from './tossFullScreenAdRuntime.ts'
import { installMpSafeAreaBridge } from './safeAreaRuntime.ts'
import { installMpGraniteNavBridge } from './graniteNavRuntime.ts'
import { installMpScreenWakeBridge } from './screenWakeRuntime.ts'
import { installMpGameCenterBridge } from './gameCenterRuntime.ts'
import { installMpBridge } from './mpBridge.ts'

installMpSafeAreaBridge()
installMpScreenWakeBridge()
installMpGraniteNavBridge()
installMpTossFullScreenAdBridge()
installMpGameCenterBridge()
// 위 런타임들이 붙은 뒤에 Godot 이 집어갈 창구 하나로 모은다.
installMpBridge()

createRoot(document.getElementById('root')!).render(<App />)
