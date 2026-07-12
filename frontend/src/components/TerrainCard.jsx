import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';

export default function TerrainCard({ terrain }) {
  const primaryPhoto = terrain.terrain_photos?.find(p => p.is_primary) || terrain.terrain_photos?.[0];

  return (
    <Link to={`/terrain/${terrain.id}`} className="card group">
      <div className="relative h-48 overflow-hidden">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.photo_url}
            alt={terrain.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <FiMapPin className="text-orange-400 text-4xl" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-orange-600 text-white text-sm font-bold px-3 py-1 rounded-full">
          {terrain.price_per_hour} XOF/h
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
          {terrain.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
          <FiMapPin size={14} />
          <span>{terrain.neighborhood}, {terrain.city}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
          <FiClock size={14} />
          <span>{terrain.opening_time?.substring(0, 5)} - {terrain.closing_time?.substring(0, 5)}</span>
        </div>

        {terrain.description && (
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
            {terrain.description}
          </p>
        )}
      </div>
    </Link>
  );
}
