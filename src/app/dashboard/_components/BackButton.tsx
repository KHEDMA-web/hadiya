'use client'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  className?: string
}

export default function BackButton({ href, className = '' }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      className={`w-11 h-11 rounded-full border border-[#4A4840] flex items-center justify-center text-[#F7F4EE] active:bg-[#3A3830] transition-colors flex-shrink-0 ${className}`}
      aria-label="Retour"
      style={{ minWidth: 44, minHeight: 44 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}
