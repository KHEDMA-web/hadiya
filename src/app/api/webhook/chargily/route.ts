import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Ignorer tout ce qui n'est pas un paiement confirmé
  if (body.type !== 'checkout.paid') {
    return NextResponse.json({ received: true })
  }

  const meta = body.data?.metadata
  if (!meta) {
    return NextResponse.json({ error: 'no metadata' }, { status: 400 })
  }

  const amount: number = body.data?.amount ?? 0

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
        prenom:          meta.beneficiaryFirstName,
        nom:             meta.beneficiaryLastName,
        telephone:       meta.beneficiaryPhone,
        email:           meta.beneficiaryEmail    || null,
        date_naissance:  meta.beneficiaryBirthDate || null,
        niveau:          'Bronze',
        points:          0,
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      return NextResponse.json({ error: 'Erreur création client' }, { status: 500 })
    }
    clientId = newClient.id
  }

  // 2. Créer la carte cadeau (expire dans 1 an)
  const expiration = new Date()
  expiration.setFullYear(expiration.getFullYear() + 1)

  const { data: carte, error: carteError } = await supabase
    .from('cartes')
    .insert({
      client_id:     clientId,
      solde:         amount,
      solde_initial: amount,
      statut:        'active',
      type:          'cadeau',
      offert_par:    meta.offeredBy,
      message:       meta.message || null,
      expire_le:     expiration.toISOString(),
      source:        'online',
      niveau:        'Bronze',
      points:        0,
    })
    .select('id')
    .single()

  if (carteError || !carte) {
    return NextResponse.json({ error: 'Erreur création carte' }, { status: 500 })
  }

  // 3. Enregistrer la transaction
  await supabase.from('transactions').insert({
    carte_id:    carte.id,
    type:        'credit',
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
