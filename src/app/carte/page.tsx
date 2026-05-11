export default function CarteIndex() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#2C2A25',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      textAlign: 'center',
    }}>
      <div>
        <p style={{ fontSize: 48, marginBottom: 16, color: '#BA7517' }}>✦</p>
        <p style={{ fontSize: 28, fontWeight: 300, color: '#F7F4EE', marginBottom: 8, fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>
          H A D I Y A
        </p>
        <p style={{ fontSize: 13, color: '#8A8275', letterSpacing: '0.2em' }}>
          Scannez votre QR code pour accéder à votre carte
        </p>
      </div>
    </div>
  )
}