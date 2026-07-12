const supabase = require('../config/supabase');

const register = async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role: 'user' }
      }
    });

    if (error) throw error;

    res.status(201).json({
      message: 'Compte cree avec succes',
      user: data.user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

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

    res.json({
      user: data.user,
      profile,
      session: data.session
    });
  } catch (err) {
    res.status(401).json({ error: 'Identifiants incorrects' });
  }
};

const getProfile = async (req, res) => {
  try {
    let profile = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id);
      if (!error && data && data.length > 0) {
        profile = data[0];
      }
    } catch (e) {
      console.log('Profile table query failed, using user_metadata');
    }

    if (!profile) {
      const meta = req.user.raw_user_meta_data || req.user.user_metadata || {};
      profile = {
        id: req.user.id,
        full_name: meta.full_name || req.user.email,
        phone: meta.phone || null,
        role: meta.role || 'user',
        avatar_url: meta.avatar_url || null
      };
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, phone } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, phone, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };
