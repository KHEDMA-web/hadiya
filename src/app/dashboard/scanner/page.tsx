'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BackButton from '../_components/BackButton'
import { getUserProfile } from '@/lib/auth'

const NIVEAU_DARK: Record<string, { bg: string; text: string; accent: string }> = {
  Bronze:  { bg: 'rgba(113,43,19,0.3)',  text: '#D4915E', accent: '#D4915E' },
  Argent:  { bg: 'rgba(68,68,65,0.3)',   text: '#C8C5BE', accent: '#C8C5BE' },
  Or:      { bg: 'rgba(186,117,23,0.2)', text: '#FAC775', accent: '#FAC775' },
  Platine: { bg: 'rgba(60,52,137,0.3)',  text: '#9C94F0', accent: '#9C94F0' },
}

export default function Scanner() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [carte, setCarte] = useState<any>(null)
  const [montant, setMontant] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [rfidMode, setRfidMode] = useState(false)
  const [recentDebits, setRecentDebits] = useState<any[]>([])

  const uidRef = useRef<HTMLInputElement>(null)
  const montantRef = useRef<HTMLInputElement>(null)
  // Refs mirror state so blur/timeout callbacks always see the latest values
  const rfidModeRef = useRef(false)
  const carteFoundRef = useRef(false)

  const loadRecentDebits = async () => {
    const q = supabase
      .from('transactions')
      .select('id, montant, created_at, cartes(niveau, clients(prenom, nom))')
      .eq('type', 'debit')
      .order('created_at', { ascending: false })
      .limit(6)
    const { data } = salonIdRef.current ? await q.eq('salon_id', salonIdRef.current) : await q
    setRecentDebits(data ?? [])
  }

  const handleSearch = async (uidOverride?: string) => {
    const uidToUse = uidOverride || uid
    if (!uidToUse) return
    setLoading(true)
    setError('')
    setCarte(null)
    carteFoundRef.current = false
    setSuccess('')

    const { data } = await supabase
      .from('cartes')
      .select('*, clients(*)')
      .eq('uid_rfid', uidToUse)
      .single()

    if (!data) {
      setError('Carte introuvable')
    } else if (data.statut === 'expiree') {
      setError('Cette carte est expirée')
    } else {
      carteFoundRef.current = true
      setCarte(data)
      if (rfidModeRef.current) {
        setTimeout(() => montantRef.current?.focus(), 100)
      }
    }
    setLoading(false)
  }

  const handleDebit = async () => {
    if (!montant || !carte) return
    const amt = parseFloat(montant)
    if (amt > carte.solde) { setError('Solde insuffisant'); return }
    setLoading(true)

    const nouveauSolde = carte.solde - amt
    const pts = Math.round(amt / 100 * 1.5)

    await supabase.from('cartes').update({
      solde: nouveauSolde,
      points: carte.points + pts,
      statut: nouveauSolde === 0 ? 'epuisee' : 'active'
    }).eq('id', carte.id)

    await supabase.from('transactions').insert({
      carte_id: carte.id,
      type: 'debit',
      montant: amt,
      points_gagnes: pts,
      description: `Débit en salon — ${amt} DA`,
      ...(salonIdRef.current ? { salon_id: salonIdRef.current } : {}),
    })

    setCarte({ ...carte, solde: nouveauSolde, points: carte.points + pts })
    setSuccess(`${amt.toLocaleString('fr-FR')} DA débités · +${pts} points`)
    setMontant('')
    setLoading(false)
    loadRecentDebits()

    // En mode RFID : réinitialiser après 2s pour le prochain client
    if (rfidModeRef.current) {
      setTimeout(() => {
        setUid('')
        setCarte(null)
        carteFoundRef.current = false
        setSuccess('')
        uidRef.current?.focus()
      }, 2000)
    }
  }

  // Maintenir le focus sur UID en mode RFID tant qu'aucune carte n'est trouvée
  const handleUidBlur = () => {
    if (!rfidModeRef.current || carteFoundRef.current) return
    setTimeout(() => {
      if (rfidModeRef.current && !carteFoundRef.current) {
        uidRef.current?.focus()
      }
    }, 100)
  }

  const toggleRfidMode = () => {
    const next = !rfidMode
    setRfidMode(next)
    rfidModeRef.current = next
    if (next) {
      setUid('')
      setCarte(null)
      carteFoundRef.current = false
      setError('')
      setSuccess('')
      setTimeout(() => uidRef.current?.focus(), 50)
    }
  }

  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcReading, setNfcReading] = useState(false)
  const [qrScanning, setQrScanning] = useState(false)
  const qrScannerRef = useRef<any>(null)
  const salonIdRef = useRef<string | null>(null)

  useEffect(() => {
    if ('NDEFReader' in window) setNfcSupported(true)
    return () => { qrScannerRef.current?.stop().catch(() => {}) }
  }, [])

  const startQrScan = async () => {
    setQrScanning(true)
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-scanner-dash')
        qrScannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText: string) => {
            await scanner.stop()
            qrScannerRef.current = null
            setQrScanning(false)
            const scannedUid = decodedText.split('/').pop() || decodedText
            setUid(scannedUid)
            handleSearch(scannedUid)
          },
          () => {}
        )
      } catch { setQrScanning(false) }
    }, 300)
  }

  const stopQrScan = async () => {
    await qrScannerRef.current?.stop().catch(() => {})
    qrScannerRef.current = null
    setQrScanning(false)
  }

  const startNFC = async () => {
    if (!('NDEFReader' in window)) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndef = new (window as any).NDEFReader()
      await ndef.scan()
      setNfcReading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        const nfcUid = serialNumber.replace(/:/g, '').toUpperCase()
        setUid(nfcUid)
        setNfcReading(false)
        handleSearch(nfcUid)
      })
    } catch (err) {
      console.error('NFC error:', err)
      setNfcReading(false)
    }
  }

  useEffect(() => {
    getUserProfile().then(p => { salonIdRef.current = p?.salonId ?? null })
    loadRecentDebits()
  }, [])

  const niveau = carte?.niveau || 'Bronze'
  const avatarColors = NIVEAU_DARK[niveau] || NIVEAU_DARK.Bronze

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #18160F 0%, #1E1C18 100%)',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes rfid-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes rfid-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(186,117,23,0.5), 0 0 8px rgba(186,117,23,0.2); }
          50% { box-shadow: 0 0 0 2px rgba(186,117,23,0.95), 0 0 18px rgba(186,117,23,0.45); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #0F0E0A 0%, #18160F 100%)',
        borderBottom: '1px solid rgba(186,117,23,0.15)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '640px', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '20px 0',
        }}>
          <BackButton href="/dashboard" />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '14px', fontWeight: 500, color: '#F7F4EE', letterSpacing: '0.04em', margin: 0 }}>
              Scanner une carte
            </h1>
            <p style={{
              fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'rgba(247,244,238,0.3)', marginTop: '4px',
            }}>
              QR code ou numéro de carte
            </p>
          </div>

          {/* Bouton toggle RFID */}
          <button
            onClick={toggleRfidMode}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: rfidMode ? 'none' : '1px solid rgba(186,117,23,0.4)',
              background: rfidMode ? '#BA7517' : 'transparent',
              color: rfidMode ? '#FFFFFF' : '#BA7517',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {rfidMode ? 'RFID ON' : 'Mode RFID'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Indicateur "En attente" — visible uniquement en mode RFID sans carte */}
        {rfidMode && !carte && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 20px', borderRadius: '14px',
            background: 'rgba(186,117,23,0.07)',
            border: '1px solid rgba(186,117,23,0.2)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#BA7517', flexShrink: 0,
              animation: 'rfid-dot-pulse 1.2s ease-in-out infinite',
            }} />
            <p style={{
              fontSize: '11px', color: '#BA7517',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              fontWeight: 500, margin: 0,
            }}>
              En attente de la carte...
            </p>
          </div>
        )}

        {/* Recherche */}
        <div className="hd-card" style={{ padding: '24px' }}>
          <p style={{
            fontSize: '8px', fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.28em', color: 'rgba(247,244,238,0.35)', marginBottom: '16px',
          }}>
            Numéro de carte
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {nfcSupported && (
              <button
                onClick={startNFC}
                disabled={nfcReading}
                style={{
                  flex: 1,
                  background: nfcReading ? 'rgba(186,117,23,0.2)' : '#2C2A25',
                  color: nfcReading ? '#BA7517' : '#F7F4EE',
                  border: '1px solid rgba(186,117,23,0.3)',
                  borderRadius: 16, padding: '14px 16px',
                  fontSize: 13, fontWeight: 500,
                  cursor: nfcReading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 52,
                }}
              >
                {nfcReading ? '📡 Approcher...' : '📡 NFC'}
              </button>
            )}
            <button
              onClick={qrScanning ? stopQrScan : startQrScan}
              style={{
                flex: 1,
                background: qrScanning ? 'rgba(186,117,23,0.15)' : '#2C2A25',
                color: qrScanning ? '#BA7517' : '#F7F4EE',
                border: qrScanning ? '1px solid rgba(186,117,23,0.5)' : '1px solid rgba(186,117,23,0.3)',
                borderRadius: 16, padding: '14px 16px',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                minHeight: 52,
              }}
            >
              {qrScanning ? '✕ Annuler' : '📷 QR Code'}
            </button>
          </div>

          {qrScanning && (
            <div style={{ marginBottom: 12 }}>
              <div
                id="qr-scanner-dash"
                style={{
                  width: '100%', minHeight: 260, borderRadius: 16,
                  overflow: 'hidden', background: '#111',
                }}
              />
              <p style={{ textAlign: 'center', fontSize: 11, color: '#BA7517', marginTop: 8, letterSpacing: '0.1em' }}>
                Pointez vers le QR code du client...
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={uidRef}
              placeholder={rfidMode ? 'Approcher la carte RFID...' : "Coller l'UID ou scanner le QR..."}
              value={uid}
              onChange={e => setUid(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onBlur={handleUidBlur}
              className="hd-input"
              style={{
                flex: 1,
                ...(rfidMode ? { animation: 'rfid-border-glow 1.5s ease-in-out infinite' } : {}),
              }}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !uid}
              className="hd-btn-gold"
              style={{ whiteSpace: 'nowrap', padding: '14px 20px' }}
            >
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: '11px', color: '#E07070', marginTop: '12px' }}>{error}</p>
          )}
        </div>

        {/* Carte trouvée */}
        {carte && (
          <div className="hd-card" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Client header */}
            <div style={{
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
              borderBottom: '1px solid rgba(247,244,238,0.07)',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 600, flexShrink: 0,
                background: avatarColors.bg, color: avatarColors.text,
              }}>
                {carte.clients?.prenom?.[0]}{carte.clients?.nom?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#F7F4EE', letterSpacing: '0.04em' }}>
                  {carte.clients?.prenom} {carte.clients?.nom}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(247,244,238,0.4)', marginTop: '3px', letterSpacing: '0.1em' }}>
                  Niveau {carte.niveau} · {carte.points} pts
                </p>
              </div>
              <span style={{
                fontSize: '8px', fontWeight: 500, padding: '5px 12px',
                borderRadius: '20px', letterSpacing: '0.12em', textTransform: 'uppercase',
                background: avatarColors.bg, color: avatarColors.text,
                border: `1px solid ${avatarColors.text}30`,
              }}>
                {carte.niveau}
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{
                padding: '20px 24px',
                borderRight: '1px solid rgba(247,244,238,0.07)',
              }}>
                <p style={{ fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(247,244,238,0.3)', marginBottom: '8px' }}>
                  Solde disponible
                </p>
                <p style={{
                  fontFamily: 'var(--font-cormorant), Georgia, serif',
                  fontSize: '2.2rem', fontWeight: 300, color: '#BA7517', lineHeight: 1,
                }}>
                  {carte.solde?.toLocaleString('fr-FR')}
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-geist-sans)', color: 'rgba(247,244,238,0.4)', marginLeft: '6px' }}>DA</span>
                </p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(247,244,238,0.3)', marginBottom: '8px' }}>
                  Expire le
                </p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#F7F4EE' }}>
                  {carte.date_expiration
                    ? new Date(carte.date_expiration).toLocaleDateString('fr-FR')
                    : 'Sans limite'}
                </p>
              </div>
            </div>

            {/* Success banner */}
            {success && (
              <div style={{
                margin: '0 20px 16px',
                borderRadius: '14px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.25)',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(186,117,23,0.2)',
                }}>
                  <span style={{ fontSize: '11px', color: '#BA7517' }}>✓</span>
                </div>
                <p style={{ fontSize: '13px', color: '#BA7517', fontWeight: 500 }}>{success}</p>
              </div>
            )}

            {/* Débit form */}
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{
                fontSize: '8px', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '0.28em', color: 'rgba(247,244,238,0.35)', marginBottom: '12px',
              }}>
                Débiter un montant
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  ref={montantRef}
                  type="number"
                  placeholder="Montant (DA)"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDebit()}
                  className="hd-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleDebit}
                  disabled={loading || !montant}
                  className="hd-btn-gold"
                  style={{ whiteSpace: 'nowrap', padding: '14px 20px' }}
                >
                  {loading ? '...' : 'Valider'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historique récent */}
        {recentDebits.length > 0 && (
          <div className="hd-card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(247,244,238,0.35)', marginBottom: '16px' }}>
              Débits récents
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentDebits.map((t, i) => {
                const niv = (t as any).cartes?.niveau || 'Bronze'
                const colors = NIVEAU_DARK[niv] || NIVEAU_DARK.Bronze
                const client = (t as any).cartes?.clients
                return (
                  <div key={t.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: i < recentDebits.length - 1 ? '1px solid rgba(247,244,238,0.06)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0, background: colors.bg, color: colors.text }}>
                      {client?.prenom?.[0]}{client?.nom?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#F7F4EE', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client?.prenom} {client?.nom}
                      </p>
                      <p style={{ fontSize: 9, color: 'rgba(247,244,238,0.35)', margin: '2px 0 0', letterSpacing: '0.05em' }}>
                        {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {niv}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#BA7517', margin: 0, flexShrink: 0 }}>
                      −{(t.montant || 0).toLocaleString('fr-FR')} DA
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
