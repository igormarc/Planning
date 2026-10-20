import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './firebase-config'

// La configuración web se completa en src/firebase-config.js.
// Estos valores identifican el proyecto; la seguridad real depende de Authentication
// y de las reglas de Firestore. No pongas aquí contraseñas ni claves privadas.
const config = Object.fromEntries(
  Object.entries(firebaseConfig).map(([key, value]) => [key, String(value || '').trim()])
)

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId']
export const missingFirebaseConfig = requiredKeys.filter(key => !config[key])
export const firebaseConfigured = missingFirebaseConfig.length === 0
export const firebaseApp = firebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(config))
  : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
