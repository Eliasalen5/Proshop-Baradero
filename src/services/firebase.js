import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCK-YHoLhs7I0LYtCJf2skF5jWpyd2HBAo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "proshop-baradero-3ea16.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "proshop-baradero-3ea16",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "proshop-baradero-3ea16.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "314425054470",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:314425054470:web:7dc6c2ed7edc37543cfa87",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
