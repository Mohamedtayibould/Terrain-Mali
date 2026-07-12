const supabase = require('../config/supabase');
const { initiatePayment, checkPaymentStatus } = require('../services/orangeMoney');
const { generateReceipt } = require('../services/pdfService');
const { notifyGuardianReservation } = require('../services/notificationService');

const pay = async (req, res) => {
  try {
    const { reservation_id, phone_number } = req.body;
    const user_id = req.user.id;

    if (!reservation_id || !phone_number) {
      return res.status(400).json({ error: 'reservation_id et phone_number requis' });
    }

    // Get reservation
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, terrain:terrains(*)')
      .eq('id', reservation_id)
      .eq('user_id', user_id)
      .single();

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation non trouvee' });
    }

    if (reservation.payment_status === 'paid') {
      return res.status(400).json({ error: 'Deja paye' });
    }

    // Create payment record
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        reservation_id,
        user_id,
        amount: reservation.total_amount,
        currency: 'XOF',
        phone_number,
        status: 'pending'
      })
      .select()
      .single();

    if (payError) throw payError;

    // Initiate Orange Money payment
    const result = await initiatePayment({
      amount: reservation.total_amount,
      phoneNumber: phone_number,
      reference: reservation.payment_reference,
      description: `Reservation ${reservation.terrain.name} - ${reservation.reservation_date}`
    });

    if (!result.success) {
      await supabase
        .from('payments')
        .update({ status: 'failed', provider_status: 'initiation_failed' })
        .eq('id', payment.id);

      await supabase
        .from('reservations')
        .update({ payment_status: 'failed' })
        .eq('id', reservation_id);

      return res.status(400).json({ error: result.error });
    }

    // Update payment with provider info
    await supabase
      .from('payments')
      .update({
        provider_transaction_id: result.txnid,
        provider_status: 'initiated'
      })
      .eq('id', payment.id);

    res.json({
      payment_url: result.payment_url,
      pay_token: result.pay_token,
      notif_token: result.notif_token,
      payment_id: payment.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { order_id, status, txnid } = req.body;

    // Find reservation by payment reference
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, terrain:terrains(*)')
      .eq('payment_reference', order_id)
      .single();

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation non trouvee' });
    }

    // Find the payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Paiement non trouve' });
    }

    if (status === 'SUCCESS') {
      // Update payment
      await supabase
        .from('payments')
        .update({
          status: 'successful',
          provider_status: status,
          provider_transaction_id: txnid || payment.provider_transaction_id,
          webhook_payload: req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Update reservation
      await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      // Get user info for notification
      let user = { full_name: 'Client', phone: '' };
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(reservation.user_id);
        if (userData && userData.user) {
          user = {
            full_name: userData.user.raw_user_meta_data?.full_name || 'Client',
            phone: userData.user.raw_user_meta_data?.phone || ''
          };
        }
      } catch (e) {
        console.log('Could not fetch user for notification');
      }

      // Notify guardian
      await notifyGuardianReservation(reservation.terrain, reservation, {
        profile: user,
        email: ''
      });

    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          provider_status: status,
          webhook_payload: req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      await supabase
        .from('reservations')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id);
    }

    res.json({ status: 'received' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getReceipt = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const user_id = req.user.id;

    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, terrain:terrains(*)')
      .eq('id', reservation_id)
      .eq('user_id', user_id)
      .single();

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation non trouvee' });
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservation_id)
      .eq('status', 'successful')
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Paiement non trouve' });
    }

    const pdfBuffer = await generateReceipt({
      reservation,
      terrain: reservation.terrain,
      payment,
      user: req.user
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recu-${reservation.payment_reference}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { pay, handleWebhook, getReceipt };
