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
        <p style={{ fontSize: 48, color: '#BA7517', marginBottom: 16 }}>✦</p>
        <p style={{ fontSize: 28, fontWeight: 300, color: '#F7F4EE',
          fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>H A D I Y A</p>
        <p style={{ fontSize: 13, color: '#8A8275', marginTop: 12,
          letterSpacing: '0.2em' }}>Scannez votre QR code</p>
      </div>
    </div>
  )
}
