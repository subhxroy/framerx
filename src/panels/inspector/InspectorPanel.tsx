import { useEditorStore } from '@/store/editorStore'
import { useUIStore } from '@/store/uiStore'
import { RotateCcw } from 'lucide-react'
import ScrollArea from '@/components/ScrollArea'
import InspectorSection from './InspectorSection'
import LayoutSection from './LayoutSection'
import FillSection from './FillSection'
import BorderSection from './BorderSection'
import BorderRadiusSection from './BorderRadiusSection'
import ShadowSection from './ShadowSection'
import ImageSection from './ImageSection'
import AutoLayoutSection from './AutoLayoutSection'
import TypographySection from './TypographySection'
import AnimationSection from './AnimationSection'
import ScrollAnimationSection from './ScrollAnimationSection'
import InteractionSection from './InteractionSection'
import CMSBindingSection from './CMSBindingSection'
import VariantsSection from './VariantsSection'
import BlurSection from './BlurSection'
import CodePanel from './CodePanel'
import { Code2, Sparkles } from 'lucide-react'
import AgentPanel from './AgentPanel'
import type { InspectorTab } from '@/store/uiStore'

export default function InspectorPanel() {
  const activeTab = useUIStore(s => s.rightTab)
  const setActiveTab = useUIStore(s => s.setRightTab)
  const selectedIds = useEditorStore(s => s.selectedIds)
  const elements    = useEditorStore(s => s.elements)

  const elementId = selectedIds[0]
  const element   = elements[elementId]
  const resetInstanceOverrides = useEditorStore(s => s.resetInstanceOverrides)

  const masterName = element?.isInstance && element?.masterId
    ? elements[element.masterId]?.name ?? 'Unknown'
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Tab bar: Agent / Style / Code ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 32, borderBottom: '1px solid var(--border)',
        flexShrink: 0, paddingInline: 8,
        background: 'var(--panel-bg)',
        gap: 4,
      }}>
        {(['agent', 'style', 'code'] as InspectorTab[]).map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: 24, paddingInline: 8,
                borderRadius: 4, border: 'none',
                background: isActive ? 'var(--surface-3)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer', fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                fontFamily: 'var(--font-ui)',
                transition: 'all var(--duration-instant)',
                display: 'flex', alignItems: 'center', gap: 4,
                textTransform: 'capitalize',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              {tab === 'agent' && <Sparkles size={10} style={{ color: 'inherit' }} />}
              {tab === 'code' && <Code2 size={10} style={{ color: 'inherit' }} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        })}
      </div>

      {/* ── Agent tab ── */}
      {activeTab === 'agent' && (
        <AgentPanel />
      )}

      {/* ── Style tab ── */}
      {activeTab === 'style' && (
        <>
          {selectedIds.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 20, textAlign: 'center', gap: 8,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="var(--border)" />
                <path d="M9 12h6M12 9v6" stroke="var(--border-strong)" />
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.6 }}>
                Select an element to<br />edit its properties
              </p>
            </div>
          ) : (
            <ScrollArea>
              {/* Element header */}
              {element && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    padding: '4px 8px', borderRadius: 4,
                  }}>
                    {element.type}
                  </span>
                  <span style={{
                  fontSize: 11, color: 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {element.name}
                  </span>
                  {element.isInstance && masterName && (
                    <button
                      onClick={() => {
                        if (element.masterId) useEditorStore.getState().setSelectedIds([element.masterId])
                      }}
                      title="Go to master component"
                      style={{
                        fontSize: 9, color: 'var(--accent)', flexShrink: 0,
                        background: 'var(--accent-bg)',
                        padding: '4px 8px', borderRadius: 4,
                        display: 'flex', alignItems: 'center', gap: 4,
                        border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-bg)' }}
                    >
                      Instance of {masterName}
                    </button>
                  )}
                  {selectedIds.length > 1 && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                      +{selectedIds.length - 1}
                    </span>
                  )}
                </div>
              )}
              {element?.isInstance && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--accent-bg)',
                }}>
                  <button
                    onClick={() => resetInstanceOverrides(element.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'transparent', border: 'none',
                      color: 'var(--accent)', cursor: 'pointer', fontSize: 10,
                      padding: '4px 8px', borderRadius: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,145,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <RotateCcw size={10} />
                    Reset to master
                  </button>
                  {Object.keys(element.overrides ?? {}).length > 0 && (
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                      {Object.keys(element.overrides ?? {}).length} override{Object.keys(element.overrides ?? {}).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

                <InspectorSection id="layout" label="Layout"><LayoutSection /></InspectorSection>
                <InspectorSection id="auto-layout" label="Auto Layout"><AutoLayoutSection /></InspectorSection>
                <InspectorSection id="fill" label="Fill"><FillSection /></InspectorSection>

                {element?.type === 'image' && (
                  <InspectorSection id="image" label="Image"><ImageSection /></InspectorSection>
                )}

                <InspectorSection id="border" label="Border"><BorderSection /></InspectorSection>
                <InspectorSection id="border-radius" label="Border Radius"><BorderRadiusSection /></InspectorSection>
                <InspectorSection id="shadow" label="Shadow"><ShadowSection /></InspectorSection>
                <InspectorSection id="blur" label="Blur"><BlurSection /></InspectorSection>

                {(element?.type === 'text') && (
                  <InspectorSection id="typography" label="Typography"><TypographySection /></InspectorSection>
                )}

                {element?.componentId && (
                  <InspectorSection id="variants" label="Variants"><VariantsSection elementId={elementId} /></InspectorSection>
                )}
                <InspectorSection id="cms-binding" label="CMS Binding"><CMSBindingSection elementId={elementId} /></InspectorSection>
                <InspectorSection id="animation" label="Animation"><AnimationSection elementId={elementId} /></InspectorSection>
                <InspectorSection id="scroll-animation" label="Scroll Animation"><ScrollAnimationSection elementId={elementId} /></InspectorSection>
                <InspectorSection id="interaction" label="Interaction"><InteractionSection elementId={elementId} /></InspectorSection>
            </ScrollArea>
          )}
        </>
      )}

      {/* ── Code tab ── */}
      {activeTab === 'code' && <CodePanel />}
    </div>
  )
}
