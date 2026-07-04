import { memo, useMemo, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Element } from '@/store/editorStore'
import { useCMSStore, CMSDataContext, useCMSData } from '@/store/cmsStore'
import { getBPMerged } from '@/lib/breakpointUtils'
import { useViewportBounds, isElementVisible } from '@/hooks/useViewportBounds'
import TextElement from './TextElement'
import FrameElement from './FrameElement'
import ImageElement from './ImageElement'
import AnimatedElement from './AnimatedElement'
import InstanceBadge from '@/editor/canvas/InstanceBadge'

interface Props {
  id: string
  containerRef?: React.RefObject<HTMLDivElement | null>
  /** rendered as a flex/flow child of an auto-layout parent (no absolute x/y) */
  flow?: boolean
}

function applyFieldOverride(el: Element, field: string, value: any): Element {
  const parts = field.split('.')
  if (parts.length === 1) {
    ;(el as any)[parts[0]] = value
  } else if (parts.length === 2) {
    const [obj, key] = parts
    const nested = (el as any)[obj]
    if (nested && typeof nested === 'object') {
      ;(el as any)[obj] = { ...nested, [key]: value }
    }
  } else if (parts.length === 3) {
    const [obj, key1, key2] = parts
    const nested = (el as any)[obj]
    if (nested && typeof nested === 'object') {
      const inner = nested[key1]
      if (inner && typeof inner === 'object') {
        ;(el as any)[obj] = { ...nested, [key1]: { ...inner, [key2]: value } }
      }
    }
  }
  return el
}

function resolveInstance(
  element: Element,
  allElements: Record<string, Element>,
  visited = new Set<string>()
): Element {
  if (!element.isInstance || !element.masterId) return element
  if (visited.has(element.id)) return element
  visited.add(element.id)

  const master = allElements[element.masterId]
  if (!master) return element

  // Start from master's current properties (propagation from master edits)
  let resolved: Element = {
    ...master,
    id: element.id,
    x: element.x,
    y: element.y,
    parentId: element.parentId,
    sizing: element.sizing,
    isInstance: true,
    masterId: element.masterId,
    activeVariant: element.activeVariant,
    overrides: element.overrides,
    // Children mirror the master's subtree for true propagation
    children: master.children,
  }

  // Apply instance-specific overrides
  for (const [field, value] of Object.entries(element.overrides ?? {})) {
    resolved = applyFieldOverride(resolved, field, value)
  }

  // Resolve the master's children — each child is already the master's
  // actual element, so master edits propagate automatically. If the instance
  // has child-level overrides (keyed "children.0.text.content"), they are
  // applied above in the override loop.
  resolved.children = master.children

  return resolved
}

