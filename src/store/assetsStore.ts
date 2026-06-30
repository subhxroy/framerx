import { create } from 'zustand'

export interface Asset {
  id: string
  name: string
  src: string // data URL or remote URL
  type: 'image'
  width?: number
  height?: number
}

interface AssetsStore {
  assets: Asset[]
  addAsset: (asset: Omit<Asset, 'id'>) => string
  addAssetFromFile: (file: File) => Promise<string>
  addAssetFromUrl: (url: string, name?: string) => string
  removeAsset: (id: string) => void
}

const STORAGE_KEY = 'framer_assets'

function load(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(assets: Asset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
  } catch {
    /* quota / private mode — ignore */
  }
}

let counter = 1
const genId = () => `asset_${Date.now()}_${counter++}`

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 240, height: 160 })
    img.src = src
  })
}

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  assets: load(),

  addAsset: (asset) => {
    const id = genId()
    const next = [{ ...asset, id }, ...get().assets]
    set({ assets: next })
    persist(next)
    return id
  },

  addAssetFromFile: async (file) => {
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const { width, height } = await imageSize(src)
    return get().addAsset({ name: file.name, src, type: 'image', width, height })
  },

  addAssetFromUrl: (url, name) => {
    return get().addAsset({ name: name || url.split('/').pop() || 'image', src: url, type: 'image' })
  },

  removeAsset: (id) => {
    const next = get().assets.filter((a) => a.id !== id)
    set({ assets: next })
    persist(next)
  },
}))
