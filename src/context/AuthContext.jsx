import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../services/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setUserData(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return
    let unsub, retry
    const listen = () => {
      unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setUserData(snap.data())
        }
        setLoading(false)
      }, (err) => {
        console.error('User doc onSnapshot:', err)
        retry = setTimeout(listen, 3000)
      })
    }
    listen()
    return () => { if (unsub) unsub(); if (retry) clearTimeout(retry) }
  }, [user])

  const register = async (email, password, name, phone, documento) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      displayName: name,
      phone: phone || '',
      documento: documento || '',
      photoURL: '',
      role: 'user',
      points: 0,
      createdAt: new Date().toISOString(),
    })
    return cred
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const refreshUserData = async () => {
    if (user) {
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) setUserData(docSnap.data())
    }
  }

  const updateUserProfile = async (data) => {
    if (!user) throw new Error('No user')
    await updateDoc(doc(db, 'users', user.uid), data)
    await refreshUserData()
  }

  const uploadProfilePhoto = async (file) => {
    if (!user) throw new Error('No user')
    const storageRef = ref(storage, `profiles/${user.uid}_${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
    await refreshUserData()
    return url
  }

  const changeEmail = async (newEmail, currentPassword) => {
    if (!user || !user.email) throw new Error('No user')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, newEmail)
    await updateDoc(doc(db, 'users', user.uid), { email: newEmail })
    await refreshUserData()
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!user || !user.email) throw new Error('No user')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        register,
        login,
        logout,
        resetPassword,
        refreshUserData,
        updateUserProfile,
        uploadProfilePhoto,
        changeEmail,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
