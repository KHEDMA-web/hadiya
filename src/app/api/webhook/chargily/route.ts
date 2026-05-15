import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

async function verifyChargilySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.CHARGILY_SECRET_KEY
  if (!secret) return false
  const signature = req.headers.get('signature')
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const valid = await verifyChargilySignature(req, rawBody)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { randomUUID } = await import('crypto')
  const body = JSON.parse(rawBody)

  // Ignorer tout ce qui n'est pas un paiement confirmé
  if (body.type !== 'checkout.paid') {
    return NextResponse.json({ received: true })
  }

  const meta = body.data?.metadata
  if (!meta) {
    return NextResponse.json({ error: 'no metadata' }, { status: 400 })
  }

  const amount: number = body.data?.amount ?? 0
  const salonId: string | null = meta.salonId || null

  // 1. Créer ou récupérer le client
  let clientId: string

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('telephone', meta.beneficiaryPhone)
    .single()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        prenom:         meta.beneficiaryFirstName,
        nom:            meta.beneficiaryLastName,
        telephone:      meta.beneficiaryPhone,
        email:          meta.beneficiaryEmail    || null,
        date_naissance: meta.beneficiaryBirthDate || null,
        niveau:         'Bronze',
        points:         0,
        ...(salonId ? { salon_id: salonId } : {}),
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      return NextResponse.json({ error: 'Erreur création client' }, { status: 500 })
    }
    clientId = newClient.id
  }

  // 2. Créer la carte cadeau (expire dans 1 an)
  const uid = randomUUID()
  const expiration = new Date()
  expiration.setFullYear(expiration.getFullYear() + 1)

  const { data: carte, error: carteError } = await supabase
    .from('cartes')
    .insert({
      client_id:       clientId,
      uid_rfid:        uid,
      type:            'cadeau',
      solde:           amount,
      message_perso:   meta.message || null,
      offert_par:      meta.offeredBy,
      date_expiration: expiration.toISOString(),
      source:          'online',
      ...(salonId ? { salon_id: salonId } : {}),
    })
    .select('id')
    .single()

  if (carteError || !carte) {
    return NextResponse.json({ error: 'Erreur création carte' }, { status: 500 })
  }

  // 3. Enregistrer la transaction
  await supabase.from('transactions').insert({
    carte_id:    carte!.id,
    type:        'cadeau',
    montant:     amount,
    description: `Carte cadeau en ligne — offerte par ${meta.offeredBy}`,
  })

  // 4. Créer la notification dashboard (realtime)
  await supabase.from('notifications').insert({
    type:    'nouvelle_carte_cadeau',
    titre:   'Nouvelle carte cadeau 🎁',
    message: `${meta.beneficiaryFirstName} ${meta.beneficiaryLastName} a reçu une carte de ${amount.toLocaleString('fr-FR')} DA offerte par ${meta.offeredBy}`,
    lu:      false,
    meta: {
      carte_id:   carte.id,
      client_id:  clientId,
      montant:    amount,
      offert_par: meta.offeredBy,
    },
  })

  // 5. Déclencher n8n pour WhatsApp + email + PDF
  if (process.env.N8N_WEBHOOK_URL) {
    await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone:      meta.beneficiaryPhone,
        email:      meta.beneficiaryEmail,
        prenom:     meta.beneficiaryFirstName,
        nom:        meta.beneficiaryLastName,
        montant:    amount,
        message:    meta.message,
        offertPar:  meta.offeredBy,
        carteId:    carte.id,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