function ElementRenderer({ id, containerRef, flow = false }: Props) {
  const element = useEditorStore((s) => s.elements[id])
  const isInstance = element?.isInstance
  const masterId = element?.masterId
  // Subscribe to the master element so instance re-resolves when master changes
  const master = useEditorStore((s) => (isInstance && masterId ? s.elements[masterId] : undefined))
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const previewMode = useEditorStore((s) => s.previewMode)
  const canvasScale = useEditorStore((s) => s.canvas.scale)
  // Direction of the parent auto-layout container (null when parent isn't a stack).
  const parentDirection = useEditorStore((s) => {
    const pid = s.elements[id]?.parentId
    const p = pid ? s.elements[pid] : null
    return p?.autoLayout?.enabled ? p.autoLayout.direction : null
  })
  const cmsCtx = useCMSData()
  const cmsGetItems = useCMSStore((s) => s.getItems)
  const fallbackRef = useRef<HTMLDivElement | null>(null)
  const viewportBounds = useViewportBounds(containerRef ?? fallbackRef)

  const merged = useMemo(() => {
    if (!element) return null
    const allElements = useEditorStore.getState().elements
    const instanceResolved = element.isInstance ? resolveInstance(element, allElements) : element
    const bp = getBPMerged(instanceResolved, activeBreakpoint)
    if (!bp) return null

    if (previewMode && element.cmsBinding && !element.cmsBinding.isCollectionFrame) {
      let itemValues = cmsCtx.item?.values ?? null
      if (!itemValues) {
        const items = cmsGetItems(element.cmsBinding.collectionId)
        itemValues = items[0]?.values ?? null
      }
      if (itemValues) {
        const fieldVal = itemValues[element.cmsBinding.fieldId]
        if (fieldVal !== undefined && fieldVal !== null) {
          if (bp.type === 'text' && bp.text) {
            bp.text = { ...bp.text, content: String(fieldVal) }
          }
          if (bp.type === 'image' && bp.image) {
            bp.image = { ...bp.image, src: String(fieldVal) }
          }
        }
      }
    }

    return bp
  }, [element, master, activeBreakpoint, previewMode, cmsCtx.item, cmsGetItems])

  // Build variant triggers for instances whose master has triggerOn variants
  const variantTriggers = useMemo(() => {
    if (!isInstance || !previewMode || !master?.variants) return []
    const results: { trigger: 'hover' | 'tap'; target: Record<string, any> }[] = []
    for (const variant of master.variants) {
      if (!variant.triggerOn || variant.triggerOn === 'focus') continue
      const target: Record<string, any> = {}
      for (const [field, value] of Object.entries(variant.overrides)) {
        if (value === '' || value === undefined || value === null) continue
        if (field.startsWith('style.')) {
          target[field.slice(6)] = value
        } else if (['opacity', 'scale', 'rotate'].includes(field)) {
          target[field] = value
        } else if (field === 'style' && typeof value === 'object') {
          Object.assign(target, value)
        }
      }
      if (Object.keys(target).length > 0) {
        results.push({ trigger: variant.triggerOn, target })
      }
    }
    return results
  }, [master?.variants, isInstance, previewMode])

  if (!merged || !merged.visible) return null

  // Virtualization: skip rendering root elements outside the viewport.
  // (Nested children use parent-relative coords, so the viewport test
  // doesn't apply to them — they render whenever their parent does.)
  if (!previewMode && !flow && !merged.parentId &&
      !isElementVisible(merged.x, merged.y, merged.width, merged.height, viewportBounds)) {
    return <div data-element-id={id} data-parent-id={merged.parentId || ''} style={{ display: 'none' }} />
  }

  const isAutoLayoutContainer =
    (merged.type === 'frame' || merged.type === 'stack') && !!merged.autoLayout?.enabled

  const childRenderers =
    merged.children?.length > 0
      ? merged.children.map((childId) => (
          <ElementRenderer
            key={childId}
            id={childId}
            containerRef={containerRef}
            flow={isAutoLayoutContainer}
          />
        ))
      : null

  const renderContent = () => {
    switch (merged.type) {
      case 'text':
        return <TextElement element={merged} />
      case 'image':
        return <ImageElement element={merged} />
      case 'frame':
      case 'stack':
      case 'shape':
        return (
          <FrameElement element={merged}>
            {isAutoLayoutContainer ? childRenderers : null}
          </FrameElement>
        )
      default:
        return <FrameElement element={merged} />
    }
  }

  // Absolutely-positioned children (non-auto-layout parents only)
  const children = !isAutoLayoutContainer && childRenderers && (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {childRenderers}
    </div>
  )

  const wMode = merged.sizing?.width ?? 'fixed'
  const hMode = merged.sizing?.height ?? 'fixed'

  let style: React.CSSProperties
  if (flow) {
    // Auto-layout child: translate Fixed/Fill/Hug into flex CSS. "Fill" on the
    // parent's main axis grows the flex item; on the cross axis it stretches.
    const flowStyle: React.CSSProperties = {
      position: 'relative',
      flexShrink: 0,
      transform: merged.rotation ? `rotate(${merged.rotation}deg)` : undefined,
      opacity: merged.opacity,
    }
    const applyAxis = (axis: 'width' | 'height', mode: typeof wMode, isMain: boolean) => {
      if (mode === 'fill') {
        if (isMain) { flowStyle.flexGrow = 1; flowStyle.flexBasis = 0; flowStyle.flexShrink = 1 }
        else { flowStyle.alignSelf = 'stretch' }
      } else if (mode === 'hug') {
        flowStyle[axis] = 'fit-content'
      } else {
        flowStyle[axis] = merged[axis]
      }
    }
    const horizontal = parentDirection === 'horizontal'
    applyAxis('width', wMode, horizontal)
    applyAxis('height', hMode, !horizontal)
    style = flowStyle
  } else {
    style = {
      left: 0,
      top: 0,
      width: wMode === 'fill' ? '100%' : wMode === 'hug' ? 'fit-content' : merged.width,
      height: hMode === 'fill' ? '100%' : hMode === 'hug' ? 'fit-content' : merged.height,
      transform: `translate(${merged.x}px, ${merged.y}px) rotate(${merged.rotation}deg)`,
      opacity: merged.opacity,
      transformOrigin: '0 0',
    }
  }

  const dataAttrs = {
    'data-element-id': id,
    'data-parent-id': merged.parentId || '',
    ...(element?.isInstance && element?.masterId ? { 'data-instance-of': element.masterId } : {}),
  }

  // Collection frame in preview mode — render once per CMS item
  if (previewMode && element?.cmsBinding?.isCollectionFrame && !cmsCtx.item) {
    const cmsItems = cmsGetItems(element.cmsBinding.collectionFrameCollectionId ?? element.cmsBinding.collectionId)
    if (cmsItems.length > 0) {
      return (
        <>
          {cmsItems.map((item, idx) => (
            <CMSDataContext.Provider key={item.id} value={{ item, items: cmsItems }}>
              <AnimatedElement
                interactions={previewMode ? element?.interactions : undefined}
                style={{ ...style, top: merged.y + idx * (merged.height + 20) }}
                className="absolute"
                dataAttrs={dataAttrs}
              >
                {renderContent()}
                {children}
              </AnimatedElement>
            </CMSDataContext.Provider>
          ))}
        </>
      )
    }
  }

  const isRootPage = !previewMode && !merged.parentId && merged.type === 'frame'

  return (
    <>
      {isRootPage && (
        <div style={{
          position: 'absolute',
          left: merged.x,
          top: merged.y - (18 / canvasScale),
          fontSize: 10 / canvasScale,
          fontWeight: 500,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          {merged.name}
        </div>
      )}
      {isRootPage && (
        <div style={{
          position: 'absolute',
          left: merged.x - (4 / canvasScale),
          top: merged.y - (4 / canvasScale),
          width: merged.width + (8 / canvasScale),
          height: merged.height + (8 / canvasScale),
          borderRadius: 4 / canvasScale,
          border: `1px solid rgba(255,255,255,0.06)`,
          background: 'transparent',
          pointerEvents: 'none',
          boxShadow: `0 0 0 1px rgba(0,0,0,0.15), 0 ${8 / canvasScale}px ${24 / canvasScale}px rgba(0,0,0,0.2)`,
          zIndex: 0,
        }} />
      )}
      <AnimatedElement
        interactions={previewMode ? element?.interactions : undefined}
        scrollLinks={previewMode ? element?.scrollLinks : undefined}
        variantTriggers={variantTriggers}
        style={style}
        className={flow ? 'relative' : 'absolute'}
        dataAttrs={dataAttrs}
        previewMode={previewMode}
        isInAutoLayout={flow}
        isAutoLayoutFrame={isAutoLayoutContainer}
      >
        {element?.isInstance && !previewMode && (() => {
          const masterEl = element.masterId ? useEditorStore.getState().elements[element.masterId] : null
          return <InstanceBadge elementId={id} name={masterEl?.name || 'Component'} scale={canvasScale} />
        })()}
        {renderContent()}
        {children}
      </AnimatedElement>
    </>
  )
}

export default memo(ElementRenderer)
