'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ScanPage() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [clientNom, setClientNom] = useState('')
  const [uid, setUid] = useState('')
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}) }
  }, [])

  const startScanner = async () => {
    setStatus('scanning')
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            await scanner.stop()
            const scannedUid = decodedText.split('/').pop() || decodedText
            await handleScan(scannedUid)
          },
          () => {}
        )
      } catch (e) {
        setStatus('idle')
      }
    }, 300)
  }

  const handleScan = async (scannedUid: string) => {
    setUid(scannedUid)
    const { data: carte } = await supabase
      .from('cartes')
      .select('*, clients(*)')
      .eq('uid_rfid', scannedUid)
      .single()

    if (!carte) { setStatus('error'); return }
    await supabase.from('scans').insert({ uid_carte: scannedUid })
    setClientNom(`${carte.clients?.prenom} ${carte.clients?.nom}`)
    setStatus('success')
  }

  const reset = () => {
    setStatus('idle')
    setClientNom('')
    setUid('')
  }

  return (
    <div className="min-h-screen bg-[#2C2A25] flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#3C3A35]">
        <h1 className="text-lg font-medium tracking-widest text-[#F7F4EE]">HADIYA</h1>
        <span className="text-xs text-[#BA7517] uppercase tracking-wider">Scanner</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">

        {status === 'idle' && (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="w-24 h-24 rounded-full border-2 border-[#BA7517] flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#BA7517" strokeWidth="1.5">
                <path d="M4 4h10M26 4h10M4 36h10M26 36h10M4 4v10M36 4v10M4 36v-10M36 36v-10"/>
                <rect x="12" y="12" width="16" height="16" rx="2"/>
              </svg>
            </div>
            <p className="text-[#F7F4EE] text-center text-sm opacity-70">
              Pointez la caméra vers le QR code du client
            </p>
            <button onClick={startScanner}
              className="w-full bg-[#BA7517] text-white rounded-2xl py-4 text-base font-medium hover:opacity-90 transition">
              Ouvrir la caméra
            </button>
            <div className="w-full border-t border-[#3C3A35] pt-4">
              <p className="text-xs text-[#8A8275] text-center mb-3">ou entrer l'UID manuellement</p>
              <div className="flex gap-2">
                <input
                  placeholder="UID de la carte..."
                  value={uid}
                  onChange={e => setUid(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan(uid)}
                  className="flex-1 bg-[#3C3A35] border border-[#4A4845] rounded-xl px-4 py-3 text-sm text-[#F7F4EE] outline-none focus:border-[#BA7517]"
                />
                <button onClick={() => handleScan(uid)}
                  className="bg-[#BA7517] text-white rounded-xl px-4 text-sm font-medium">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'scanning' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div
              id="qr-reader"
              style={{
                width: '100%',
                maxWidth: '400px',
                minHeight: '300px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#1a1a1a',
              }}
            />
            <p className="text-[#BA7517] text-sm animate-pulse">Scan en cours...</p>
            <button
              onClick={() => { scannerRef.current?.stop().catch(() => {}); setStatus('idle') }}
              className="text-xs text-[#8A8275] underline">
              Annuler
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-[#EAF3DE] border border-[#9FD490] flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-medium text-[#F7F4EE]">Scan réussi !</h2>
            <p className="text-[#BA7517] text-base font-medium">{clientNom}</p>
            <p className="text-xs text-[#8A8275] text-center">
              La fiche client s'ouvre automatiquement sur le dashboard
            </p>
            <button onClick={reset}
              className="w-full border border-[#3C3A35] text-[#F7F4EE] rounded-2xl py-3 text-sm mt-4 hover:bg-[#3C3A35] transition">
              Scanner une autre carte
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-20 h-20 rounded-full bg-[#FCEBEB] border border-[#F7C1C1] flex items-center justify-center">
              <span className="text-3xl">✗</span>
            </div>
            <h2 className="text-lg font-medium text-[#F7F4EE]">Carte introuvable</h2>
            <button onClick={reset}
              className="w-full bg-[#BA7517] text-white rounded-2xl py-3 text-sm font-medium mt-4">
              Réessayer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}