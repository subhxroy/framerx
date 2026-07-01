import type { Element } from '@/store/editorStore'

const clipboard: { elements: Element[] } = { elements: [] }

export function getClipboard(): Element[] {
  return clipboard.elements
}

export function setClipboard(elements: Element[]): void {
  clipboard.elements = elements
}

export function clearClipboard(): void {
  clipboard.elements = []
}
