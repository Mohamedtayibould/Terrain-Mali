const supabase = require('../config/supabase');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = header.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const profileFromMeta = data.user.raw_user_meta_data || data.user.user_metadata || {};
    let profile = {
      id: data.user.id,
      full_name: profileFromMeta.full_name || data.user.email,
      phone: profileFromMeta.phone || null,
      role: profileFromMeta.role || 'user'
    };

    try {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id);
      if (result.data && result.data.length > 0) {
        profile = result.data[0];
      }
    } catch (e) {
      console.log('Profile table fallback to user_metadata');
    }

    req.user = { ...data.user, profile };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Acces reserve aux administrateurs' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
