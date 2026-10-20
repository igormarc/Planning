import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = [config.apiKey, config.authDomain, config.projectId, config.appId].map(value => String(value || '').trim())
const placeholders = new Set(['tu_api_key', 'tu-proyecto.firebaseapp.com', 'tu-proyecto', 'tu_app_id'])
export const firebaseConfigured = requiredConfig.every(Boolean) && !requiredConfig.some(value => placeholders.has(value))
export const firebaseApp = firebaseConfigured ? (getApps().length ? getApps()[0] : initializeApp(config)) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
