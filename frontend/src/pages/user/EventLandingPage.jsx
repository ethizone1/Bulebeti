import React from 'react';

const EventLandingPage = () => {
  return (
    <div className="event-landing">
      {/* Hero Section */}
      <section style={{
        height: '60vh',
        background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=2070") center/cover no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white'
      }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '64px', marginBottom: '16px', letterSpacing: '0.1em' }}>SUMMER TRUFFLE FESTIVAL</h1>
          <p style={{ fontSize: '24px', fontWeight: '300', fontStyle: 'italic', color: 'var(--gold)' }}>A Culinary Celebration of the Black Diamond</p>
        </div>
      </section>

      {/* Info Section */}
      <section style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>July 15th - August 15th</h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: 'var(--spacing-xl)' }}>
            Experience an exclusive five-course tasting menu curated by our executive chefs, featuring fresh summer truffles sourced directly from the Perigord region. Each course is paired with a vintage selection from our cellar.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-xl)',
            textAlign: 'left'
          }}>
            <div style={{ padding: 'var(--spacing-lg)', borderLeft: '2px solid var(--gold)' }}>
              <h4>The Menu</h4>
              <p style={{ fontSize: '14px' }}>Truffle Arancini, Hand-cut Tagliolini, Roasted Squab, and our signature Truffle Honey Pannacotta.</p>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', borderLeft: '2px solid var(--gold)' }}>
              <h4>The Pairing</h4>
              <p style={{ fontSize: '14px' }}>A selection of aged Barolos and Grand Cru Champagnes chosen to complement the earthiness of the truffle.</p>
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--spacing-xxl)' }}>
            <button className="btn btn-primary btn-lg">Secure Your Tickets</button>
            <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--on-surface-variant)' }}>Limited to 20 guests per evening.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventLandingPage;
