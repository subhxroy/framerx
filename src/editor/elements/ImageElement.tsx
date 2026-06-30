import type { Element } from '@/store/editorStore'
import { getBorderRadiusCSS, getBoxShadowCSS } from '@/lib/elementStyle'

interface Props {
  element: Element
}

export default function ImageElement({ element }: Props) {
  const img = element.image!
  const radius = getBorderRadiusCSS(element.style)
  const boxShadow = getBoxShadowCSS(element.style)
  return img.src ? (
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
  ) : (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{
        background: 'var(--surface-2)',
        color: 'var(--text-muted)',
        fontSize: 11,
      }}
    >
      Drop image or enter URL
    </div>
  )
}
