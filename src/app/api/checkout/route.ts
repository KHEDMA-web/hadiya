import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    amount,
    currency,
    salonId,
    beneficiaryFirstName,
    beneficiaryLastName,
    beneficiaryPhone,
    beneficiaryEmail,
    beneficiaryBirthDate,
    offeredBy,
    message,
  } = body

  if (!amount || !beneficiaryFirstName || !beneficiaryLastName || !beneficiaryPhone || !offeredBy) {
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
  }

  const res = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CHARGILY_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: currency || 'dzd',
      success_url: `${process.env.NEXT_PUBLIC_URL}/gift-card/success`,
      failure_url: `${process.env.NEXT_PUBLIC_URL}/gift-card/echec`,
      webhook_endpoint: `${process.env.NEXT_PUBLIC_URL}/api/webhook/chargily`,
      locale: 'ar',
      metadata: {
        salonId:              salonId              || null,
        beneficiaryFirstName,
        beneficiaryLastName,
        beneficiaryPhone,
        beneficiaryEmail:     beneficiaryEmail     || null,
        beneficiaryBirthDate: beneficiaryBirthDate || null,
        offeredBy,
        message: message || null,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { message?: string })?.message ?? 'Erreur Chargily.' },
      { status: 500 }
    )
  }

  const data = await res.json() as { checkout_url?: string }
  return NextResponse.json({ checkout_url: data.checkout_url })
}
