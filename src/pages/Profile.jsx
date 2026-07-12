import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, userData, updateUserProfile, uploadProfilePhoto, changeEmail, changePassword } = useAuth()
  const [redemptions, setRedemptions] = useState([])

  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editDocumento, setEditDocumento] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailPass, setEmailPass] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)

  const [qrModal, setQrModal] = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'redemptions'), where('userId', '==', user.uid))
    getDocs(q).then((snap) => {
      setRedemptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [user])

  useEffect(() => {
    if (userData) {
      setEditName(userData.displayName || '')
      setEditPhone(userData.phone || '')
      setEditDocumento(userData.documento || '')
      setNewEmail(user?.email || '')
    }
  }, [userData, user])

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const updates = {}
      if (editName !== userData?.displayName) updates.displayName = editName
      if (editPhone !== (userData?.phone || '')) updates.phone = editPhone
      if (editDocumento !== (userData?.documento || '')) updates.documento = editDocumento
      if (Object.keys(updates).length > 0) await updateUserProfile(updates)
      if (photoFile) {
        setUploading(true)
        await uploadProfilePhoto(photoFile)
        setPhotoFile(null)
        setUploading(false)
      }
      showMsg('success', 'Perfil actualizado')
    } catch {
      showMsg('error', 'Error al guardar')
    }
    setSaving(false)
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!newEmail) return
    setChangingEmail(true)
    try {
      await changeEmail(newEmail, emailPass)
      showMsg('success', 'Email actualizado')
      setEmailPass('')
    } catch (err) {
      showMsg('error', err.code === 'auth/wrong-password' ? 'Contraseña incorrecta' : 'Error al cambiar email')
    }
    setChangingEmail(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      showMsg('error', 'Las contraseñas no coinciden')
      return
    }
    if (newPass.length < 6) {
      showMsg('error', 'Mínimo 6 caracteres')
      return
    }
    setChangingPass(true)
    try {
      await changePassword(curPass, newPass)
      showMsg('success', 'Contraseña actualizada')
      setCurPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      showMsg('error', err.code === 'auth/wrong-password' ? 'Contraseña actual incorrecta' : 'Error al cambiar contraseña')
    }
    setChangingPass(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-club-yellow mb-6">Mi Perfil</h1>

      {msg.text && (
        <div className={`p-3 rounded mb-6 text-sm ${msg.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Info + Foto */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-club-yellow mx-auto">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">
                  {userData?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label className="block mt-2 text-xs text-club-yellow cursor-pointer hover:underline">
              Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </label>
            {photoFile && <p className="text-xs text-gray-500 mt-1">{photoFile.name}</p>}
          </div>

          <div className="flex-1 grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-sm">Nombre</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Teléfono</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mt-1"
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div>
              <label className="text-gray-500 text-sm">Documento</label>
              <input
                value={editDocumento}
                onChange={(e) => setEditDocumento(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mt-1"
                placeholder="DNI / Pasaporte"
              />
            </div>
            {userData?.role !== 'admin' && (
              <div>
                <label className="text-gray-500 text-sm">Puntos</label>
                <p className="text-club-yellow font-bold text-2xl mt-1">{userData?.points ?? 0}</p>
              </div>
            )}
            <div>
              <label className="text-gray-500 text-sm">Rol</label>
              <p className="text-white capitalize mt-1">{userData?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving || uploading}
          className="mt-6 bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {uploading ? 'Subiendo foto...' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Email */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-4">Cambiar Email</h2>
        <form onSubmit={handleChangeEmail} className="space-y-3 max-w-md">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Nuevo email"
            required
          />
          <input
            type="password"
            value={emailPass}
            onChange={(e) => setEmailPass(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Contraseña actual (para confirmar)"
            required
          />
          <button
            type="submit"
            disabled={changingEmail}
            className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {changingEmail ? 'Cambiando...' : 'Cambiar email'}
          </button>
        </form>
      </div>

      {/* Contraseña */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <h2 className="text-white font-bold text-lg mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <input
            type="password"
            value={curPass}
            onChange={(e) => setCurPass(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Contraseña actual"
            required
          />
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            required
            minLength={6}
          />
          <input
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            placeholder="Confirmar nueva contraseña"
            required
          />
          <button
            type="submit"
            disabled={changingPass}
            className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {changingPass ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      {/* Historial de canjes */}
      <h2 className="text-xl font-bold text-white mb-4">Historial de Canjes</h2>
      {redemptions.length === 0 ? (
        <p className="text-gray-500">Todavía no canjeaste ningún beneficio.</p>
      ) : (
        <div className="space-y-3">
          {redemptions.map((r) => (
            <div key={r.id} className={`bg-gray-900 border rounded-lg p-4 ${r.status === 'pending' && r.code ? 'border-yellow-600/20 cursor-pointer hover:bg-gray-800/50 transition' : 'border-gray-800'}`}
              onClick={() => { if (r.status === 'pending' && r.code) setQrModal(r) }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{r.benefitName}</p>
                  <p className="text-gray-500 text-sm">{new Date(r.date).toLocaleDateString('es-AR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-club-yellow font-bold">-{r.pointsSpent} pts</p>
                  <span className={`text-xs ${r.status === 'completed' ? 'text-green-400' : r.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {r.status === 'completed' ? 'Completado' : r.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                  </span>
                </div>
              </div>
              {r.status === 'pending' && r.code && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${r.code}`}
                    alt="QR"
                    className="w-16 h-16 rounded"
                  />
                  <div>
                    <p className="text-xs text-gray-500">Código de verificación</p>
                    <p className="text-lg font-bold tracking-widest text-club-yellow">{r.code}</p>
                    <p className="text-xs text-gray-600 mt-1">Tocá para agrandar</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal QR grande */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setQrModal(null)}>
          <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrModal.code}`}
                alt="QR de canje"
                className="w-60 h-60 mx-auto"
              />
            </div>
            <p className="text-3xl font-bold tracking-widest text-club-yellow mb-2">{qrModal.code}</p>
            <p className="text-white font-medium">{qrModal.benefitName}</p>
            <p className="text-gray-500 text-sm mt-1">-{qrModal.pointsSpent} pts</p>
            <button onClick={() => setQrModal(null)} className="mt-6 bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition w-full">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
