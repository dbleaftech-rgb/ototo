/**
 * index.ts - Firebase Cloud Functions entry point for Ototo Smart Report
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createDeal, generateSecureToken } from './services/dealService.js';
import { processGrowPayment, consumeUserCredit } from './services/growService.js';
import { fetchCheckIdInsurance } from './services/checkIdService.js';

admin.initializeApp();
const db = admin.firestore();

/**
 * REST API entry point
 */
export const api = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const rawPath = req.path;
  const path = rawPath.replace(/^\/api/, '') || '/';

  try {
    // 1. GET /api/deal?token=<token>
    if (req.method === 'GET' && path === '/deal') {
      const token = String(req.query.token || '');
      if (!token) {
        res.status(400).json({ error: 'Missing token' });
        return;
      }

      const snapshot = await db.collection('deals').where('dealToken', '==', token).limit(1).get();
      if (snapshot.empty) {
        // Also check if sellerToken
        const sellerSnap = await db.collection('deals').where('sellerToken', '==', token).limit(1).get();
        if (sellerSnap.empty) {
          res.status(404).json({ error: 'Deal not found' });
          return;
        }
        const deal = sellerSnap.docs[0].data();
        res.json({ deal, role: 'seller' });
        return;
      }

      const deal = snapshot.docs[0].data();
      let report = null;
      if (deal.reportId) {
        const repDoc = await db.collection('reports').doc(deal.reportId).get();
        report = repDoc.data();
      }

      res.json({ deal, report, role: 'buyer' });
      return;
    }

    // 2. POST /api/deal (Initiate deal)
    if (req.method === 'POST' && path === '/deal') {
      const { buyerPhone, plate, adPrice, declaredKm, adMakeModel, buyerName } = req.body;
      if (!buyerPhone || !plate) {
        res.status(400).json({ error: 'Missing buyerPhone or plate' });
        return;
      }

      const result = await createDeal(
        { buyerPhone, plate, adPrice, declaredKm, adMakeModel, buyerName },
        db
      );
      res.status(201).json(result);
      return;
    }

    // 3. POST /api/deal/consume-credit (Unlock full report)
    if (req.method === 'POST' && path === '/deal/consume-credit') {
      const { dealId, buyerPhone } = req.body;
      if (!dealId || !buyerPhone) {
        res.status(400).json({ error: 'Missing dealId or buyerPhone' });
        return;
      }

      const success = await consumeUserCredit(buyerPhone, dealId, db);
      if (!success) {
        res.status(402).json({ error: 'Insufficient credits. Purchase required.' });
        return;
      }

      res.json({ success: true, message: 'Report unlocked successfully' });
      return;
    }

    // 4. POST /api/seller/consent (Amendment 13 Wedge)
    if (req.method === 'POST' && path === '/seller/consent') {
      const { sellerToken, ownerTaz, ownershipDate } = req.body;
      if (!sellerToken || !ownerTaz || !ownershipDate) {
        res.status(400).json({ error: 'Missing required consent fields' });
        return;
      }

      const dealSnap = await db.collection('deals').where('sellerToken', '==', sellerToken).limit(1).get();
      if (dealSnap.empty) {
        res.status(404).json({ error: 'Invalid seller token' });
        return;
      }

      const dealDoc = dealSnap.docs[0];
      const deal = dealDoc.data();
      const maskedTaz = ownerTaz.slice(0, 2) + '*****' + ownerTaz.slice(-2);

      const consentRef = db.collection('consents').doc();
      await consentRef.set({
        id: consentRef.id,
        dealId: dealDoc.id,
        dealToken: deal.dealToken,
        ownerTazMasked: maskedTaz,
        ownershipDate,
        consentAt: admin.firestore.FieldValue.serverTimestamp(),
        signerIp: req.ip || '',
        docHash: generateSecureToken(),
      });

      // Query CheckID insurance in background if deal is paid
      if (deal.isPaid) {
        fetchCheckIdInsurance(deal.plate, ownerTaz, ownershipDate, true).then(async (ins) => {
          if (ins && deal.reportId) {
            await db.collection('reports').doc(deal.reportId).set(
              { insuranceClaims: ins.claims, insuranceVerified: true },
              { merge: true }
            );
          }
        });
      }

      res.json({ success: true, message: 'Seller consent recorded' });
      return;
    }

    res.status(404).json({ error: 'Route not found' });
  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

/**
 * Webhooks entry point (Grow payments, Twilio WhatsApp)
 */
export const webhook = functions.https.onRequest(async (req, res) => {
  const rawPath = req.path;
  const path = rawPath.replace(/^\/webhook/, '') || '/';

  // 1. Grow (Meshulam) Payment Confirmation Webhook
  if (path === '/payment-confirmed' || path === '/grow') {
    try {
      const result = await processGrowPayment(req.body, db);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('Grow Webhook Error:', err);
      res.status(500).send('Error');
    }
    return;
  }

  // 2. Twilio Inbound WhatsApp Webhook
  if (path === '/whatsapp' || path === '/wa-inbound') {
    const from = req.body.From || '';
    const body = req.body.Body || '';
    console.log(`Received WhatsApp message from ${from}: ${body}`);
    // Respond with Twilio XML or standard response
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
    return;
  }

  res.status(404).send('Not Found');
});
