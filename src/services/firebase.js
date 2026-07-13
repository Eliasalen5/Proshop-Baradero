import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCK-YHoLhs7I0LYtCJf2skF5jWpyd2HBAo",
  authDomain: "proshop-baradero-3ea16.firebaseapp.com",
  projectId: "proshop-baradero-3ea16",
  storageBucket: "proshop-baradero-3ea16.firebasestorage.app",
  messagingSenderId: "314425054470",
  appId: "1:314425054470:web:7dc6c2ed7edc37543cfa87",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
