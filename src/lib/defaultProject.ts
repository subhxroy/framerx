import type { Element } from '@/store/editorStore'

function baseElement(id: string, type: Element['type'], name: string): Element {
  return {
    id,
    type,
    name,
    x: 0,
    y: 0,
    width: type === 'text' ? 200 : 240,
    height: type === 'text' ? 40 : 160,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    children: [],
    parentId: null,
    style: {},
  }
}

function text(
  id: string,
  name: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId: string,
  options: Partial<NonNullable<Element['text']>> = {},
): Element {
  return {
    ...baseElement(id, 'text', name),
    x,
    y,
    width,
    height,
    parentId,
    text: {
      content,
      fontSize: 16,
      fontWeight: 400,
      color: '#111111',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      ...options,
    },
  }
}

function frame(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId: string | null,
  style: Element['style'] = {},
  children: string[] = [],
): Element {
  return {
    ...baseElement(id, 'frame', name),
    x,
    y,
    width,
    height,
    parentId,
    style,
    children,
  }
}

export function createStarterProjectData(width = 1280, height = 900) {
  const pageW = width || 1280
  const pageH = Math.max(height || 900, 900)
  const ids = {
    page: 'starter_page_home',
    navbar: 'starter_navbar',
    brand: 'starter_brand',
    navLinks: 'starter_nav_links',
    linkWork: 'starter_link_work',
    linkServices: 'starter_link_services',
    linkContact: 'starter_link_contact',
    navCta: 'starter_nav_cta',
    navCtaText: 'starter_nav_cta_text',
    hero: 'starter_hero',
    eyebrow: 'starter_eyebrow',
    headline: 'starter_headline',
    subhead: 'starter_subhead',
    heroCtas: 'starter_hero_ctas',
    primaryCta: 'starter_primary_cta',
    primaryCtaText: 'starter_primary_cta_text',
    secondaryCta: 'starter_secondary_cta',
    secondaryCtaText: 'starter_secondary_cta_text',
    media: 'starter_media',
    mediaGlow: 'starter_media_glow',
    mediaPanel: 'starter_media_panel',
    featureRow: 'starter_feature_row',
    feature1: 'starter_feature_1',
    feature2: 'starter_feature_2',
    feature3: 'starter_feature_3',
    feature1Title: 'starter_feature_1_title',
    feature2Title: 'starter_feature_2_title',
    feature3Title: 'starter_feature_3_title',
    feature1Body: 'starter_feature_1_body',
    feature2Body: 'starter_feature_2_body',
    feature3Body: 'starter_feature_3_body',
  }

  const elements: Record<string, Element> = {}

  elements[ids.page] = frame(
    ids.page,
    'Home',
    96,
    72,
    pageW,
    pageH,
    null,
    {
      backgroundColor: '#f7f7f4',
      overflow: 'hidden',
      boxShadow: [{ x: 0, y: 18, blur: 60, spread: 0, color: 'rgba(0,0,0,0.35)' }],
    },
    [ids.navbar, ids.hero, ids.featureRow],
  )

  elements[ids.navbar] = frame(ids.navbar, 'Navbar', 0, 0, pageW, 76, ids.page, {
    backgroundColor: 'rgba(247,247,244,0.92)',
    border: '1px solid rgba(20,20,20,0.08)',
    backdropBlur: 14,
  }, [ids.brand, ids.navLinks, ids.navCta])
  elements[ids.navbar].autoLayout = {
    enabled: true,
    direction: 'horizontal',
    gap: 28,
    padding: { top: 0, right: 44, bottom: 0, left: 44 },
    alignItems: 'center',
    justifyContent: 'start',
    wrap: false,
  }

  elements[ids.brand] = text(ids.brand, 'Brand', 'Northstar', 0, 0, 180, 28, ids.navbar, {
    fontSize: 22,
    fontWeight: 720,
    color: '#111111',
    lineHeight: 1.1,
  })

  elements[ids.navLinks] = frame(ids.navLinks, 'Links', 0, 0, 1, 28, ids.navbar, {}, [ids.linkWork, ids.linkServices, ids.linkContact])
  elements[ids.navLinks].sizing = { width: 'fill', height: 'fixed' }
  elements[ids.navLinks].autoLayout = {
    enabled: true,
    direction: 'horizontal',
    gap: 24,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    alignItems: 'center',
    justifyContent: 'center',
    wrap: false,
  }
  elements[ids.linkWork] = text(ids.linkWork, 'Work Link', 'Work', 0, 0, 48, 20, ids.navLinks, { fontSize: 14, color: '#555555' })
  elements[ids.linkServices] = text(ids.linkServices, 'Services Link', 'Services', 0, 0, 72, 20, ids.navLinks, { fontSize: 14, color: '#555555' })
  elements[ids.linkContact] = text(ids.linkContact, 'Contact Link', 'Contact', 0, 0, 68, 20, ids.navLinks, { fontSize: 14, color: '#555555' })

  elements[ids.navCta] = frame(ids.navCta, 'Header Button', 0, 0, 120, 38, ids.navbar, {
    backgroundColor: '#111111',
    borderRadius: 8,
  }, [ids.navCtaText])
  elements[ids.navCta].autoLayout = {
    enabled: true,
    direction: 'horizontal',
    gap: 0,
    padding: { top: 0, right: 18, bottom: 0, left: 18 },
    alignItems: 'center',
    justifyContent: 'center',
    wrap: false,
  }
  elements[ids.navCtaText] = text(ids.navCtaText, 'Button Label', 'Start', 0, 0, 48, 18, ids.navCta, {
    fontSize: 14,
    fontWeight: 620,
    color: '#ffffff',
    textAlign: 'center',
  })

  elements[ids.hero] = frame(ids.hero, 'Hero Section', 44, 132, pageW - 88, 440, ids.page, {
    backgroundColor: '#edece7',
    borderRadius: 22,
    overflow: 'hidden',
  }, [ids.eyebrow, ids.headline, ids.subhead, ids.heroCtas, ids.media])

  elements[ids.eyebrow] = text(ids.eyebrow, 'Eyebrow', 'DESIGN STUDIO', 56, 58, 220, 24, ids.hero, {
    fontSize: 12,
    fontWeight: 700,
    color: '#7a6f5e',
    letterSpacing: 1.8,
  })
  elements[ids.headline] = text(ids.headline, 'Headline', 'Launch polished sites without code.', 54, 96, 540, 154, ids.hero, {
    fontSize: 60,
    fontWeight: 760,
    color: '#141414',
    lineHeight: 1.03,
    letterSpacing: -1.2,
  })
  elements[ids.subhead] = text(ids.subhead, 'Subheadline', 'Design responsive pages, wire interactions, manage content, and publish from one visual canvas.', 58, 270, 470, 68, ids.hero, {
    fontSize: 18,
    color: '#5f5a50',
    lineHeight: 1.45,
  })

  elements[ids.heroCtas] = frame(ids.heroCtas, 'Hero Actions', 58, 356, 306, 48, ids.hero, {}, [ids.primaryCta, ids.secondaryCta])
  elements[ids.heroCtas].autoLayout = {
    enabled: true,
    direction: 'horizontal',
    gap: 12,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    alignItems: 'center',
    justifyContent: 'start',
    wrap: false,
  }
  elements[ids.primaryCta] = frame(ids.primaryCta, 'Primary Button', 0, 0, 142, 46, ids.heroCtas, {
    backgroundColor: '#0d0d0d',
    borderRadius: 10,
  }, [ids.primaryCtaText])
  elements[ids.primaryCta].autoLayout = { enabled: true, direction: 'horizontal', gap: 0, padding: { top: 0, right: 18, bottom: 0, left: 18 }, alignItems: 'center', justifyContent: 'center', wrap: false }
  elements[ids.primaryCtaText] = text(ids.primaryCtaText, 'Primary Label', 'Get Started', 0, 0, 92, 20, ids.primaryCta, { color: '#ffffff', fontSize: 14, fontWeight: 650, textAlign: 'center' })

  elements[ids.secondaryCta] = frame(ids.secondaryCta, 'Secondary Button', 0, 0, 138, 46, ids.heroCtas, {
    backgroundColor: 'rgba(255,255,255,0.46)',
    border: '1px solid rgba(20,20,20,0.12)',
    borderRadius: 10,
  }, [ids.secondaryCtaText])
  elements[ids.secondaryCta].autoLayout = { enabled: true, direction: 'horizontal', gap: 0, padding: { top: 0, right: 18, bottom: 0, left: 18 }, alignItems: 'center', justifyContent: 'center', wrap: false }
  elements[ids.secondaryCtaText] = text(ids.secondaryCtaText, 'Secondary Label', 'See Work', 0, 0, 80, 20, ids.secondaryCta, { color: '#161616', fontSize: 14, fontWeight: 620, textAlign: 'center' })

  elements[ids.media] = frame(ids.media, 'Hero Visual', pageW - 522, 54, 430, 330, ids.hero, {
    backgroundColor: '#171717',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: [{ x: 0, y: 28, blur: 72, spread: 0, color: 'rgba(0,0,0,0.26)' }],
  }, [ids.mediaGlow, ids.mediaPanel])
  elements[ids.mediaGlow] = frame(ids.mediaGlow, 'Accent Gradient', 26, 28, 378, 274, ids.media, {
    backgroundColor: '#90f0cd',
    borderRadius: 999,
    blur: 34,
  })
  elements[ids.mediaGlow].opacity = 0.74
  elements[ids.mediaPanel] = frame(ids.mediaPanel, 'Preview Panel', 78, 82, 272, 172, ids.media, {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.65)',
    backdropBlur: 18,
  })

  elements[ids.featureRow] = frame(ids.featureRow, 'Features', 44, 620, pageW - 88, 202, ids.page, {}, [ids.feature1, ids.feature2, ids.feature3])
  elements[ids.featureRow].autoLayout = { enabled: true, direction: 'horizontal', gap: 18, padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignItems: 'stretch', justifyContent: 'center', wrap: false }
  for (const [cardId, titleId, bodyId, title, body] of [
    [ids.feature1, ids.feature1Title, ids.feature1Body, 'Visual editing', 'Draw layouts directly on the canvas with precise handles.'],
    [ids.feature2, ids.feature2Title, ids.feature2Body, 'Responsive by default', 'Switch breakpoints and override only what changes.'],
    [ids.feature3, ids.feature3Title, ids.feature3Body, 'Publish ready', 'Animations, CMS, and code export stay close at hand.'],
  ] as const) {
    elements[cardId] = frame(cardId, title, 0, 0, 1, 202, ids.featureRow, {
      backgroundColor: '#ffffff',
      border: '1px solid rgba(20,20,20,0.08)',
      borderRadius: 18,
      boxShadow: [{ x: 0, y: 12, blur: 38, spread: 0, color: 'rgba(0,0,0,0.07)' }],
    }, [titleId, bodyId])
    elements[cardId].sizing = { width: 'fill', height: 'fixed' }
    elements[titleId] = text(titleId, 'Title', title, 26, 30, 260, 30, cardId, { fontSize: 22, fontWeight: 720, color: '#171717', lineHeight: 1.2 })
    elements[bodyId] = text(bodyId, 'Body', body, 26, 76, 278, 56, cardId, { fontSize: 15, color: '#68645d', lineHeight: 1.45 })
  }

  return {
    elements,
    rootElementIds: [ids.page],
    canvas: { x: 110, y: 28, scale: 0.62 },
  }
}

export function looksLikePlaceholderProject(elements: Record<string, Element>, rootIds: string[]) {
  if (rootIds.length === 0) return true
  if (rootIds.length > 4) return false

  return rootIds.every((id) => {
    const el = elements[id]
    if (!el) return true
    const hasChildren = (el.children?.length ?? 0) > 0
    const hasStyle = Object.keys(el.style ?? {}).length > 0
    return el.type === 'frame' && el.name === 'Frame' && !hasChildren && !hasStyle
  })
}
