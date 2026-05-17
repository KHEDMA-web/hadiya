'use client'

import { useRouter } from 'next/navigation'
import LandingHero from './_components/landing/hero'
import FeatureShowcase from './_components/landing/features'
import PaiementLocal from './_components/landing/paiement'
import RealtimeSync from './_components/landing/sync'
import { NavBar, Differentiators, CallToAction, Footer } from './_components/landing/extras'

export default function Home() {
  const router = useRouter()
  const handleCTA = () => router.push('/login')

  return (
    <div style={{ background: '#F7F4EE' }}>
      <NavBar onCTA={handleCTA}/>
      <LandingHero onCTA={handleCTA}/>
      <div id="demo-anchor"/>
      <FeatureShowcase/>
      <RealtimeSync/>
      <Differentiators/>
      <PaiementLocal/>
      <CallToAction onCTA={handleCTA}/>
      <Footer/>
    </div>
  )
}
