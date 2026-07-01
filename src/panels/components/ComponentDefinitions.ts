import type { Element } from '@/store/editorStore'

export interface ComponentDefinition {
  id: string
  name: string
  category: string
  description: string
  create: (x: number, y: number) => { elements: Partial<Element>[]; rootId: string }
}

let idCounter = 1000
const genId = () => `comp_${idCounter++}`

export const componentDefinitions: ComponentDefinition[] = [
  // Navigation
  {
    id: 'navbar',
    name: 'Navbar',
    category: 'Navigation',
    description: 'Top navigation bar with logo and links',
    create: (x, y) => {
      const frameId = genId()
      const logoId = genId()
      const link1Id = genId()
      const link2Id = genId()
      const link3Id = genId()
      return {
        rootId: frameId,
        elements: [
          {
            id: frameId,
            type: 'frame',
            name: 'Navbar',
            x, y, width: 800, height: 64,
            style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' },
            children: [logoId, link1Id, link2Id, link3Id],
            autoLayout: {
              enabled: true,
              direction: 'horizontal',
              gap: 24,
              padding: { top: 0, right: 24, bottom: 0, left: 24 },
              alignItems: 'center',
              justifyContent: 'start',
              wrap: false,
            },
          },
          {
            id: logoId, type: 'text', name: 'Logo', x: 0, y: 0, width: 80, height: 24,
            parentId: frameId, text: { content: 'Logo', fontSize: 18, fontWeight: 700, color: '#f0f0f0', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 },
          },
          {
            id: link1Id, type: 'text', name: 'Link 1', x: 0, y: 0, width: 50, height: 20,
            parentId: frameId, text: { content: 'Home', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 },
          },
          {
            id: link2Id, type: 'text', name: 'Link 2', x: 0, y: 0, width: 60, height: 20,
            parentId: frameId, text: { content: 'About', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 },
          },
          {
            id: link3Id, type: 'text', name: 'Link 3', x: 0, y: 0, width: 70, height: 20,
            parentId: frameId, text: { content: 'Contact', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 },
          },
        ],
      }
    },
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    category: 'Navigation',
    description: 'Vertical sidebar with navigation items',
    create: (x, y) => {
      const frameId = genId()
      const item1 = genId(), item2 = genId(), item3 = genId(), item4 = genId()
      return {
        rootId: frameId,
        elements: [
          {
            id: frameId, type: 'frame', name: 'Sidebar',
            x, y, width: 240, height: 600,
            style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 8 },
            children: [item1, item2, item3, item4],
            autoLayout: {
              enabled: true, direction: 'vertical', gap: 4,
              padding: { top: 16, right: 12, bottom: 16, left: 12 },
              alignItems: 'stretch', justifyContent: 'start', wrap: false,
            },
          },
          { id: item1, type: 'text', name: 'Dashboard', x: 0, y: 0, width: 200, height: 32, parentId: frameId, style: { backgroundColor: 'rgba(0,145,255,0.12)', borderRadius: 4 }, text: { content: 'Dashboard', fontSize: 14, fontWeight: 500, color: '#0091ff', textAlign: 'left', lineHeight: 32, letterSpacing: 0 } },
          { id: item2, type: 'text', name: 'Projects', x: 0, y: 0, width: 200, height: 32, parentId: frameId, text: { content: 'Projects', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 32, letterSpacing: 0 } },
          { id: item3, type: 'text', name: 'Settings', x: 0, y: 0, width: 200, height: 32, parentId: frameId, text: { content: 'Settings', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 32, letterSpacing: 0 } },
          { id: item4, type: 'text', name: 'Help', x: 0, y: 0, width: 200, height: 32, parentId: frameId, text: { content: 'Help', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 32, letterSpacing: 0 } },
        ],
      }
    },
  },

  // Forms
  {
    id: 'btn-primary',
    name: 'Button',
    category: 'Forms',
    description: 'Primary action button',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'frame', name: 'Button', x, y, width: 120, height: 40, style: { backgroundColor: '#0091ff', borderRadius: 6 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'btn-ghost',
    name: 'Ghost Button',
    category: 'Forms',
    description: 'Ghost style button',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'frame', name: 'Ghost Button', x, y, width: 120, height: 40, style: { border: '1px solid #2a2a2a', borderRadius: 6 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'input-field',
    name: 'Input',
    category: 'Forms',
    description: 'Text input field',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'text', name: 'Input', x, y, width: 240, height: 36, style: { border: '1px solid #2a2a2a', borderRadius: 6 }, text: { content: 'Placeholder', fontSize: 14, fontWeight: 400, color: '#555555', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } },
        ],
      }
    },
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    description: 'Checkbox input',
    create: (x, y) => {
      const boxId = genId(), labelId = genId()
      return {
        rootId: boxId,
        elements: [
          { id: boxId, type: 'frame', name: 'Checkbox', x, y, width: 120, height: 24, children: [labelId], autoLayout: { enabled: true, direction: 'horizontal', gap: 8, padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignItems: 'center', justifyContent: 'start', wrap: false } },
          { id: labelId, type: 'text', name: 'Label', x: 0, y: 0, width: 80, height: 20, parentId: boxId, text: { content: 'Option', fontSize: 14, fontWeight: 400, color: '#f0f0f0', textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } },
        ],
      }
    },
  },
  {
    id: 'toggle',
    name: 'Toggle',
    category: 'Forms',
    description: 'Toggle switch',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'frame', name: 'Toggle', x, y, width: 40, height: 22, style: { backgroundColor: '#383838', borderRadius: 9999 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    category: 'Forms',
    description: 'Dropdown select',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'frame', name: 'Dropdown', x, y, width: 200, height: 36, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 6 }, children: [] },
        ],
      }
    },
  },

  // Layout
  {
    id: 'card',
    name: 'Card',
    category: 'Layout',
    description: 'Content card with padding',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'frame', name: 'Card', x, y, width: 280, height: 200, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 8 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'hero',
    name: 'Hero Section',
    category: 'Layout',
    description: 'Full-width hero with heading and CTA',
    create: (x, y) => {
      const frameId = genId(), headingId = genId(), subId = genId(), ctaId = genId()
      return {
        rootId: frameId,
        elements: [
          {
            id: frameId, type: 'frame', name: 'Hero', x, y, width: 800, height: 400,
            style: { backgroundColor: '#1f1f1f', borderRadius: 8 },
            children: [headingId, subId, ctaId],
            autoLayout: {
              enabled: true, direction: 'vertical', gap: 16,
              padding: { top: 60, right: 40, bottom: 60, left: 40 },
              alignItems: 'center', justifyContent: 'center', wrap: false,
            },
          },
          { id: headingId, type: 'text', name: 'Heading', x: 0, y: 0, width: 500, height: 48, parentId: frameId, text: { content: 'Build Something Great', fontSize: 36, fontWeight: 700, color: '#f0f0f0', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5 } },
          { id: subId, type: 'text', name: 'Subtitle', x: 0, y: 0, width: 400, height: 24, parentId: frameId, text: { content: 'Create stunning websites with FramerX', fontSize: 16, fontWeight: 400, color: '#8a8a8a', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } },
          { id: ctaId, type: 'frame', name: 'CTA Button', x: 0, y: 0, width: 140, height: 44, parentId: frameId, style: { backgroundColor: '#0091ff', borderRadius: 6 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'feature-grid',
    name: 'Feature Grid',
    category: 'Layout',
    description: '3-column feature grid',
    create: (x, y) => {
      const frameId = genId()
      const c1 = genId(), c2 = genId(), c3 = genId()
      return {
        rootId: frameId,
        elements: [
          {
            id: frameId, type: 'frame', name: 'Feature Grid', x, y, width: 800, height: 300,
            children: [c1, c2, c3],
            autoLayout: {
              enabled: true, direction: 'horizontal', gap: 24,
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
              alignItems: 'stretch', justifyContent: 'center', wrap: false,
            },
          },
          { id: c1, type: 'frame', name: 'Feature 1', x: 0, y: 0, width: 250, height: 300, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 8 }, children: [] },
          { id: c2, type: 'frame', name: 'Feature 2', x: 0, y: 0, width: 250, height: 300, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 8 }, children: [] },
          { id: c3, type: 'frame', name: 'Feature 3', x: 0, y: 0, width: 250, height: 300, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 8 }, children: [] },
        ],
      }
    },
  },
  {
    id: 'pricing',
    name: 'Pricing Table',
    category: 'Layout',
    description: '3-tier pricing cards',
    create: (x, y) => {
      const frameId = genId()
      const c1 = genId(), c2 = genId(), c3 = genId()
      return {
        rootId: frameId,
        elements: [
          {
            id: frameId, type: 'frame', name: 'Pricing', x, y, width: 800, height: 400,
            children: [c1, c2, c3],
            autoLayout: {
              enabled: true, direction: 'horizontal', gap: 16,
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
              alignItems: 'stretch', justifyContent: 'center', wrap: false,
            },
          },
          { id: c1, type: 'frame', name: 'Basic', x: 0, y: 0, width: 250, height: 400, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 12 }, children: [] },
          { id: c2, type: 'frame', name: 'Pro', x: 0, y: 0, width: 250, height: 400, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '2px solid #0091ff', borderRadius: 12 }, children: [] },
          { id: c3, type: 'frame', name: 'Enterprise', x: 0, y: 0, width: 250, height: 400, parentId: frameId, style: { backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 12 }, children: [] },
        ],
      }
    },
  },

  // Typography
  {
    id: 'heading',
    name: 'Heading',
    category: 'Typography',
    description: 'Large heading text',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'text', name: 'Heading', x, y, width: 400, height: 48, text: { content: 'Heading Text', fontSize: 32, fontWeight: 700, color: '#f0f0f0', textAlign: 'left', lineHeight: 1.2, letterSpacing: -0.5 } },
        ],
      }
    },
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    category: 'Typography',
    description: 'Body paragraph text',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'text', name: 'Paragraph', x, y, width: 400, height: 60, text: { content: 'This is a paragraph of text. You can edit this content by double-clicking.', fontSize: 14, fontWeight: 400, color: '#8a8a8a', textAlign: 'left', lineHeight: 1.6, letterSpacing: 0 } },
        ],
      }
    },
  },
  {
    id: 'code-block',
    name: 'Code Block',
    category: 'Typography',
    description: 'Monospace code snippet',
    create: (x, y) => {
      const id = genId()
      return {
        rootId: id,
        elements: [
          { id, type: 'text', name: 'Code', x, y, width: 400, height: 80, style: { backgroundColor: '#1f1f1f', borderRadius: 6, border: '1px solid #2a2a2a' }, text: { content: 'const greeting = "Hello World";', fontSize: 13, fontWeight: 400, color: '#f0f0f0', textAlign: 'left', lineHeight: 1.6, letterSpacing: 0 } },
        ],
      }
    },
  },
]
