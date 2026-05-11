'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CarteIndex() {
  const router = useRouter()

  useEffect(() => {
    const uid = document.cookie
      .split('; ')
      .find(r => r.startsWith('hadiya_uid='))
      ?.split('=')[1]
    if (uid) {
      router.replace(`/carte/${uid}`)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A25', display: 'flex',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(186,117,23,0.2)', borderTopColor: '#BA7517',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
        <p style={{ fontSize: 28, fontWeight: 300, color: '#F7F4EE',
          fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>H A D I Y A</p>
      </div>
    </div>
  )
}
