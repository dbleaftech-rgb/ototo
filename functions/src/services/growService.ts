/**
 * growService.ts - Grow (Meshulam) payment verification and credit management
 * Implements CANON §9 and decisions D-035, D-036, D-038
 */

import * as admin from 'firebase-admin';

export interface GrowWebhookPayload {
  identifyParam?: string;
  asmachta?: string;
  paymentSum?: string | number;
  paymentDesc?: string;
  payerPhone?: string;
  webhookKey?: string;
  transactionCode?: string;
}

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Extract last 9 digits (e.g. 501234567)
  return digits.slice(-9);
}

export async function processGrowPayment(
  payload: GrowWebhookPayload,
  db: admin.firestore.Firestore
): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  const asmachta = payload.asmachta;
  if (!asmachta) {
    return { success: false, message: 'Missing asmachta' };
  }

  // Two-factor authentication check
  const expectedIdent = process.env.GROW_WEBHOOK_IDENT;
  const expectedKey = process.env.GROW_WEBHOOK_KEY;

  if (expectedIdent && payload.identifyParam !== expectedIdent) {
    return { success: false, message: 'Invalid identifyParam' };
  }
  if (expectedKey && payload.webhookKey !== expectedKey) {
    return { success: false, message: 'Invalid webhookKey' };
  }

  // Idempotency check: check if purchase with this asmachta already processed
  const purchaseRef = db.collection('purchases').doc(asmachta);
  const existing = await purchaseRef.get();
  if (existing.exists) {
    return { success: true, message: 'Already processed', duplicate: true };
  }

  const rawPhone = payload.payerPhone || '';
  const phoneKey = normalizePhoneNumber(rawPhone);
  const amount = Number(payload.paymentSum) || 0;
  const desc = payload.paymentDesc || '';

  // Determine product & credits (79 ILS -> 1 credit, 150 ILS -> 3 credits)
  let creditsToAdd = 1;
  let product: 'single_report' | 'pack_3' | 'subscription' = 'single_report';

  if (amount >= 140 || desc.includes('3') || desc.includes('חבילה')) {
    creditsToAdd = 3;
    product = 'pack_3';
  } else if (amount === 45 || desc.includes('מנוי')) {
    creditsToAdd = 0;
    product = 'subscription';
  }

  // Atomic transaction to record purchase and increment user credits
  await db.runTransaction(async (t) => {
    // 1. Record purchase
    t.set(purchaseRef, {
      asmachta,
      payerPhone: rawPhone,
      phoneKey,
      amount,
      product,
      creditsGranted: creditsToAdd,
      paymentDesc: desc,
      transactionCode: payload.transactionCode || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Increment credits for phone number
    if (phoneKey && creditsToAdd > 0) {
      const userCreditRef = db.collection('userCredits').doc(phoneKey);
      t.set(
        userCreditRef,
        {
          credits: admin.firestore.FieldValue.increment(creditsToAdd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });

  return { success: true, message: `Granted ${creditsToAdd} credits for phone ending in ${phoneKey}` };
}

/**
 * Consumes 1 credit when user explicitly clicks to unlock/view a report (D-038)
 */
export async function consumeUserCredit(
  phone: string,
  dealId: string,
  db: admin.firestore.Firestore
): Promise<boolean> {
  const phoneKey = normalizePhoneNumber(phone);
  const userCreditRef = db.collection('userCredits').doc(phoneKey);

  return await db.runTransaction(async (t) => {
    const doc = await t.get(userCreditRef);
    const currentCredits = doc.data()?.credits || 0;

    if (currentCredits < 1) {
      return false;
    }

    t.update(userCreditRef, {
      credits: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark deal as paid/unlocked
    const dealRef = db.collection('deals').doc(dealId);
    t.update(dealRef, {
      isPaid: true,
      stage: 'full_report',
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  });
}
