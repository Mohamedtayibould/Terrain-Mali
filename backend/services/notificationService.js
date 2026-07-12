const supabase = require('../config/supabase');

async function createNotification({ terrainId, guardianPhone, type, message, metadata }) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        terrain_id: terrainId,
        guardian_phone: guardianPhone,
        type,
        message,
        metadata: metadata || {}
      });

    if (error) throw error;
    console.log(`Notification sent to ${guardianPhone}: ${message}`);
    return true;
  } catch (err) {
    console.error('Notification error:', err.message);
    return false;
  }
}

async function notifyGuardianReservation(terrain, reservation, user) {
  const message = [
    `Nouvelle reservation!`,
    `Client: ${user.profile?.full_name || 'N/A'}`,
    `Telephone: ${user.profile?.phone || user.email}`,
    `Terrain: ${terrain.name}`,
    `Date: ${reservation.reservation_date}`,
    `Heure: ${reservation.start_time} - ${reservation.end_time}`,
    `Montant: ${reservation.total_amount} XOF`,
    `Reference: ${reservation.payment_reference}`
  ].join('\n');

  return createNotification({
    terrainId: terrain.id,
    guardianPhone: terrain.guardian_phone,
    type: 'reservation',
    message,
    metadata: {
      reservationId: reservation.id,
      userId: user.id,
      amount: reservation.total_amount
    }
  });
}

async function notifyGuardianCancellation(terrain, reservation, user) {
  const message = [
    `Annulation de reservation!`,
    `Client: ${user.profile?.full_name || 'N/A'}`,
    `Terrain: ${terrain.name}`,
    `Date: ${reservation.reservation_date}`,
    `Heure: ${reservation.start_time} - ${reservation.end_time}`,
  ].join('\n');

  return createNotification({
    terrainId: terrain.id,
    guardianPhone: terrain.guardian_phone,
    type: 'cancellation',
    message,
    metadata: { reservationId: reservation.id }
  });
}

module.exports = { notifyGuardianReservation, notifyGuardianCancellation };
