import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchModels } from '../api/client';

export function Navbar({ onSearch }: { onSearch?: (model: string) => void }) {
  const navigate = useNavigate();

  const handleLogoClick = () => navigate('/');

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div className="navbar__logo-icon">🚗</div>
          Oto<span>Vago</span>
        </div>
        <div className="navbar__links">
          <a href="#nasil-calisir" className="navbar__link">Nasıl Çalışır</a>
          <a href="#platformlar" className="navbar__link">Platformlar</a>
          <a href="#hakkinda" className="navbar__link">Hakkında</a>
        </div>
        <a href="#search" className="navbar__cta">Araç Bul</a>
      </div>
    </nav>
  );
}

interface HeroSearchProps {
  onSearch: (model: string) => void;
}

export function HeroSearch({ onSearch }: HeroSearchProps) {
  const { data: modelsData } = useQuery({ queryKey: ['models'], queryFn: fetchModels });
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const brands = modelsData
    ? [...new Set(modelsData.map(m => m.brand))].sort()
    : [];

  const modelsForBrand = modelsData
    ? modelsData.filter(m => m.brand === selectedBrand)
    : [];

  const handleSearch = () => {
    if (!selectedModel) return;
    onSearch(selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="hero__search-box" id="search">
      <div className="hero__search-row">
        <div className="hero__search-group">
          <label className="hero__search-label">Marka</label>
          <select
            className="hero__search-select"
            value={selectedBrand}
            onChange={e => { setSelectedBrand(e.target.value); setSelectedModel(''); }}
          >
            <option value="">Marka seçin</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="hero__search-group">
          <label className="hero__search-label">Model</label>
          <select
            className="hero__search-select"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={!selectedBrand}
          >
            <option value="">Model seçin</option>
            {modelsForBrand.map(m => <option key={m.key} value={m.key}>{m.display}</option>)}
          </select>
        </div>
        <div className="hero__search-group">
          <label className="hero__search-label">Popüler Aramalar</label>
          <select
            className="hero__search-select"
            onChange={e => { if (e.target.value) onSearch(e.target.value); }}
            value=""
          >
            <option value="">Hızlı seçim...</option>
            {modelsData?.slice(0, 8).map(m => (
              <option key={m.key} value={m.key}>{m.display}</option>
            ))}
          </select>
        </div>
        <button
          className="hero__search-btn"
          onClick={handleSearch}
          disabled={!selectedModel}
          onKeyDown={handleKeyDown}
          id="hero-search-btn"
        >
          <span>🔍</span> Fırsatları Bul
        </button>
      </div>
    </div>
  );
}
