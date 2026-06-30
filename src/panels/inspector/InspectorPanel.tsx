import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import LayoutSection from './LayoutSection'
import FillSection from './FillSection'
import BorderSection from './BorderSection'
import BorderRadiusSection from './BorderRadiusSection'
import ShadowSection from './ShadowSection'
import ImageSection from './ImageSection'
import AutoLayoutSection from './AutoLayoutSection'
import TypographySection from './TypographySection'
import AnimationSection from './AnimationSection'
import InteractionSection from './InteractionSection'
import CMSBindingSection from './CMSBindingSection'
import BlurSection from './BlurSection'
import CodePanel from './CodePanel'
import { Sparkles, Code2 } from 'lucide-react'

type InspectorTab = 'style' | 'agent' | 'code'

function SectionDivider() {
  return <div style={{ height: 1, background: '#202020', marginInline: -12 }} />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Tab bar: Agent / Style ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 36, borderBottom: '1px solid var(--border)',
        flexShrink: 0, paddingInline: 4,
        background: 'var(--panel-bg)',
      }}>
        {(['agent', 'style', 'code'] as InspectorTab[]).map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: 28, paddingInline: 8,
                borderRadius: 5, border: 'none',
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: isActive ? '#e0e0e0' : '#4a4a4a',
                cursor: 'pointer', fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                fontFamily: 'var(--font-ui)',
                transition: 'background 80ms, color 80ms',
                display: 'flex', alignItems: 'center', gap: 5,
                textTransform: 'capitalize',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#888'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#4a4a4a'
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

      {/* ── Agent tab placeholder ── */}
      {activeTab === 'agent' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, gap: 10, textAlign: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <p style={{ color: '#4a4a4a', fontSize: 11, lineHeight: 1.6 }}>
            AI-powered design assistance.<br />
            <span style={{ color: '#2e2e2e' }}>Select an element to get started.</span>
          </p>
        </div>
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
                <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="#252525" />
                <path d="M9 12h6M12 9v6" stroke="#2e2e2e" />
              </svg>
              <p style={{ color: '#2e2e2e', fontSize: 11, lineHeight: 1.6 }}>
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
                  borderBottom: '1px solid #1e1e1e',
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#0091ff',
                    background: 'rgba(0,145,255,0.10)',
                    padding: '2px 5px', borderRadius: 3,
                  }}>
                    {element.type}
                  </span>
                  <span style={{
                    fontSize: 11, color: '#666',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {element.name}
                  </span>
                  {selectedIds.length > 1 && (
                    <span style={{ fontSize: 10, color: '#3a3a3a', flexShrink: 0 }}>
                      +{selectedIds.length - 1}
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

                <SectionDivider />
                <SectionWrap><CMSBindingSection elementId={elementId} /></SectionWrap>
                <SectionDivider />
                <SectionWrap><AnimationSection elementId={elementId} /></SectionWrap>
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
