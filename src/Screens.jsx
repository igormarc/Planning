import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, updateProfile, signOut } from 'firebase/auth'
import { collection, doc, writeBatch, onSnapshot, deleteDoc, updateDoc, addDoc, query, where } from 'firebase/firestore'
import { auth, provider, db } from './firebase'
import { Logo } from './Logo'

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
    <section className="left"><div className="lg"><Logo s={40} /></div>
    <form className="panel" onSubmit={submit}>
      <h2>{up ? 'Crea tu cuenta' : 'Iniciar sesión'}</h2>
      {up && <input required placeholder="Tu nombre" autoComplete="name" value={f.nombre} onChange={set('nombre')} />}
      <input required type="email" placeholder="Correo" autoComplete="email" value={f.email} onChange={set('email')} />
      <input required type="password" minLength={6} placeholder={up ? 'Crea tu contraseña (mín. 6)' : 'Contraseña'} autoComplete={up ? 'new-password' : 'current-password'} value={f.pass} onChange={set('pass')} />
      {msg && <p className="msg" role="alert">{msg}</p>}
      <button disabled={busy} style={{ width: '100%' }}>{up ? 'Crear cuenta' : 'Ingresar'}</button>
      <button type="button" className="ghost" style={{ width: '100%' }} onClick={() => run(() => signInWithPopup(auth, provider))}>Continuar con Google</button>
      {!up && <button type="button" className="link" onClick={forgot}>Olvidé mi contraseña</button>}
      <button type="button" className="link" onClick={() => { setMode(up ? 'in' : 'up'); setMsg('') }}>{up ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}</button>
    </form>
    <small className="foot">ConfigBand · Planificación de servicios para tu iglesia</small></section>
    <aside className="art" aria-hidden="true"><i /><i /><i /><i /></aside>
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

const NIVELES = { ninguno: 'Sin acceso', ver: 'Viewer', editar: 'Editor', admin: 'Administrator' }
const nivel = m => m.rol === 'admin' ? 'admin' : (m.planes === 'editar' || m.canciones === 'editar') ? 'editar' : (m.planes === 'ver' || m.canciones === 'ver') ? 'ver' : 'ninguno'

