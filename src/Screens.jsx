import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, updateProfile, signOut } from 'firebase/auth'
import { collection, doc, writeBatch, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore'
import { auth, provider, db } from './firebase'

const MSG = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.', 'auth/email-already-in-use': 'Ese correo ya tiene cuenta.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.', 'auth/invalid-email': 'Correo no válido.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
  'auth/operation-not-allowed': 'Este método de acceso no está activado en Firebase.', 'auth/popup-closed-by-user': 'Cerraste la ventana de Google.',
  'permission-denied': 'Sin permiso. Revisa que las reglas de Firestore estén publicadas.'
}
const err = e => MSG[e.code] || e.code || e.message

export function Auth() {
  const [mode, setMode] = useState('in'), [f, setF] = useState({ nombre: '', email: '', pass: '' }), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const run = async fn => { setMsg(''); setBusy(true); try { await fn() } catch (e) { setMsg(err(e)) } setBusy(false) }
  const up = mode === 'up', set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = e => { e.preventDefault(); run(async () => {
    if (up) { const c = await createUserWithEmailAndPassword(auth, f.email, f.pass); await updateProfile(c.user, { displayName: f.nombre }) }
    else await signInWithEmailAndPassword(auth, f.email, f.pass)
  }) }
  const forgot = () => f.email ? run(async () => { await sendPasswordResetEmail(auth, f.email); setMsg('Te enviamos un correo para crear una nueva contraseña.') }) : setMsg('Escribe tu correo primero.')
  return <div className="auth">
    <section className="brand"><h1>♪ Servicios</h1><p>Planifica cada culto, ordena el repertorio y coordina a tu equipo en un solo lugar.</p>
      <ul><li>Orden del servicio en minutos</li><li>Acordes con cambio de tono</li><li>Funciona sin internet</li><li>Accesos distintos para cada persona</li></ul></section>
    <form className="panel" onSubmit={submit}>
      <h2>{up ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h2>
      {up && <input required placeholder="Tu nombre" autoComplete="name" value={f.nombre} onChange={set('nombre')} />}
      <input required type="email" placeholder="Correo" autoComplete="email" value={f.email} onChange={set('email')} />
      <input required type="password" minLength={6} placeholder={up ? 'Crea tu contraseña (mín. 6)' : 'Contraseña'} autoComplete={up ? 'new-password' : 'current-password'} value={f.pass} onChange={set('pass')} />
      {msg && <p className="msg" role="alert">{msg}</p>}
      <button disabled={busy} style={{ width: '100%' }}>{up ? 'Crear cuenta' : 'Ingresar'}</button>
      <button type="button" className="ghost" style={{ width: '100%' }} onClick={() => run(() => signInWithPopup(auth, provider))}>Continuar con Google</button>
      {!up && <button type="button" className="link" onClick={forgot}>Olvidé mi contraseña</button>}
      <button type="button" className="link" onClick={() => { setMode(up ? 'in' : 'up'); setMsg('') }}>{up ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}</button>
    </form>
  </div>
}

export function Join({ u, onDone }) {
  const [code, setCode] = useState(''), [nom, setNom] = useState(''), [msg, setMsg] = useState('')
  const go = fn => async e => { e.preventDefault(); setMsg(''); try { await fn() } catch (x) { setMsg(err(x)) } }
  const base = { nombre: u.displayName || '', email: u.email || '' }
  const create = go(async () => {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase(), b = writeBatch(db)
    b.set(doc(db, 'churches', id), { nombre: nom, ownerUid: u.uid })
    b.set(doc(db, 'churches', id, 'members', u.uid), { ...base, rol: 'admin', canciones: 'editar', planes: 'editar' })
    b.set(doc(db, 'users', u.uid), { churchId: id }); await b.commit(); onDone(id)
  })
  const join = go(async () => {
    const id = code.trim().toUpperCase(), b = writeBatch(db)
    b.set(doc(db, 'churches', id, 'members', u.uid), { ...base, rol: 'pendiente', canciones: 'ninguno', planes: 'ninguno' })
    b.set(doc(db, 'users', u.uid), { churchId: id }); await b.commit(); onDone(id)
  })
  return <div className="wrap">
    <h1>Hola{u.displayName ? ', ' + u.displayName : ''} 👋</h1>
    {msg && <p className="msg" role="alert">{msg}</p>}
    <form onSubmit={create}><h2>Soy el administrador: crear mi iglesia</h2><input required placeholder="Nombre de la iglesia" value={nom} onChange={e => setNom(e.target.value)} /><button>Crear iglesia</button></form>
    <form onSubmit={join}><h2>Me invitaron: unirme con un código</h2><input required placeholder="Código de invitación" value={code} onChange={e => setCode(e.target.value)} /><button>Enviar solicitud</button></form>
    <button className="link" onClick={() => signOut(auth)}>Salir</button>
  </div>
}

const Lv = ({ v, on }) => <select value={v || 'ninguno'} onChange={e => on(e.target.value)}><option value="ninguno">Sin acceso</option><option value="ver">Solo ver</option><option value="editar">Ver y editar</option></select>

export function Team({ cid }) {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(collection(db, 'churches', cid, 'members'), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() })))), [cid])
  const set = (id, d) => updateDoc(doc(db, 'churches', cid, 'members', id), d)
  return <>
    <div className="card"><small>Código de invitación</small><div className="big">{cid}</div><small>Compártelo: cada persona se registra con su propia contraseña, ingresa este código y tú apruebas su acceso.</small></div>
    <h2>Personas ({rows.length})</h2>
    {rows.map(m => <div className="card" key={m.id}>
      <b>{m.nombre || m.email}{m.rol === 'pendiente' && <span className="tag">Pendiente</span>}{m.rol === 'admin' && <span className="tag ok">Admin</span>}</b><small>{m.email}</small>
      {m.rol !== 'admin' && <>
        <div className="row"><label>Canciones<Lv v={m.canciones} on={v => set(m.id, { canciones: v })} /></label><label>Planes<Lv v={m.planes} on={v => set(m.id, { planes: v })} /></label></div>
        <div className="row">
          {m.rol === 'pendiente' && <button onClick={() => set(m.id, { rol: 'miembro', canciones: m.canciones === 'ninguno' ? 'ver' : m.canciones, planes: m.planes === 'ninguno' ? 'ver' : m.planes })}>Aprobar</button>}
          <button className="peligro" onClick={() => confirm('¿Quitar a esta persona?') && deleteDoc(doc(db, 'churches', cid, 'members', m.id))}>Quitar</button>
        </div>
      </>}
    </div>)}
  </>
}
