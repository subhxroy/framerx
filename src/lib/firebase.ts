const FIREBASE_CONFIG_KEY = 'framer_firebase_config'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config))
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(FIREBASE_CONFIG_KEY)
}

export interface DeployResult {
  success: boolean
  url?: string
  error?: string
}

export async function deployToFirebaseHosting(
  htmlContent: string,
  siteId?: string
): Promise<DeployResult> {
  const config = getFirebaseConfig()
  if (!config) {
    return {
      success: false,
      error: 'Firebase not configured. Set up Firebase config first.',
    }
  }

  try {
    const baseUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId || config.projectId}`
    const versionsUrl = `${baseUrl}/versions`

    const versionResp = await fetch(versionsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!versionResp.ok) {
      return { success: false, error: `Version creation failed: ${versionResp.statusText}` }
    }

    const version = await versionResp.json()
    const versionName = version.name

    const filesResp = await fetch(`${versionName}:populateFiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          '/index.html': htmlContent,
        },
      }),
    })

    if (!filesResp.ok) {
      return { success: false, error: `File upload failed: ${filesResp.statusText}` }
    }

    const releaseResp = await fetch(`${baseUrl}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: versionName,
      }),
    })

    if (!releaseResp.ok) {
      return { success: false, error: `Release failed: ${releaseResp.statusText}` }
    }

    const url = `https://${siteId || config.projectId}.web.app`
    return { success: true, url }
  } catch (err) {
    return { success: false, error: `Deploy error: ${(err as Error).message}` }
  }
}

export async function simulateDeploy(
  _htmlContent: string,
  siteId?: string
): Promise<DeployResult> {
  await new Promise((r) => setTimeout(r, 1500))
  const id = siteId || 'framer-' + Math.random().toString(36).slice(2, 8)
  return {
    success: true,
    url: `https://${id}.web.app`,
  }
}
