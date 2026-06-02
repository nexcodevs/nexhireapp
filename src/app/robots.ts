import type { MetadataRoute } from 'next'

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://nexhireapp.vercel.app')
  )
}

export default function robots(): MetadataRoute.Robots {
  const host = appUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/vagas', '/vagas/', '/termos', '/privacidade'],
        disallow: ['/login', '/signup', '/forgot-password', '/reset-password', '/empresa', '/hr', '/hunter', '/candidato', '/admin', '/perfil', '/api/'],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
  }
}
