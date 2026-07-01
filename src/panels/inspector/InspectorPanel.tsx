import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { RotateCcw } from 'lucide-react'
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

type InspectorTab = 'style' | 'agent' | 'code'

function SectionDivider() {
  return <div style={{ height: 1, background: 'var(--border)', marginInline: 0 }} />
}

function SectionWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '10px 0' }}>{children}</div>
}

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<InspectorTab>('style')
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
        flexShrink: 0, paddingInline: 6,
        background: 'var(--panel-bg)',
        gap: 1,
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
                color: isActive ? '#e0e0e0' : '#555',
                cursor: 'pointer', fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                fontFamily: 'var(--font-ui)',
                transition: 'all 80ms',
                display: 'flex', alignItems: 'center', gap: 4,
                textTransform: 'capitalize',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#999'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#555'
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
                <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="#222" />
                <path d="M9 12h6M12 9v6" stroke="#2a2a2a" />
              </svg>
              <p style={{ color: '#333', fontSize: 11, lineHeight: 1.6 }}>
                Select an element to<br />edit its properties
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Element header */}
              {element && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    padding: '2px 5px', borderRadius: 3,
                  }}>
                    {element.type}
                  </span>
                  <span style={{
                    fontSize: 11, color: '#777',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {element.name}
                  </span>
                  {element.isInstance && masterName && (
                    <span style={{
                      fontSize: 9, color: '#a688ff', flexShrink: 0,
                      background: 'rgba(166,136,255,0.08)',
                      padding: '2px 5px', borderRadius: 3,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      Instance of {masterName}
                    </span>
                  )}
                  {selectedIds.length > 1 && (
                    <span style={{ fontSize: 10, color: '#444', flexShrink: 0 }}>
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
                  background: 'rgba(166,136,255,0.03)',
                }}>
                  <button
                    onClick={() => resetInstanceOverrides(element.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'transparent', border: 'none',
                      color: '#a688ff', cursor: 'pointer', fontSize: 10,
                      padding: '3px 6px', borderRadius: 3,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(166,136,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <RotateCcw size={10} />
                    Reset to master
                  </button>
                  {Object.keys(element.overrides ?? {}).length > 0 && (
                    <span style={{ fontSize: 9, color: '#666' }}>
                      {Object.keys(element.overrides ?? {}).length} override{Object.keys(element.overrides ?? {}).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 12px' }}>
                <SectionWrap><LayoutSection /></SectionWrap>
                <SectionDivider />
                <SectionWrap><AutoLayoutSection /></SectionWrap>
                <SectionDivider />
                <SectionWrap><FillSection /></SectionWrap>

                {element?.type === 'image' && (
                  <>
                    <SectionDivider />
                    <SectionWrap><ImageSection /></SectionWrap>
                  </>
                )}

                <SectionDivider />
                <SectionWrap><BorderSection /></SectionWrap>
                <SectionDivider />
                <SectionWrap><BorderRadiusSection /></SectionWrap>
                <SectionDivider />
                <SectionWrap><ShadowSection /></SectionWrap>
                <SectionDivider />
                <SectionWrap><BlurSection /></SectionWrap>

                {(element?.type === 'text') && (
                  <>
                    <SectionDivider />
                    <SectionWrap><TypographySection /></SectionWrap>
                  </>
                )}

                {element?.componentId && (
                  <>
                    <SectionDivider />
                    <SectionWrap><VariantsSection elementId={elementId} /></SectionWrap>
                  </>
                )}
                <SectionDivider />
                <SectionWrap><CMSBindingSection elementId={elementId} /></SectionWrap>
                <SectionDivider />
                <SectionWrap><AnimationSection elementId={elementId} /></SectionWrap>
                <SectionDivider />
                <SectionWrap><ScrollAnimationSection elementId={elementId} /></SectionWrap>
                <SectionDivider />
                <SectionWrap><InteractionSection elementId={elementId} /></SectionWrap>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Code tab ── */}
      {activeTab === 'code' && <CodePanel />}
    </div>
  )
}
