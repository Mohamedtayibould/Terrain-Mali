import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function PhotoGallery({ photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        Aucune photo disponible
      </div>
    );
  }

  const prev = () => setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      <div className="relative h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden">
        <img
          src={photos[currentIndex]?.photo_url}
          alt={`Photo ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <FiChevronRight size={20} />
          </button>
        </>
      )}

      <div className="flex justify-center gap-2 mt-3">
        {photos.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex ? 'bg-orange-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
