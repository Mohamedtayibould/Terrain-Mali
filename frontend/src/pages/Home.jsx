import { useState, useEffect } from 'react';
import { fetchTerrains, fetchCities } from '../api/supabaseDirect';
import TerrainCard from '../components/TerrainCard';
import SearchBar from '../components/SearchBar';
import { FiMapPin, FiLoader } from 'react-icons/fi';

export default function Home() {
  const [terrains, setTerrains] = useState([]);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCities().then(c => setCities(c)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTerrains({ page, limit: 12, city: selectedCity, search })
      .then(({ terrains: t, pagination }) => {
        setTerrains(t);
        setTotalPages(pagination.totalPages);
      })
      .catch(err => console.error('Error fetching terrains:', err))
      .finally(() => setLoading(false));
  }, [search, selectedCity, page]);

  const cityIcons = {
    'Bamako': '🏙️', 'Sikasso': '🌿', 'Mopti': '🌊',
    'Koulikoro': '🌾', 'Segou': '☀️', 'Kayes': '🏜️',
    'Koutiala': '🌻', 'San': '⛰️'
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-orange-600 to-orange-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Reservez votre terrain <br />en quelques clics
          </h1>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Trouvez les meilleurs terrains de sport au Mali. Paiement simple et rapide avec Orange Money.
          </p>
        </div>
      </section>

      {cities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <FiMapPin className="text-orange-600" />
            <span className="font-semibold text-gray-700">Villes disponibles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCity(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCity
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              Toutes les villes
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => { setSelectedCity(city); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCity === city
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                {cityIcons[city] || '📍'} {city}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-8">
        {selectedCity && (
          <div className="mb-4">
            <span className="text-gray-500 text-sm">
              Terrains a <span className="font-semibold text-orange-600">{selectedCity}</span>
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FiLoader className="animate-spin text-orange-600 text-4xl" />
          </div>
        ) : terrains.length === 0 ? (
          <div className="text-center py-20">
            <FiMapPin className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Aucun terrain trouve</h3>
            <p className="text-gray-500 mt-2">Essayez de modifier vos criteres de recherche</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {terrains.map((terrain) => (
                <TerrainCard key={terrain.id} terrain={terrain} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      p === page
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-orange-50 border'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
