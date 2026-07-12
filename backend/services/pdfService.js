const PDFDocument = require('pdfkit');

async function generateReceipt({ reservation, terrain, payment, user }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('TERRAIN MALI', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('Recu de Reservation', { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Receipt info
    const addLine = (label, value) => {
      doc.fontSize(11).font('Helvetica-Bold').text(label, { continued: true });
      doc.font('Helvetica').text(`  ${value}`);
      doc.moveDown(0.3);
    };

    doc.fontSize(14).font('Helvetica-Bold').text('Details de la Reservation');
    doc.moveDown(0.5);

    addLine('Reference:', reservation.payment_reference || reservation.id);
    addLine('Date de reservation:', reservation.reservation_date);
    addLine('Heure:', `${reservation.start_time} - ${reservation.end_time}`);
    addLine('Duree:', `${reservation.duration_hours} heure(s)`);

    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('Informations du Terrain');
    doc.moveDown(0.5);

    addLine('Nom:', terrain.name);
    addLine('Ville:', terrain.city);
    addLine('Quartier:', terrain.neighborhood);
    addLine('Adresse:', terrain.address);

    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('Informations Client');
    doc.moveDown(0.5);

    addLine('Nom:', user.profile?.full_name || 'N/A');
    addLine('Telephone:', user.profile?.phone || 'N/A');
    addLine('Email:', user.email);

    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('Paiement');
    doc.moveDown(0.5);

    addLine('Montant paye:', `${payment.amount} ${payment.currency}`);
    addLine('Methode de paiement:', 'Orange Money');
    addLine('Reference transaction:', payment.provider_transaction_id || 'N/A');
    addLine('Statut:', 'Paye');

    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').text(
      `Recu genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`,
      { align: 'center' }
    );
    doc.moveDown(0.3);
    doc.text('Terrain Mali - Tous droits reserves', { align: 'center' });

    doc.end();
  });
}

module.exports = { generateReceipt };
