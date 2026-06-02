import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://nexhireapp.vercel.app')
  )
}

export const revalidate = 1800 // 30min

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = appUrl()
  const admin = createAdminClient()

  const { data } = await admin
    .from('jobs')
    .select('id, created_at')
    .eq('status', 'open_for_hunters')
    .order('created_at', { ascending: false })
    .limit(2000)

  const jobUrls: MetadataRoute.Sitemap = (data ?? []).map(j => ({
    url: `${host}/vagas/${j.id}`,
    lastModified: new Date(j.created_at),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [
    { url: `${host}/vagas`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${host}/termos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${host}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...jobUrls,
  ]
}