export function Team({ cid, uid }) {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(collection(db, 'churches', cid, 'members'), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() })))), [cid])
  const set = (id, d) => updateDoc(doc(db, 'churches', cid, 'members', id), d)
  const setNivel = (m, v) => set(m.id, v === 'admin' ? { rol: 'admin', canciones: 'editar', planes: 'editar' } : { rol: 'miembro', canciones: v, planes: v })
  return <>
    <div className="pagehead"><h1>Personas</h1></div>
    <div className="card"><small>Código de invitación</small><div className="big">{cid}</div><small>Compártelo: cada persona se registra con su propia contraseña, ingresa este código y tú apruebas su acceso.</small></div>
    <div className="tw"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Permisos</th><th></th></tr></thead><tbody>
      {rows.map(m => <tr key={m.id}><td>{m.nombre || '—'}</td><td>{m.email}</td>
        <td>{m.rol === 'pendiente' ? <span className="tag">Pendiente</span> : <select disabled={m.id === uid} value={nivel(m)} onChange={e => setNivel(m, e.target.value)}>{Object.entries(NIVELES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</td>
        <td>{m.rol === 'pendiente' && <button className="sm" onClick={() => setNivel(m, 'ver')}>Aprobar</button>}
          {m.id !== uid && <button className="peligro sm" onClick={() => confirm('¿Quitar a esta persona?') && deleteDoc(doc(db, 'churches', cid, 'members', m.id))}>Quitar</button>}</td></tr>)}
    </tbody></table></div>
  </>
}

const estTag = e => <span className={'tag ' + (e === 'aceptado' ? 'ok' : e === 'rechazado' ? 'bad' : '')}>{e}</span>
const mapDocs = s => s.docs.map(d => ({ id: d.id, ...d.data() }))

export function Asign({ cid, plan, ro }) {
  const [list, setList] = useState([]), [ms, setMs] = useState([]), [bl, setBl] = useState([]), [uid, setUid] = useState(''), [pos, setPos] = useState('')
  const col = n => collection(db, 'churches', cid, n)
  useEffect(() => onSnapshot(query(col('assignments'), where('planId', '==', plan.id)), s => setList(mapDocs(s)), () => { }), [cid, plan.id])
  useEffect(() => {
    if (ro) return
    const a = onSnapshot(col('members'), s => setMs(mapDocs(s).filter(m => m.rol !== 'pendiente')), () => { })
    const b = onSnapshot(query(col('blockouts'), where('fecha', '==', plan.fecha)), s => setBl(mapDocs(s)), () => { })
    return () => { a(); b() }
  }, [cid, plan.fecha, ro])
  const add = async () => {
    const m = ms.find(x => x.id === uid)
    if (!m || !pos.trim()) return
    if (bl.some(b => b.uid === uid) && !confirm((m.nombre || m.email) + ' marcó que no está disponible ese día. ¿Asignar igual?')) return
    await addDoc(col('assignments'), { planId: plan.id, planTitulo: plan.titulo, fecha: plan.fecha, uid, nombre: m.nombre || m.email, posicion: pos.trim(), estado: 'pendiente' })
    setPos('')
  }
  const share = () => {
    const txt = '*' + plan.titulo + '* (' + plan.fecha + ')\n' + (plan.items || []).map((it, i) => (i + 1) + '. ' + it.label + (it.tono ? ' (' + it.tono + ')' : '')).join('\n') + '\n\nEquipo:\n' + list.map(a => '• ' + a.nombre + ': ' + a.posicion).join('\n')
    window.open('https://wa.me/?text=' + encodeURIComponent(txt))
  }
  return <>
    <h2>Equipo del servicio</h2>
    {!list.length && <p className="vacio">Nadie asignado todavía.</p>}
    {list.map(a => <div className="row" key={a.id}><span><b style={{ display: 'inline' }}>{a.nombre}</b> · {a.posicion} {estTag(a.estado)}</span>
      <button className="peligro sm" hidden={ro} onClick={() => deleteDoc(doc(db, 'churches', cid, 'assignments', a.id))}>Quitar</button></div>)}
    <div className="row" hidden={ro}>
      <select value={uid} onChange={e => setUid(e.target.value)}><option value="">Persona</option>{ms.map(m => <option key={m.id} value={m.id}>{m.nombre || m.email}</option>)}</select>
      <input style={{ width: 150, margin: 0 }} placeholder="Posición (Voz, Guitarra…)" value={pos} onChange={e => setPos(e.target.value)} />
      <button onClick={add}>Asignar</button>
    </div>
    <div className="row"><button className="ghost" onClick={share}>Compartir por WhatsApp</button></div>
  </>
}

export function Agenda({ cid, uid }) {
  const [as, setAs] = useState([]), [bl, setBl] = useState([]), [f, setF] = useState('')
  const col = n => collection(db, 'churches', cid, n)
  useEffect(() => {
    const a = onSnapshot(query(col('assignments'), where('uid', '==', uid)), s => setAs(mapDocs(s)), () => { })
    const b = onSnapshot(query(col('blockouts'), where('uid', '==', uid)), s => setBl(mapDocs(s)), () => { })
    return () => { a(); b() }
  }, [cid, uid])
  const hoy = new Date().toISOString().slice(0, 10)
  const prox = as.filter(a => a.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const resp = (id, estado) => updateDoc(doc(db, 'churches', cid, 'assignments', id), { estado })
  return <>
    <h2>Mis próximos servicios</h2>
    {!prox.length && <p className="vacio">No tienes servicios asignados por ahora.</p>}
    {prox.map(a => <div className="card" key={a.id}><b>{a.planTitulo} <small>{a.fecha}</small></b><span>{a.posicion} {estTag(a.estado)}</span>
      <div className="row"><button disabled={a.estado === 'aceptado'} onClick={() => resp(a.id, 'aceptado')}>Aceptar</button><button className="peligro" disabled={a.estado === 'rechazado'} onClick={() => resp(a.id, 'rechazado')}>No puedo</button></div></div>)}
    <h2>Días en que no estoy disponible</h2>
    <form onSubmit={async e => { e.preventDefault(); await addDoc(col('blockouts'), { uid, fecha: f }); setF('') }}>
      <input required type="date" value={f} onChange={e => setF(e.target.value)} /><button>Marcar no disponible</button></form>
    {[...bl].sort((a, b) => a.fecha.localeCompare(b.fecha)).map(b => <div className="card row" key={b.id}>{b.fecha}<button className="ghost sm" onClick={() => deleteDoc(doc(db, 'churches', cid, 'blockouts', b.id))}>Quitar</button></div>)}
  </>
}
