import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import aitDevtools from '@apps-in-toss/devtools/unplugin'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // devtools 는 개발 서버에서만 쓴다. 배포 번들에 개발 도구를 넣지 않는다.
  plugins: [...(command === 'serve' ? [aitDevtools.vite()] : []), react()],
}))
