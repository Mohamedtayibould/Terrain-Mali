import { FiMapPin } from 'react-icons/fi';

export default function FilterBar({ cities, selectedCity, onCityChange }) {
  return (
    <div className="flex items-center gap-3">
      <FiMapPin className="text-orange-600" />
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="input-field max-w-xs"
      >
        <option value="">Toutes les villes</option>
        {cities.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>
  );
}
