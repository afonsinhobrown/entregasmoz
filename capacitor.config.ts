import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.entregasmoz.app',
  appName: 'EntregasMoz',
  webDir: 'public',
  server: {
    // Loads the production Vercel app inside the Android WebView.
    url: 'https://entregasmoz-qxsm.vercel.app',
    cleartext: false,
  },
}

export default config
