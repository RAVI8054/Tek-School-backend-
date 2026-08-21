import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';
dotenv.config();

// Ensure Firebase is initialized only once
if (!getApps().length) {
  try {
    // We use the individual keys from the .env file
    // The private key from .env usually has escaped newlines (\n) that need to be parsed
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !privateKey
    ) {
      console.warn(
        '⚠️ Firebase environment variables are missing! Push notifications and auth may not work.'
      );
    } else {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
}

// Export the specific services for use in controllers/services
export const firebaseAuth = getApps().length ? getAuth() : null;
export const firestore = getApps().length ? getFirestore() : null;
export const messaging = getApps().length ? getMessaging() : null;

export default { firebaseAuth, firestore, messaging };
