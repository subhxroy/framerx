import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, signOut } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { createStarterProjectData } from '@/lib/defaultProject'
import {
  Plus, MoreHorizontal, Copy, Trash2, X, Search,
  Monitor, Tablet, Smartphone, LogOut,
  Home, Layers, Settings, ExternalLink, Edit3,
  ChevronDown, Star,
} from 'lucide-react'

const CANVAS_SIZES = [
  { label: 'Web',    description: 'Desktop', width: 1440, height: 900,  icon: <Monitor size={18} /> },
  { label: 'Mobile', description: 'iPhone',  width: 390,  height: 844,  icon: <Smartphone size={18} /> },
  { label: 'Tablet', description: 'iPad',    width: 768,  height: 1024, icon: <Tablet size={18} /> },
]

const THUMB_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #141414 0%, #2a2a2a 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 100%)',
  'linear-gradient(135deg, #2c1654 0%, #1a1a2e 100%)',
  'linear-gradient(135deg, #0d0d0d 0%, #1c1c1c 100%)',
]

export default function Dashboard() {
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const { projectList, createProject, deleteProject, duplicateProject, saveProjectData, loadProjects, updateProject } = useProjectStore()

  const [activeTab,       setActiveTab]       = useState('home')
  const [showNewModal,    setShowNewModal]    = useState(false)
  const [newName,         setNewName]         = useState('Untitled')
  const [canvasSize,      setCanvasSize]      = useState(CANVAS_SIZES[0])
  const [menuProject,     setMenuProject]     = useState<string | null>(null)
  const [hoveredProject,  setHoveredProject]  = useState<string | null>(null)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [showUserMenu,    setShowUserMenu]    = useState(false)
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [renameValue,     setRenameValue]     = useState('')

  const menuRef    = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuProject(null)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load projects from Supabase when dashboard mounts
  useEffect(() => { loadProjects() }, [])

  const handleCreate = useCallback(async () => {
    const id = await createProject(newName || 'Untitled', canvasSize.width, canvasSize.height)
    await saveProjectData(id, createStarterProjectData(canvasSize.width, canvasSize.height))
    setShowNewModal(false)
    setNewName('Untitled')
    navigate(`/editor/${id}`)
  }, [newName, canvasSize, createProject, saveProjectData, navigate])

  const handleOpen      = useCallback((id: string) => navigate(`/editor/${id}`), [navigate])
  const handleDuplicate = useCallback(async (id: string) => {
    const newId = await duplicateProject(id)
    setMenuProject(null)
    if (newId) navigate(`/editor/${newId}`)
  }, [duplicateProject, navigate])
  const handleDelete    = useCallback(async (id: string) => { await deleteProject(id); setMenuProject(null) }, [deleteProject])
  const handleSignOut   = useCallback(async () => await signOut(), [])

  const formatDate = (ts: number) => {
    const d = new Date(ts), now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000)    return 'Just now'
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filteredProjects = projectList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const userInitials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#111111',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#ececec',
    }}>

      {/* ─────────── LEFT SIDEBAR ─────────── */}
      <aside style={{
        width: 200, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: '#161616',
        borderRight: '1px solid #212121',
      }}>

        {/* Logo + workspace */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #1e1e1e' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '5px 6px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderRadius: 6, textAlign: 'left',
            transition: 'background 80ms',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="14" viewBox="0 0 28 38" fill="none">
                <path d="M0 0H28V14H14L0 0Z" fill="white" />
                <path d="M0 14H14L28 28H0V14Z" fill="white" />
                <path d="M0 28H14V42L0 28Z" fill="white" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0', lineHeight: 1.2 }}>
                My Workspace
              </div>
              <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 1 }}>
                {user?.email?.split('@')[0] || 'Personal'}
              </div>
            </div>
            <ChevronDown size={11} style={{ color: '#3a3a3a', flexShrink: 0 }} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { id: 'home', icon: <Home size={13} />, label: 'Home' },
            { id: 'all-projects', icon: <Layers size={13} />, label: 'All Projects' },
            { id: 'starred', icon: <Star size={13} />, label: 'Starred' },
            { id: 'templates', icon: <Layers size={13} />, label: 'Templates' },
          ].map(item => (
            <button key={item.id} 
              onClick={() => setActiveTab(item.id)}
              style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 5, border: 'none',
              background: activeTab === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: activeTab === item.id ? '#e0e0e0' : '#4a4a4a',
              cursor: 'pointer', fontSize: 12, fontWeight: activeTab === item.id ? 500 : 400,
              width: '100%', textAlign: 'left',
              transition: 'background 80ms, color 80ms',
              fontFamily: 'inherit',
            }}
              onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#888' } }}
              onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a4a' } }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Bottom: Settings + user */}
        <div style={{ padding: '8px 8px', borderTop: '1px solid #1e1e1e' }}>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 5, border: 'none',
            background: activeTab === 'settings' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: activeTab === 'settings' ? '#e0e0e0' : '#3a3a3a',
            cursor: 'pointer', fontSize: 12, width: '100%', textAlign: 'left',
            transition: 'background 80ms, color 80ms', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (activeTab !== 'settings') { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#888' } }}
            onMouseLeave={e => { if (activeTab !== 'settings') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a3a3a' } }}
          >
            <Settings size={13} />Settings
          </button>

          {/* User row */}
          <div style={{ position: 'relative', marginTop: 4 }} ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 6px', borderRadius: 5, border: 'none',
                background: 'transparent', cursor: 'pointer',
                width: '100%', textAlign: 'left',
                transition: 'background 80ms', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#fff',
              }}>
                {userInitials}
              </div>
              <span style={{ fontSize: 11, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 100,
                background: '#1c1c1c', border: '1px solid #252525',
                borderRadius: 8, overflow: 'hidden', minWidth: 180,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #222' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', margin: 0 }}>
                    {user?.displayName || 'User'}
                  </p>
                  <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', width: '100%', background: 'none',
                    border: 'none', color: '#666', cursor: 'pointer',
                    fontSize: 12, textAlign: 'left', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────── MAIN CONTENT ─────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top header bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 52, flexShrink: 0,
          borderBottom: '1px solid #1a1a1a',
          background: '#141414',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', margin: 0 }}>
              {activeTab === 'home' ? 'Projects' : 
               activeTab === 'all-projects' ? 'All Projects' :
               activeTab === 'starred' ? 'Starred Projects' :
               activeTab === 'templates' ? 'Templates' : 'Settings'}
            </h1>
            {activeTab !== 'settings' && activeTab !== 'templates' && (
              <span style={{
                fontSize: 10, color: '#3a3a3a',
                background: '#1e1e1e', border: '1px solid #252525',
                padding: '1px 7px', borderRadius: 100, fontVariantNumeric: 'tabular-nums',
              }}>
                {filteredProjects.length}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            {activeTab !== 'settings' && (
              <div style={{ position: 'relative' }}>
                <Search size={11} style={{
                  position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                  color: '#3a3a3a', pointerEvents: 'none',
                }} />
                <input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: 28, paddingRight: 10, height: 28, borderRadius: 6,
                    background: '#1a1a1a', border: '1px solid #212121', color: '#e0e0e0',
                    fontSize: 11, outline: 'none', width: 180, fontFamily: 'inherit',
                    transition: 'border-color 80ms, width 200ms',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#333'; e.target.style.width = '220px' }}
                  onBlur={e => { e.target.style.borderColor = '#212121'; e.target.style.width = '180px' }}
                />
              </div>
            )}

            {/* New Project */}
            {activeTab !== 'settings' && (
              <button
                onClick={() => setShowNewModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 12px', height: 28, borderRadius: 6,
                  background: '#0091ff', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  transition: 'background 80ms',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0080e6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0091ff')}
              >
                <Plus size={12} />
                New Project
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeTab === 'settings' ? (
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0' }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 24px', color: '#fff' }}>Workspace Settings</h2>
              <div style={{ background: '#1a1a1a', border: '1px solid #252525', borderRadius: 8, padding: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>Workspace Name</label>
                  <input type="text" defaultValue="My Workspace" style={{
                    width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #333', 
                    borderRadius: 6, color: '#fff', fontSize: 13, fontFamily: 'inherit'
                  }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8 }}>Account Email</label>
                  <input type="text" defaultValue={user?.email || ''} readOnly style={{
                    width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #333', 
                    borderRadius: 6, color: '#888', fontSize: 13, fontFamily: 'inherit'
                  }} />
                </div>
                <button onClick={handleSignOut} style={{
                  padding: '10px 16px', background: '#ff3333', color: '#fff', border: 'none', 
                  borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}>
                  Sign out of Framer Clone
                </button>
              </div>
            </div>
          ) : activeTab === 'templates' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}>
              {/* Dummy templates */}
              {[
                { name: 'Portfolio Template', color: '#667eea' },
                { name: 'SaaS Landing Page', color: '#11998e' },
                { name: 'Blog Starter', color: '#f2994a' },
                { name: 'E-commerce App', color: '#ec008c' },
              ].map((tpl, i) => (
                <div key={i} style={{
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid #252525', background: '#1a1a1a'
                }} onClick={() => {
                  setNewName(tpl.name)
                  setShowNewModal(true)
                }}>
                  <div style={{ height: 150, background: `linear-gradient(135deg, ${tpl.color}, #111)` }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Start with a template</div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '70%', gap: 14,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: '#1a1a1a', border: '1px solid #252525',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={24} style={{ color: '#2e2e2e' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#3a3a3a', margin: '0 0 6px' }}>
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </h2>
                <p style={{ fontSize: 11, color: '#2a2a2a', margin: 0 }}>
                  {searchQuery ? 'Try a different search term' : 'Create your first project'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setShowNewModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 6,
                    background: '#0091ff', color: '#fff', border: 'none',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  <Plus size={12} /> New Project
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}>
              {filteredProjects.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: 8, overflow: 'visible',
                    cursor: 'pointer', position: 'relative',
                    transition: 'transform 100ms',
                  }}
                  onClick={() => handleOpen(p.id)}
                  onMouseEnter={() => setHoveredProject(p.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: 150, borderRadius: 8,
                    background: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length],
                    border: '1px solid #252525',
                    position: 'relative', overflow: 'hidden',
                    transition: 'border-color 100ms',
                    borderColor: hoveredProject === p.id ? '#353535' : '#252525',
                  }}>
                    {/* Fake browser chrome */}
                    <div style={{
                      position: 'absolute', inset: 10, background: 'rgba(0,0,0,0.3)',
                      borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {/* Tab bar */}
                      <div style={{
                        height: 16, background: 'rgba(0,0,0,0.25)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', gap: 3, paddingLeft: 5,
                      }}>
                        {[0,1,2].map(j => (
                          <div key={j} style={{
                            width: 3, height: 3, borderRadius: '50%',
                            background: j === 0 ? 'rgba(255,95,86,0.6)' : j === 1 ? 'rgba(255,189,46,0.6)' : 'rgba(39,201,63,0.6)',
                          }} />
                        ))}
                      </div>
                      {/* Content skeleton */}
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ width: '55%', height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 3, marginBottom: 6 }} />
                        <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.10)', borderRadius: 2, marginBottom: 3 }} />
                        <div style={{ width: '65%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 3 }} />
                        <div style={{ width: '40%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 10 }} />
                        <div style={{ width: 40, height: 14, background: 'rgba(0,145,255,0.4)', borderRadius: 3 }} />
                      </div>
                    </div>

                    {/* Hover overlay — "Edit" button */}
                    {hoveredProject === p.id && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        borderRadius: 8,
                      }}>
                        <button
                          onClick={e => { e.stopPropagation(); handleOpen(p.id) }}
                          style={{
                            padding: '6px 14px', borderRadius: 5, border: 'none',
                            background: '#fff', color: '#111', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontFamily: 'inherit',
                          }}
                        >
                          <ExternalLink size={10} /> Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div style={{ padding: '8px 2px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renamingProject === p.id ? (
                        <input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={async () => {
                            if (renameValue.trim() && renameValue !== p.name) {
                              await updateProject(p.id, { name: renameValue.trim() })
                            }
                            setRenamingProject(null)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setRenamingProject(null)
                            e.stopPropagation()
                          }}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                          style={{
                            width: '100%', background: '#1e1e1e', border: '1px solid #0091ff',
                            borderRadius: 4, color: '#e0e0e0', fontSize: 11, padding: '2px 5px',
                            outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        <p style={{
                          fontSize: 11, fontWeight: 500, color: '#c8c8c8',
                          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.name}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: '#3a3a3a', margin: '1px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDate(p.updatedAt)}
                      </p>
                    </div>

                    {/* Three-dot menu */}
                    <div style={{ position: 'relative', flexShrink: 0 }} ref={menuProject === p.id ? menuRef : undefined}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuProject(menuProject === p.id ? null : p.id) }}
                        style={{
                          width: 22, height: 22, borderRadius: 4,
                          background: menuProject === p.id ? '#252525' : 'transparent',
                          border: 'none', cursor: 'pointer', color: '#3a3a3a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: hoveredProject === p.id || menuProject === p.id ? 1 : 0,
                          transition: 'opacity 80ms, background 80ms, color 80ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = '#252525' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#3a3a3a'; if (menuProject !== p.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {menuProject === p.id && (
                        <div style={{
                          position: 'absolute', right: 0, bottom: 'calc(100% + 4px)', zIndex: 50,
                          background: '#1c1c1c', border: '1px solid #252525',
                          borderRadius: 8, overflow: 'hidden', minWidth: 150,
                          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                          padding: 4,
                        }}
                          onClick={e => e.stopPropagation()}
                        >
                          {[
                            { icon: <Edit3 size={11} />, label: 'Rename', action: () => { setRenameValue(p.name); setRenamingProject(p.id); setMenuProject(null) } },
                            { icon: <Copy size={11} />, label: 'Duplicate', action: () => handleDuplicate(p.id) },
                            { icon: <ExternalLink size={11} />, label: 'Open', action: () => { handleOpen(p.id); setMenuProject(null) } },
                          ].map(item => (
                            <button key={item.label} onClick={item.action} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 10px', width: '100%', background: 'none',
                              border: 'none', color: '#888', cursor: 'pointer',
                              fontSize: 11, textAlign: 'left', fontFamily: 'inherit',
                              borderRadius: 5, transition: 'background 60ms',
                            }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              {item.icon} {item.label}
                            </button>
                          ))}
                          <div style={{ height: 1, background: '#212121', margin: '3px 4px' }} />
                          <button onClick={() => handleDelete(p.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px', width: '100%', background: 'none',
                            border: 'none', color: '#ff4444', cursor: 'pointer',
                            fontSize: 11, textAlign: 'left', fontFamily: 'inherit',
                            borderRadius: 5, transition: 'background 60ms',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,68,68,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────── NEW PROJECT MODAL ─────────── */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false) }}
        >
          <div style={{
            background: '#1a1a1a', border: '1px solid #252525',
            borderRadius: 12, width: 440, padding: '22px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>New Project</h2>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#3a3a3a', padding: 4, borderRadius: 4,
                  display: 'flex', transition: 'color 80ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3a3a3a')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Name */}
            <label style={{
              fontSize: 10, color: '#555', textTransform: 'uppercase',
              letterSpacing: '0.07em', display: 'block', marginBottom: 5,
            }}>
              Project Name
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 6,
                background: '#212121', border: '1px solid #2a2a2a', color: '#e0e0e0',
                fontSize: 12, outline: 'none', marginBottom: 18, fontFamily: 'inherit',
                boxSizing: 'border-box', transition: 'border-color 80ms',
              }}
              onFocus={e => (e.target.style.borderColor = '#0091ff')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
            />

            {/* Canvas Size */}
            <label style={{
              fontSize: 10, color: '#555', textTransform: 'uppercase',
              letterSpacing: '0.07em', display: 'block', marginBottom: 8,
            }}>
              Canvas Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
              {CANVAS_SIZES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setCanvasSize(s)}
                  style={{
                    padding: '12px 8px', borderRadius: 7, textAlign: 'center',
                    background: canvasSize.label === s.label ? 'rgba(0,145,255,0.10)' : '#1e1e1e',
                    border: `1px solid ${canvasSize.label === s.label ? '#0091ff' : '#252525'}`,
                    color: canvasSize.label === s.label ? '#0091ff' : '#666',
                    cursor: 'pointer', transition: 'all 100ms',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'center', marginBottom: 5,
                    opacity: canvasSize.label === s.label ? 1 : 0.4,
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.6 }}>{s.width}×{s.height}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              style={{
                width: '100%', padding: '9px', borderRadius: 6,
                background: '#0091ff', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                fontFamily: 'inherit', transition: 'background 80ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0080e6')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0091ff')}
            >
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
