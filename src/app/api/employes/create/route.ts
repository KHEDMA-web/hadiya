import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, password, nom, prenom, telephone, role, permissions, salonId } = await req.json()

  if (!email || !password || !nom || !prenom || !salonId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: empError } = await admin.from('employes').insert({
    nom,
    prenom,
    telephone: telephone || null,
    email,
    role,
    actif: true,
    user_id: authData.user.id,
    permissions,
    salon_id: salonId,
  })

  if (empError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: empError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
