import { useEffect, useRef, useState } from 'react'
import splashImage from '../../../godot/assets/branding/seori-labs-boot-splash-1024.png'
import { whenGameReady } from './mpBridge.ts'
import { GODOT_CONFIG, GODOT_SCRIPT_PATH, GODOT_THREADS_ENABLED } from './godotBuild'

type GodotConfig = typeof GODOT_CONFIG & {
  canvas?: HTMLCanvasElement
}

type GodotEngineInstance = {
  startGame: (override?: Partial<GodotConfig>) => Promise<void>
}

type GodotEngineConstructor = {
  new (config: GodotConfig): GodotEngineInstance
  getMissingFeatures: (features: { threads: boolean }) => string[]
}

declare global {
  interface Window {
    Engine?: GodotEngineConstructor
  }
}

const scriptPromises = new Map<string, Promise<void>>()

function loadGodotScript(src: string) {
  const cached = scriptPromises.get(src)
  if (cached) {
    return cached
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existing ?? document.createElement('script')
    script.src = src
    script.async = true

    const onLoad = () => {
      script.dataset.loaded = 'true'
      resolve()
    }

    const onError = () => {
      script.remove()
      scriptPromises.delete(src)
      reject(new Error(`Failed to load Godot loader: ${src}`))
    }

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (!existing) {
      document.body.appendChild(script)
    }
  })

  scriptPromises.set(src, promise)
  return promise
}

export default function GodotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('게임을 준비하고 있어요')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const canvas = canvasRef.current
        if (!canvas) {
          throw new Error('Godot canvas is not mounted')
        }

        await loadGodotScript(GODOT_SCRIPT_PATH)

        const Engine = window.Engine
        if (!Engine) {
          throw new Error('Godot Engine loader is not available')
        }

        const isLocalAppsInTossSandbox =
          import.meta.env.DEV &&
          window.location.protocol === 'http:' &&
          window.navigator.userAgent.includes('AppsInToss')
        const missingFeatures = Engine.getMissingFeatures({ threads: GODOT_THREADS_ENABLED }).filter(
          (feature) => !(isLocalAppsInTossSandbox && feature.startsWith('Secure Context')),
        )
        if (missingFeatures.length > 0) {
          throw new Error(`Missing browser features: ${missingFeatures.join(', ')}`)
        }

        setStatus('게임을 시작하고 있어요')
        const engine = new Engine({
          ...GODOT_CONFIG,
          canvas,
        })

        // startGame 의 Promise 는 기다리지 않는다. 게임이 화면을 세운 시점과
        // 일치하지 않아 커스텀 템플릿에서 덮개가 남았다. 게임이 직접 보내는
        // 준비 완료 신호(window.__mpBridge.notifyReady)를 기준으로 삼는다.
        //
        // 진행률 보고는 게임이 이미 화면을 세운 뒤에도 이어진다. 그것을 그대로 두면
        // 덮개를 걷은 직후 다시 "게임 준비 100%" 로 덮인다.
        let ready = false
        void engine.startGame({
          canvas,
          onProgress: (current: number, total: number) => {
            if (cancelled || ready || total <= 0) {
              return
            }
            setStatus(`게임 준비 ${Math.round((current / total) * 100)}%`)
          },
        } as Partial<GodotConfig>)

        await whenGameReady()
        ready = true

        if (!cancelled) {
          setStatus('')
        }
      } catch (bootError) {
        if (!cancelled) {
          setError(bootError instanceof Error ? bootError.message : String(bootError))
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="godot-shell">
      <canvas ref={canvasRef} id="godot-canvas">
        Canvas is required to run 같은 그림 찾기.
      </canvas>
      {(status || error) && (
        <div className={error ? 'status status-error' : 'status'}>
          <img className="status-symbol" src={splashImage} alt="서리랩스" />
          <span>{error ?? status}</span>
        </div>
      )}
    </main>
  )
}
