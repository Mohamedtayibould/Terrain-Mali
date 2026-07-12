const axios = require('axios');

const ORANGE_MONEY_API_URL = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';
const ORANGE_MONEY_MERCHANT_KEY = process.env.ORANGE_MONEY_MERCHANT_KEY;
const ORANGE_MONEY_API_KEY = process.env.ORANGE_MONEY_API_KEY;

async function getAccessToken() {
  const response = await axios.post(
    'https://api.orange.com/oauth/v3/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ORANGE_MONEY_MERCHANT_KEY}:${ORANGE_MONEY_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return response.data.access_token;
}

async function initiatePayment({ amount, phoneNumber, reference, description }) {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${ORANGE_MONEY_API_URL}/webpayment`,
      {
        merchant_key: ORANGE_MONEY_MERCHANT_KEY,
        currency: 'XOF',
        order_id: reference,
        amount: amount,
        return_url: `${process.env.FRONTEND_URL}/confirmation`,
        cancel_url: `${process.env.FRONTEND_URL}/reservation`,
        notif_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        lang: 'fr',
        reference: description
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      payment_url: response.data.payment_url,
      pay_token: response.data.pay_token,
      notif_token: response.data.notif_token,
      pay_token: response.data.pay_token,
      txnid: response.data.txnid
    };
  } catch (error) {
    console.error('Orange Money API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de l\'initiation du paiement'
    };
  }
}

async function checkPaymentStatus(payToken) {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      `${ORANGE_MONEY_API_URL}/webpayment/${payToken}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return {
      success: true,
      status: response.data.status,
      txnid: response.data.txnid,
      order_id: response.data.order_id
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur de verification'
    };
  }
}

module.exports = { initiatePayment, checkPaymentStatus, getAccessToken };
