import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  ogType?: string
  ogImage?: string
  noIndex?: boolean
}

const SITE_NAME = 'Framer'
const SITE_URL = 'https://framer.app'
const DEFAULT_DESC = 'Framer is the AI-powered visual website builder. Design, publish, and host stunning responsive websites with drag-and-drop simplicity, CMS, and animations.'
const DEFAULT_OG_IMAGE = 'https://framer.app/og-image.png'

export default function SEO({
  title,
  description = DEFAULT_DESC,
  canonical = SITE_URL,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SEOProps) {
  const pageTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – AI-Powered Visual Website Builder`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
