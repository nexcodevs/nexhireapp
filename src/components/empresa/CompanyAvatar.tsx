'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface CompanyAvatarProps {
  name: string | null
  logoPath?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizePx: Record<NonNullable<CompanyAvatarProps['size']>, number> = {
  sm: 32,
  md: 44,
  lg: 64,
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

export default function CompanyAvatar({ name, logoPath, size = 'md' }: CompanyAvatarProps) {
  const px = sizePx[size]
  const url = useMemo(() => {
    if (!logoPath) return null
    const supabase = createClient()
    return supabase.storage.from('company_logos').getPublicUrl(logoPath).data.publicUrl
  }, [logoPath])

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: 'var(--r-md)',
        background: 'var(--bg-elev-2)',
        border: '1px solid var(--border-1)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      aria-label={name || 'Empresa'}
    >
      {url ? (
        <Image
          src={url}
          alt={name ? `Logo ${name}` : 'Logo'}
          width={px}
          height={px}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          unoptimized
        />
      ) : (
        <span
          className="mono"
          style={{
            fontSize: size === 'sm' ? '10px' : size === 'md' ? '13px' : '18px',
            fontWeight: 600,
            color: 'var(--text-3)',
            letterSpacing: '0.04em',
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  )
}
