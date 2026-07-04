import { Image } from 'lucide-react'
import type { Element } from '@/store/editorStore'
import { getBorderRadiusCSS, getBoxShadowCSS } from '@/lib/elementStyle'

interface Props {
  element: Element
}

export default function ImageElement({ element }: Props) {
  const img = element.image
  const noSrc = !img || !img.src
  const radius = getBorderRadiusCSS(element.style)
  const boxShadow = getBoxShadowCSS(element.style)

  if (noSrc) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-1"
        style={{
          background: 'var(--accent-dim)',
          color: 'var(--text-muted)',
          fontSize: 11,
          border: '1.5px dashed var(--accent-border)',
          borderRadius: radius,
        }}
      >
        <Image size={20} strokeWidth={1.5} />
        <span>Drop image here</span>
      </div>
    )
  }

  return (
    <img
      src={img.src}
      alt=""
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: img.objectFit,
        borderRadius: radius,
        boxShadow,
        pointerEvents: 'none',
      }}
    />
  )
}
