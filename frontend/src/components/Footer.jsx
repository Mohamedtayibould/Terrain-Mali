import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin className="text-orange-500 text-xl" />
              <span className="text-xl font-bold text-white">Terrain <span className="text-orange-500">Mali</span></span>
            </div>
            <p className="text-sm text-gray-400">
              La plateforme de reference pour la reservation de terrains de sport au Mali.
              Trouvez, reservez et payez facilement avec Orange Money.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Liens</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-gray-400 hover:text-orange-500 transition-colors">
                Accueil
              </Link>
              <Link to="/mes-reservations" className="block text-sm text-gray-400 hover:text-orange-500 transition-colors">
                Mes Reservations
              </Link>
              <Link to="/login" className="block text-sm text-gray-400 hover:text-orange-500 transition-colors">
                Connexion
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiPhone />
                <span>0693603562</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiMail />
                <span>tayibould.mohamed.23@ump.ac.ma</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          {new Date().getFullYear()} Terrain Mali. Tous droits reserves.
        </div>
      </div>
    </footer>
  );
}
