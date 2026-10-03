import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchModels } from '../api/client';
import { Navbar, HeroSearch } from '../components/Navbar';

const PLATFORMS = ['Sahibinden', 'Arabam', 'VavaCars', 'Otokoç', 'CarTR'];
const POPULAR = [
  { key: 'kia-sportage', label: 'Kia Sportage', emoji: '🚙' },
  { key: 'fiat-egea', label: 'Fiat Egea', emoji: '🚗' },
  { key: 'renault-megane', label: 'Renault Megane', emoji: '🏎️' },
  { key: 'volkswagen-polo', label: 'Volkswagen Polo', emoji: '🚘' },
  { key: 'toyota-corolla', label: 'Toyota Corolla', emoji: '🚗' },
  { key: 'bmw-3-series', label: 'BMW 3 Serisi', emoji: '🚀' },
  { key: 'honda-civic', label: 'Honda Civic', emoji: '🚗' },
  { key: 'dacia-duster', label: 'Dacia Duster', emoji: '🚙' },
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (modelKey: string) => {
    navigate(`/results/${modelKey}`);
  };

  return (
    <div>
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__grid" />
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Türkiye'nin En Akıllı Araç Toplayıcısı
          </div>
          <h1 className="hero__title">
            En İyi Araç Fırsatını<br />
            <em>Tek Yerden Bul</em>
          </h1>
          <p className="hero__subtitle">
            Sahibinden, Arabam, VavaCars, Otokoç ve daha fazlası — tüm ilanlar
            OtoVago Skoru ile analiz edilmiş, en iyi fırsat anında önünüzde.
          </p>

          <HeroSearch onSearch={handleSearch} />

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num">17+</span>
              <span className="hero__stat-label">Model</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num">6</span>
              <span className="hero__stat-label">Platform</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num">AI</span>
              <span className="hero__stat-label">Gemini 2.5 Flash</span>
            </div>
            <div className="hero__stat-sep" />
            <div className="hero__stat">
              <span className="hero__stat-num">100</span>
              <span className="hero__stat-label">Üzerinden Skor</span>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SEARCHES */}
      <section className="section" style={{ background: 'var(--clr-bg-2)', paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: '24px' }}>
            <div className="section__label">Popüler Aramalar</div>
            <h2 className="section__title">Hangi Aracı Arıyorsunuz?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {POPULAR.map(p => (
              <button
                key={p.key}
                onClick={() => handleSearch(p.key)}
                style={{
                  background: 'var(--clr-surface)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  color: 'var(--clr-text-1)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,123,255,0.4)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-border)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{p.emoji}</span>
                {p.label}
                <span style={{ marginLeft: 'auto', color: 'var(--clr-primary)', fontSize: '0.8rem' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="nasil-calisir">
        <div className="container">
          <div className="section__header" style={{ textAlign: 'center' }}>
            <div className="section__label">Nasıl Çalışır</div>
            <h2 className="section__title">4 Adımda En İyi Fırsatı Bul</h2>
            <p className="section__subtitle">Yapay zeka destekli analiz sistemi saniyeler içinde çalışır</p>
          </div>
          <div className="steps">
            {[
              { num: '🔍', title: 'Arama Yap', desc: 'Marka ve model seçin. Gemini AI tüm platformlardaki ilanları tarar.' },
              { num: '⚙️', title: 'Normalleştirme', desc: 'Fiyatlar, kilometre ve hasar bilgileri otomatik olarak analiz edilir.' },
              { num: '📊', title: 'OtoVago Skoru', desc: 'Fiyat %40, km %30, hasar %20, yaş %10 ağırlıklı skor hesaplanır.' },
              { num: '🏆', title: 'En İyi Seçim', desc: 'En ucuz, F/P şampiyonu ve en temiz araç saniyeler içinde önünüzde.' },
            ].map((s, i) => (
              <div className="step fade-in" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step__num">{s.num}</div>
                <div className="step__title">{s.title}</div>
                <div className="step__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="section" id="platformlar">
        <div className="container">
          <div className="section__header" style={{ textAlign: 'center' }}>
            <div className="section__label">Kaynaklar</div>
            <h2 className="section__title">Türkiye'nin Önde Gelen Platformları</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '32px' }}>
            {PLATFORMS.map(p => (
              <div key={p} style={{
                background: 'var(--clr-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: '12px',
                padding: '20px 32px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--clr-text-2)',
              }}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" id="hakkinda">
        <div className="footer__inner">
          <div className="footer__brand">
            <div className="navbar__logo" style={{ marginBottom: '12px' }}>
              <div className="navbar__logo-icon">🚗</div>
              Oto<span style={{ color: 'var(--clr-primary)' }}>Vago</span>
            </div>
            <p className="footer__desc">
              Türkiye'nin ilk yapay zeka destekli ikinci el araç pazar yeri toplayıcısı.
              En iyi fırsatı bulmak artık çok kolay.
            </p>
          </div>
          <div>
            <div className="footer__col-title">Platformlar</div>
            <div className="footer__links">
              {PLATFORMS.map(p => <a key={p} className="footer__link" href="#">{p}</a>)}
            </div>
          </div>
          <div>
            <div className="footer__col-title">Popüler Modeller</div>
            <div className="footer__links">
              {POPULAR.slice(0, 5).map(p => (
                <button key={p.key} onClick={() => handleSearch(p.key)}
                  style={{ background: 'none', border: 'none', color: 'var(--clr-text-2)', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="footer__col-title">OtoVago</div>
            <div className="footer__links">
              <a className="footer__link" href="#">Nasıl Çalışır</a>
              <a className="footer__link" href="#">Skor Sistemi</a>
              <a className="footer__link" href="#">KVKK</a>
              <a className="footer__link" href="#">İletişim</a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="footer__copy">© 2026 OtoVago. Tüm hakları saklıdır.</div>
          <div className="footer__legal">
            <a className="footer__legal-link" href="#">Gizlilik Politikası</a>
            <a className="footer__legal-link" href="#">Kullanım Şartları</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
