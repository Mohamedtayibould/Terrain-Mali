const crypto = require('crypto');

const verifyWebhook = (req, res, next) => {
  const secret = process.env.ORANGE_MONEY_WEBHOOK_SECRET;
  if (!secret) {
    return next();
  }

  const signature = req.headers['x-orange-signature'] || req.headers['x-webhook-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Signature manquante' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  next();
};

module.exports = { verifyWebhook };
