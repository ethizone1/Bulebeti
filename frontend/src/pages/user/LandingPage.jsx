import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const LandingPage = () => {
  const { t } = useLanguage();
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="hero" style={{
        padding: 'var(--spacing-xxl) 0',
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-dim) 100%)',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ marginBottom: 'var(--spacing-md)' }}>{t('landing_hero_title')}</h1>
          <p style={{
            fontSize: '20px',
            maxWidth: '700px',
            margin: '0 auto var(--spacing-xl)',
            color: 'var(--on-surface-variant)'
          }}>
            {t('landing_hero_desc')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary btn-lg">{t('landing_get_started')}</Link>
            <Link to="/bulebet/the-golden-truffle/menu" className="btn btn-outline btn-lg">{t('landing_explore')}</Link>
          </div>
        </div>
      </section>

      {/* Value Proposition / Features */}
      <section id="features" style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-xl)'
          }}>
            <div style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ color: 'var(--gold)' }}>{t('landing_feat1_title')}</h3>
              <p>{t('landing_feat1_desc')}</p>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ color: 'var(--gold)' }}>{t('landing_feat2_title')}</h3>
              <p>{t('landing_feat2_desc')}</p>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ color: 'var(--gold)' }}>{t('landing_feat3_title')}</h3>
              <p>{t('landing_feat3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: 'var(--spacing-xxl) 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>{t('landing_pricing_title')}</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--spacing-lg)',
            margin: '0 auto'
          }}>
            {/* Silver Plan */}
            <div style={{
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--platinum)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{t('landing_tier_silver')}</h3>
              <div style={{ fontSize: '28px', fontWeight: '800', margin: '16px 0' }}>{t('landing_free')}</div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left', flex: 1, fontSize: '14px' }}>
                <li style={{ marginBottom: '10px' }}>{t('landing_silver_f1')}</li>
                <li style={{ marginBottom: '10px' }}>{t('landing_silver_f2')}</li>
                <li style={{ marginBottom: '10px', color: 'rgba(0,0,0,0.3)' }}>{t('landing_silver_f3')}</li>
                <li style={{ marginBottom: '10px', color: 'rgba(0,0,0,0.3)' }}>{t('landing_silver_f4')}</li>
              </ul>
              <Link to="/register" className="btn btn-outline" style={{ width: '100%' }}>{t('landing_select_silver')}</Link>
            </div>

            {/* Gold Plan */}
            <div style={{
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--platinum)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ color: 'var(--gold)', marginBottom: '4px' }}>{t('landing_tier_gold')}</h3>
              <div style={{ fontSize: '28px', fontWeight: '800', margin: '16px 0' }}>$250<span style={{ fontSize: '14px', opacity: 0.5 }}>{t('landing_year')}</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left', flex: 1, fontSize: '14px' }}>
                <li style={{ marginBottom: '10px' }}>{t('landing_gold_f1')}</li>
                <li style={{ marginBottom: '10px' }}>{t('landing_gold_f2')}</li>
                <li style={{ marginBottom: '10px' }}>{t('landing_gold_f3')}</li>
                <li style={{ marginBottom: '10px' }}>✓ Reservation SMS Alerts</li>
              </ul>
              <Link to="/register" className="btn btn-outline" style={{ width: '100%' }}>{t('landing_select_gold')}</Link>
            </div>

            {/* Platinum Plan */}
            <div style={{
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              border: '2px solid var(--gold)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--gold)', color: 'white', padding: '2px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>{t('landing_popular')}</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{t('landing_tier_plat')}</h3>
              <div style={{ fontSize: '28px', fontWeight: '800', margin: '16px 0' }}>$500<span style={{ fontSize: '14px', opacity: 0.5 }}>{t('landing_year')}</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left', flex: 1, fontSize: '13px' }}>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f1')}</li>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f2')}</li>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f3')}</li>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f4')}</li>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f5')}</li>
                <li style={{ marginBottom: '8px' }}>{t('landing_plat_f6')}</li>
              </ul>
              <Link to="/register" className="btn btn-primary" style={{ width: '100%' }}>{t('landing_select_plat')}</Link>
            </div>

            {/* Premium Plan */}
            <div style={{
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ color: 'var(--gold)', marginBottom: '4px' }}>{t('landing_tier_prem')}</h3>
              <div style={{ fontSize: '28px', fontWeight: '800', margin: '16px 0' }}>$1,000<span style={{ fontSize: '14px', opacity: 0.5 }}>{t('landing_year')}</span></div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left', flex: 1, fontSize: '12px' }}>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f1')}</li>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f2')}</li>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f3')}</li>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f4')}</li>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f5')}</li>
                <li style={{ marginBottom: '6px' }}>{t('landing_prem_f6')}</li>
              </ul>
              <Link to="/register" className="btn btn-gold" style={{ width: '100%' }}>{t('landing_select_prem')}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
