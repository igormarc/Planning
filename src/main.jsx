import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, FileAudio, FileText, Filter,
  Folder, Guitar, Headphones, Home, ListMusic, LogOut, Menu, MessageSquare, Mic2, MoreHorizontal,
  Music2, Plus, Printer, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Trash2,
  UserRound, Users, X, Edit3, Play, Save, GripVertical, CalendarPlus, Upload, Mail, Phone,
  Music, Drum, Piano, Volume2, Eye, EyeOff, LockKeyhole, LayoutGrid, RotateCcw, Copy,
} from 'lucide-react'
import { auth, db, firebaseConfigured } from './firebase'
import { initializeApp, deleteApp } from 'firebase/app'
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore'
import './styles.css'

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const today = new Date()
const iso = (day, month = today.getMonth(), year = today.getFullYear()) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
const localTodayISO = () => { const d = new Date(); return iso(d.getDate(), d.getMonth(), d.getFullYear()) }
const addDaysISO = (value, days) => { const d = new Date(`${value || localTodayISO()}T12:00:00`); d.setDate(d.getDate() + days); return iso(d.getDate(), d.getMonth(), d.getFullYear()) }
const fmtDate = (value, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', opts).format(new Date(`${value}T12:00:00`))
}
const monthName = (date) => new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date)
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase()
const dateWritten = value => value ? new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`)) : 'Fecha por confirmar'
const roleName = role => ['Administrador','Editor','Visor'].includes(role) ? role : (role === 'Admin' ? 'Administrador' : role === 'Editor' ? 'Editor' : 'Visor')
const PITCHES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
const pitchValue = note => ({C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,'E#':5,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11}[note] ?? 0)
const normalizePitch = (value, preferFlat = false) => (preferFlat ? ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] : PITCHES)[((value % 12) + 12) % 12]
function transposeChordText(text = '', fromKey = 'C', toKey = 'C') {
  const fromRoot = String(fromKey).replace(/m$/, '')
  const toRoot = String(toKey).replace(/m$/, '')
  const delta = pitchValue(toRoot) - pitchValue(fromRoot)
  if (!delta) return text
  const preferFlat = /b/.test(toRoot)
  return String(text).replace(/(^|[\s|·,()[\]{}\/])([A-G](?:#|b)?)(?=(?:m|maj|min|dim|aug|sus|add|M|\d|\/|\b))/g, (match, before, root) => `${before}${normalizePitch(pitchValue(root) + delta, preferFlat)}`)
}
function downloadCsv(filename, headers, rows) {
  const encode = value => {
    let text = String(value ?? '')
    if (/^[=+\-@]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  const csv = '\ufeff' + [headers, ...rows].map(row => row.map(encode).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function openPrintDocument(title, body, subtitle = '', useMonospace = false) {
  const win = window.open('', '_blank')
  if (!win) { alert('Permite las ventanas emergentes para generar el PDF.'); return }
  const escapeHtml = value => String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  const safe = escapeHtml(body || 'Sin contenido')
  const safeTitle = escapeHtml(title)
  const safeSubtitle = escapeHtml(subtitle)
  const contentFont = useMonospace ? 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;' : ''
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:36px auto;padding:0 28px;color:#172b2a}h1{font-size:25px;margin:0 0 6px}p{color:#5a7270;margin:0 0 26px}.content{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.8;${contentFont}}.top{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #20a6a1;padding-bottom:18px;margin-bottom:24px}.print{background:#087f82;border:0;color:white;padding:12px 18px;border-radius:8px;font-weight:bold}@media print{body{margin:0 auto;padding:0}.print{display:none}}</style></head><body><div class="top"><div><h1>${safeTitle}</h1><p>${safeSubtitle}</p></div><button class="print" onclick="window.print()">Guardar / imprimir PDF</button></div><div class="content">${safe}</div><script>setTimeout(()=>window.print(),500)<\/script></body></html>`)
  win.document.close()
}
const keyOptions = ['C','C#','Db','D','Eb','E','F','F#','Gb','G','Ab','A','Bb','B','Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','G#m','Am','Bbm','Bm']

function normalizeImportedKey(value) {
  const match = String(value || '').trim().match(/^([A-G])\s*([#b]?)(?:\s*(m|min|minor|maj|major))?$/i)
  if (!match) return ''
  const root = match[1].toUpperCase() + match[2]
  const minor = /^(m|min|minor)$/i.test(match[3] || '')
  const candidate = root + (minor ? 'm' : '')
  return keyOptions.find(key => key.toLowerCase() === candidate.toLowerCase()) || candidate
}

function detectImportedKey(text) {
  const candidates = [
    String(text || '').match(/\[\s*([A-G](?:#|b)?\s*(?:m|min|minor|maj|major)?)\s*\]/i)?.[1],
    String(text || '').match(/(?:tonalidad|tono|key)\s*[:=\-]\s*([A-G](?:#|b)?\s*(?:m|min|minor|maj|major)?)/i)?.[1],
  ].filter(Boolean)
  for (const candidate of candidates) {
    const normalized = normalizeImportedKey(candidate)
    if (normalized) return normalized
  }
  return ''
}

function isChordOnlyLine(line) {
  const cleaned = String(line || '').trim().replace(/[.·•|,:]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return false
  const chordToken = /^(?:N\.?C\.?|[A-G](?:#|b)?(?:m|min|maj|dim|aug|sus[24]?|add\d+|m(?:aj)?\d+|maj\d+|[0-9]+|ø|°)?(?:\/[A-G](?:#|b)?)?(?:\([^)]*\))?)$/i
  const tokens = cleaned.split(' ')
  return tokens.length > 0 && tokens.some(token => /^[A-G]/i.test(token)) && tokens.every(token => chordToken.test(token) || /^[()\[\]{}]+$/.test(token))
}

function reconstructPdfRows(items, pageNumber) {
  const runs = (items || []).filter(item => typeof item.str === 'string' && item.str.trim()).map(item => {
    const transform = item.transform || []
    return {
      text: item.str,
      x: Number(transform[4] || 0),
      y: Number(transform[5] || 0),
      width: Number(item.width || 0),
      fontSize: Math.hypot(Number(transform[0] || 0), Number(transform[1] || 0)) || Number(item.height || 10),
    }
  })
  if (!runs.length) return []
  const widths = runs.map(run => run.width / Math.max(1, run.text.length)).filter(width => Number.isFinite(width) && width > 1.2 && width < 30).sort((a,b)=>a-b)
  const cellWidth = widths.length ? widths[Math.floor(widths.length / 2)] : 5
  const pageMinX = Math.min(...runs.map(run => run.x))
  const sorted = [...runs].sort((a,b)=>b.y-a.y || a.x-b.x)
  const grouped = []
  for (const run of sorted) {
    const tolerance = Math.max(1.5, Math.min(3.5, run.fontSize * 0.24))
    let row = grouped.find(candidate => Math.abs(candidate.y - run.y) <= tolerance)
    if (!row) {
      row = { y: run.y, pageNumber, items: [], fontSize: run.fontSize }
      grouped.push(row)
    }
    row.items.push(run)
    row.fontSize = Math.max(row.fontSize, run.fontSize)
  }
  return grouped.map(row => {
    const chars = []
    row.items.sort((a,b)=>a.x-b.x)
    for (const run of row.items) {
      const start = Math.max(0, Math.round((run.x - pageMinX) / cellWidth))
      const charWidth = run.width > 0 ? run.width / Math.max(1, run.text.length) : cellWidth
      for (let i = 0; i < run.text.length; i++) {
        const pos = start + Math.max(0, Math.round((i * charWidth) / cellWidth))
        if (pos > 1800) continue
        if (chars[pos] == null || chars[pos] === ' ' || run.text[i] !== ' ') chars[pos] = run.text[i]
      }
    }
    const maxIndex = chars.length ? chars.length - 1 : -1
    const text = maxIndex >= 0 ? Array.from({ length: maxIndex + 1 }, (_,i) => chars[i] ?? ' ').join('').replace(/[\u00a0\t]/g, ' ').replace(/\s+$/, '') : ''
    return { text, y: row.y, pageNumber: row.pageNumber, fontSize: row.fontSize }
  }).filter(row => row.text.trim())
}

async function readSongPdfInBrowser(file) {
  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist/build/pdf.mjs'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise
  try {
    const rows = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      rows.push(...reconstructPdfRows(content.items, pageNumber))
      page.cleanup()
    }
    const nonEmpty = rows.filter(row => row.text.trim())
    if (!nonEmpty.length) throw new Error('No pude extraer texto del PDF. Puede ser un escaneo o una imagen; esta primera versión requiere un PDF con texto seleccionable.')
    const first = nonEmpty[0]
    const rawTitle = first.text.trim()
    const key = detectImportedKey(rawTitle) || detectImportedKey(nonEmpty.slice(0, 10).map(row => row.text.trim()).join('\n')) || 'C'
    const title = rawTitle
      .replace(/\s*\[\s*[A-G](?:#|b)?\s*(?:m|min|minor|maj|major)?\s*\]\s*/i, ' ')
      .replace(/\s{2,}/g, ' ').trim() || file.name.replace(/\.pdf$/i, '')
    const metadataKeyLine = nonEmpty.findIndex((row,index) => index > 0 && /^(?:tonalidad|tono|key)\s*[:=\-]/i.test(row.text.trim()))
    const artistIndex = nonEmpty.findIndex((row,index) => index > 0 && /\bby\s+/i.test(row.text.trim()))
    let artist = ''
    if (artistIndex >= 0) {
      const line = nonEmpty[artistIndex].text.trim()
      const byMatch = line.match(/\bby\s+(.+)$/i)
      artist = (byMatch?.[1] || line).trim().replace(/^\[|\]$/g, '')
    }
    const headerIndexes = new Set([0])
    if (artistIndex >= 0) headerIndexes.add(artistIndex)
    if (metadataKeyLine >= 0) headerIndexes.add(metadataKeyLine)
    const bodyRows = nonEmpty.filter((row,index) => {
      if (headerIndexes.has(index)) return false
      const text = row.text.trim()
      if (text === rawTitle || text === title) return false
      if (/^(?:p[aá]gina\s*)?\d+(?:\s*\/\s*\d+)?$/i.test(text)) return false
      if (/^(?:tonalidad|tono|key)\s*[:=\-]/i.test(text)) return false
      if (/copyright|todos los derechos reservados/i.test(text)) return false
      return true
    })
    if (!bodyRows.length) throw new Error('Detecté el encabezado, pero no encontré contenido musical debajo. Revisa si el PDF tiene texto seleccionable.')
    const chordSheet = bodyRows.map(row => row.text).join('\n').trim()
    const lyrics = bodyRows.filter(row => !isChordOnlyLine(row.text)).map(row => row.text.trim()).filter(Boolean).join('\n').trim()
    const warnings = []
    if (!detectImportedKey(rawTitle) && !detectImportedKey(nonEmpty.slice(0, 10).map(row => row.text.trim()).join('\n'))) warnings.push('No encontré la tonalidad en el encabezado; confirma el tono antes de guardar.')
    if (!lyrics) warnings.push('No pude separar claramente la letra de los acordes; revisa la vista previa.')
    if (!bodyRows.some(row => isChordOnlyLine(row.text))) warnings.push('No detecté líneas de acordes aisladas. Comprueba que el PDF haya conservado su formato.')
    return {
      id: `import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
      title,
      artist,
      key,
      bpm: null,
      duration: '',
      lyrics,
      chords: chordSheet,
      tags: [],
      audioUrl: '',
      referenceUrl: '',
      variants: [],
      fileVariants: [],
      importFileName: file.name,
      importWarnings: warnings,
      include: true,
    }
  } finally {
    await pdf.destroy()
  }
}

function useData(collectionName, cloud, user, accessProfile = null, profileLoading = false) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setError('')
    setLoading(true)
    if (!cloud || !user) {
      setItems([])
      setLoading(false)
      return
    }
    if (profileLoading) return
    if (!accessProfile || accessProfile.active !== true) {
      setItems([])
      setLoading(false)
      return
    }
    const role = roleName(accessProfile.role)
    let source = collection(db, collectionName)
    if (role === 'Visor') {
      if (collectionName === 'services') source = query(source, where('invitedPersonIds', 'array-contains', accessProfile.personId))
      else if (collectionName === 'songs') source = query(source, where('visibleTo', 'array-contains', accessProfile.personId))
      else if (collectionName === 'people') source = query(source, where('email', '==', String(user.email || '').toLowerCase()))
      else if (collectionName === 'serviceResponses') source = query(source, where('personId', '==', accessProfile.personId))
      else { setItems([]); setLoading(false); return }
    }
    const unsub = onSnapshot(source, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, err => {
      console.error(err)
      setError(`No se pudo cargar ${collectionName}. Verifica tu perfil y las reglas de Firestore.`)
      setLoading(false)
    })
    return () => unsub()
  }, [collectionName, cloud, user?.uid, user?.email, accessProfile?.personId, accessProfile?.role, accessProfile?.active, profileLoading])
  const upsert = async (item) => {
    if (!cloud || !user) throw new Error('Firebase no está configurado. No se guardaron los cambios.')
    const record = { ...item, id: item.id || uid(), updatedAt: new Date().toISOString() }
    const { id, ...data } = record
    await setDoc(doc(db, collectionName, id), data, { merge: true })
    return record
  }
  const remove = async (id) => {
    if (!cloud || !user) throw new Error('Firebase no está configurado. No se eliminó el registro.')
    await deleteDoc(doc(db, collectionName, id))
  }
  const replaceAll = async (records) => {
    for (const record of records) await upsert(record)
  }
  return { items, setItems, loading, error, upsert, remove, replaceAll }
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMessage('')
    try { await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password) }
    catch (err) { setMessage(err.code === 'auth/invalid-credential' ? 'Correo o contraseña incorrectos.' : err.code === 'auth/too-many-requests' ? 'Hubo demasiados intentos. Espera unos minutos o restablece la contraseña.' : 'No se pudo completar el acceso. Revisa los datos y la configuración de Firebase.') }
    finally { setBusy(false) }
  }
  const reset = async () => {
    if (!email.trim()) { setMessage('Escribe tu correo para recibir el enlace de recuperación.'); return }
    try { await sendPasswordResetEmail(auth, email.trim()); setMessage('Te enviamos un enlace para restablecer tu contraseña.') }
    catch { setMessage('No se pudo enviar el correo. Verifica la dirección ingresada.') }
  }
  const googleLogin = async () => {
    setBusy(true); setMessage('')
    try { await signInWithPopup(auth, new GoogleAuthProvider()) }
    catch { setMessage('No se pudo ingresar con Google. Revisa que Google esté habilitado en Firebase Authentication.') }
    finally { setBusy(false) }
  }
  return <div className="login-shell"><div className="login-left"><div className="brand login-brand"><span className="brand-mark"><img src="/planningband-logo.svg" alt="" /></span><span>PlanningBand</span></div><div className="login-form-wrap"><div className="eyebrow">GESTIÓN DE EQUIPO</div><h1>{'Bienvenido de vuelta'}</h1><p className="muted">{'Inicia sesión para organizar los servicios de tu iglesia.'}</p><form onSubmit={submit} className="login-form"><label>Correo electrónico</label><div className="input-icon"><Mail size={17}/><input type="email" placeholder="nombre@iglesia.cl" value={email} onChange={e => setEmail(e.target.value)}  required/></div><label>Contraseña</label><div className="input-icon"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required/><button type="button" className="icon-btn subtle" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{message && <div className="inline-alert">{message}</div>}<button className="btn primary full" disabled={busy}>{busy ? 'Procesando…' : 'Iniciar sesión'} <ArrowRight size={17}/></button><button type="button" className="btn google-login full" onClick={googleLogin} disabled={busy}><span className="google-g">G</span> Continuar con Google</button><button type="button" className="link-btn" onClick={reset}>¿Olvidaste tu contraseña?</button></form><div className="login-footnote"><ShieldCheck size={15}/> Acceso protegido mediante Firebase Authentication.</div></div><div className="login-footer">Una sola plataforma para servir mejor.</div></div><div className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-orbit orbit-three"/><div className="art-note"><div className="art-note-icon"><CalendarDays size={19}/></div><span>Todo listo para el domingo</span><CheckCircle2 size={18}/></div><div className="art-main"><span className="art-kicker">ORDEN · EQUIPO · REPERTORIO</span><h2>Un equipo.<br/><em>Un mismo propósito.</em></h2><p>Planifica cada servicio con claridad y prepara a tu equipo para lo que importa.</p><div className="art-dots"><i/><i/><i/><i/></div></div><div className="art-quote">“Cantad a Jehová cántico nuevo.” <span>— Salmos 96:1</span></div></div></div>
}

function FirebaseSetupScreen() {
  return <div className="verification-screen setup-screen"><div className="verification-card setup-card">
    <span className="verification-icon"><ShieldCheck size={28}/></span>
    <div className="eyebrow">PLANNINGBAND · CONFIGURACIÓN INICIAL</div>
    <h1>Conecta tu espacio de trabajo</h1>
    <p>La aplicación aún no tiene los datos de configuración de Firebase. Para activarla, completa el archivo <code>src/firebase-config.js</code> y publica el cambio en GitHub. No necesitas crear variables de entorno en Netlify.</p>
    <div className="setup-steps">
      <div><span>1</span><p><strong>Firebase Authentication</strong><br/>En Firebase Console → Build → Authentication → Sign-in method, activa Email/Password. Activa Google solo si vas a usar ese método.</p></div>
      <div><span>2</span><p><strong>Firestore Database</strong><br/>Conserva tu base de datos actual y revisa las reglas antes de publicarlas. No borres los documentos que ya creaste.</p></div>
      <div><span>3</span><p><strong>Archivo de configuración</strong><br/>En GitHub abre <code>src/firebase-config.js</code> y pega los cinco valores de Firebase: <code>apiKey</code>, <code>authDomain</code>, <code>projectId</code>, <code>messagingSenderId</code> y <code>appId</code>.</p></div>
      <div><span>4</span><p><strong>Publicar y probar</strong><br/>Guarda el archivo con Commit changes y espera a que Netlify publique el nuevo despliegue. Después inicia sesión con el correo registrado.</p></div>
    </div>
    <p className="setup-note">No introduzcas contraseñas ni claves privadas en el archivo. La configuración de Firebase para una app web es visible en el navegador; los datos se protegen con Authentication y reglas correctas de Firestore.</p>
  </div></div>
}

function AppRoot() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true) })
  }, [])
  if (!firebaseConfigured) return <FirebaseSetupScreen />
  if (!authReady) return <div className="loading-screen"><div className="loader"/><span>Preparando tu espacio…</span></div>
  if (!user) return <LoginScreen/>
  return <AppShell user={user} cloud/>
}

function AccessBlockedScreen({ user }) {
  return <div className="verification-screen"><div className="verification-card"><span className="verification-icon"><ShieldCheck size={28}/></span><div className="eyebrow">ACCESO CONTROLADO</div><h1>Tu cuenta aún no tiene permisos</h1><p>El correo <strong>{user?.email}</strong> no está registrado como integrante activo en PlanningBand. Pide al administrador que te registre y asigne un rol.</p><p className="muted">Por seguridad, la aplicación no mostrará servicios ni canciones hasta que tu acceso esté autorizado.</p><button className="btn primary full" onClick={()=>signOut(auth)}><LogOut size={16}/>Cerrar sesión</button></div></div>
}

function AppShell({ user, cloud }) {
  const [accessProfile, setAccessProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(Boolean(cloud && user))
  useEffect(() => {
    if (!cloud || !user?.email) { setAccessProfile(null); setProfileLoading(false); return }
    let active = true
    setProfileLoading(true)
    getDoc(doc(db, 'memberAccess', user.email.toLowerCase())).then(snapshot => {
      if (active) setAccessProfile(snapshot.exists() ? snapshot.data() : null)
    }).catch(error => {
      console.error(error)
      if (active) setAccessProfile(null)
    }).finally(() => { if (active) setProfileLoading(false) })
    return () => { active = false }
  }, [cloud, user?.uid, user?.email])
  const servicesStore = useData('services', cloud, user, accessProfile, profileLoading)
  const songsStore = useData('songs', cloud, user, accessProfile, profileLoading)
  const peopleStore = useData('people', cloud, user, accessProfile, profileLoading)
  const teamsStore = useData('teams', cloud, user, accessProfile, profileLoading)
  const typesStore = useData('serviceTypes', cloud, user, accessProfile, profileLoading)
  const notesStore = useData('notes', cloud, user, accessProfile, profileLoading)
  const responsesStore = useData('serviceResponses', cloud, user, accessProfile, profileLoading)
  const services = servicesStore.items, songs = songsStore.items, people = peopleStore.items, teams = teamsStore.items, serviceTypes = typesStore.items, serviceResponses = responsesStore.items
  const currentPerson = people.find(p => String(p.email || '').toLowerCase() === String(user?.email || '').toLowerCase()) || null
  const currentRole = cloud ? roleName(accessProfile?.role) : 'Administrador'
  const isAdmin = currentRole === 'Administrador'
  const canEdit = isAdmin || currentRole === 'Editor'
  const isViewer = currentRole === 'Visor'
  const visibleServices = isViewer && currentPerson ? services.filter(s => (s.invitedPersonIds || []).includes(currentPerson.id)) : services
  const visibleSongIds = new Set(visibleServices.flatMap(s => (s.order || []).flatMap(sec => sec.items || []).map(item => item.songId).filter(Boolean)))
  const declineCount = serviceResponses.filter(response => response.status === 'declined').length
  const visibleSongs = isViewer ? songs.filter(song => visibleSongIds.has(song.id)) : songs
  const [page, setPage] = useState('services')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [serviceTab, setServiceTab] = useState('order')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(iso(today.getDate(), today.getMonth(), today.getFullYear()))
  const [peopleSubtab, setPeopleSubtab] = useState('people')
  const [expandedTypes, setExpandedTypes] = useState([])
  const [accountMenu, setAccountMenu] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => { if (services.length && !services.some(s => s.id === selectedServiceId)) setSelectedServiceId(services[0].id) }, [services, selectedServiceId])
  useEffect(() => { if (isViewer && !['schedule','songs'].includes(page)) setPage('schedule') }, [isViewer, page])
  const selectedService = services.find(s => s.id === selectedServiceId) || null
  const allLoading = profileLoading || [servicesStore, songsStore, peopleStore, teamsStore, typesStore, notesStore, responsesStore].some(s => s.loading)
  const storeError = [servicesStore, songsStore, peopleStore, teamsStore, typesStore, notesStore, responsesStore].find(s => s.error)?.error
  const flash = (msg) => { setNotice(msg); window.clearTimeout(flash._timer); flash._timer = window.setTimeout(() => setNotice(''), 3200) }
  const navigate = (next) => { setPage(next); setQuery(''); setMobileNav(false) }

  // Creates a Firebase Auth account in a secondary app so the admin's own session stays intact,
  // then emails a password-reset link. The Firestore memberAccess profile already restricts access.
  const sendAccountSetupLink = async (emailValue) => {
    const email = String(emailValue || '').trim().toLowerCase()
    if (!cloud || !auth || !email) throw new Error('Configura Firebase y verifica el correo antes de enviar la invitación.')
    const secondaryApp = initializeApp(auth.app.options, `alabanza-invite-${uid()}`)
    const secondaryAuth = getAuth(secondaryApp)
    secondaryAuth.languageCode = 'es'
    try {
      try {
        const randomBytes = window.crypto.getRandomValues(new Uint8Array(24))
        const temporaryPassword = Array.from(randomBytes, value => value.toString(36)).join('') + 'Aa9!'
        await createUserWithEmailAndPassword(secondaryAuth, email, temporaryPassword)
      } catch (error) {
        if (error.code !== 'auth/email-already-in-use') throw error
      }
      await sendPasswordResetEmail(secondaryAuth, email, { url: window.location.origin, handleCodeInApp: false })
    } finally {
      await signOut(secondaryAuth).catch(() => {})
      await deleteApp(secondaryApp).catch(() => {})
    }
  }

  const persistService = async (record) => {
    const assignedIds = [...new Set([...(record.invitedPersonIds || []), ...Object.values(record.teamAssignments || {}).flat()])]
    const normalized = { ...record, invitedPersonIds: assignedIds }
    await servicesStore.upsert(normalized)

    // Keep a separate response document for every person/service so a viewer cannot read another person's reason.
    for (const personId of assignedIds) {
      const id = `${normalized.id}_${personId}`
      if (!responsesStore.items.some(r => r.id === id || (r.serviceId === normalized.id && r.personId === personId))) {
        await responsesStore.upsert({ id, serviceId: normalized.id, personId, status: 'pending', reason: '' })
      }
    }
    for (const response of responsesStore.items.filter(r => r.serviceId === normalized.id && !assignedIds.includes(r.personId))) {
      await responsesStore.remove(response.id)
    }

    // Songs are readable to a viewer only while they belong to one of that person's assigned services.
    const before = servicesStore.items.find(item => item.id === normalized.id)
    const oldSongIds = new Set((before?.order || []).flatMap(section => (section.items || []).map(item => item.songId).filter(Boolean)))
    const newSongIds = new Set((normalized.order || []).flatMap(section => (section.items || []).map(item => item.songId).filter(Boolean)))
    const changedSongIds = new Set([...oldSongIds, ...newSongIds])
    if (changedSongIds.size) {
      const otherServices = [...services.filter(item => item.id !== normalized.id), normalized]
      for (const song of songsStore.items.filter(item => changedSongIds.has(item.id))) {
        const visibleTo = new Set()
        for (const svc of otherServices) {
          const containsSong = (svc.order || []).some(section => (section.items || []).some(item => item.songId === song.id))
          if (!containsSong) continue
          const peopleIds = [...new Set([...(svc.invitedPersonIds || []), ...Object.values(svc.teamAssignments || {}).flat()])]
          peopleIds.forEach(id => visibleTo.add(id))
        }
        const nextVisibility = [...visibleTo].sort()
        const currentVisibility = [...(song.visibleTo || [])].sort()
        if (JSON.stringify(nextVisibility) !== JSON.stringify(currentVisibility)) {
          await songsStore.upsert({ ...song, visibleTo: nextVisibility })
        }
      }
    }
    return normalized
  }
  const createService = async (data) => {
    const record = { id: uid(), title: data.title, date: data.date, typeId: data.typeId || '', startTime: data.startTime || '11:00', order: [{ id: uid(), name: 'ALABANZA', items: [] }, { id: uid(), name: 'ADORACIÓN', items: [] }], teamAssignments: {}, invitedPersonIds: [], notes: '', rehearsalNotes: '' }
    await persistService(record); setSelectedServiceId(record.id); setServiceTab('order'); navigate('service-detail'); setModal(null); flash('Servicio creado correctamente.')
  }
  const updateService = async (record) => { await persistService(record); setModal(null); flash('Cambios guardados.') }
  const saveInvitations = async ({ serviceId, invitees }) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    const allListedIds = new Set(invitees.map(entry => entry.personId))
    const selectedEntries = invitees.filter(entry => entry.checked)
    const teamAssignments = Object.fromEntries(Object.entries(service.teamAssignments || {})
      .map(([position, ids]) => [position, (ids || []).filter(id => !allListedIds.has(id))])
      .filter(([, ids]) => ids.length))
    selectedEntries.forEach(entry => {
      const position = entry.position || 'Equipo'
      teamAssignments[position] = [...new Set([...(teamAssignments[position] || []), entry.personId])]
    })
    const invitedPersonIds = [...new Set([...selectedEntries.map(entry => entry.personId), ...Object.values(teamAssignments).flat()])]
    await persistService({ ...service, teamAssignments, invitedPersonIds })
    setModal(null)
    flash(`${selectedEntries.length} integrante(s) guardado(s) en la convocatoria. Prepara sus avisos por WhatsApp o correo.`)
  }
  const saveResponse = async (serviceId, personId, status, reason = '') => {
    if (!serviceId || !personId || (status === 'declined' && !reason.trim())) return
    if (isViewer && personId !== accessProfile?.personId) return
    await responsesStore.upsert({ id: `${serviceId}_${personId}`, serviceId, personId, status, reason: reason.trim(), respondedAt: new Date().toISOString() })
    flash(status === 'accepted' ? 'Confirmaste tu asistencia.' : 'Tu respuesta fue enviada al administrador.')
  }
  const addQuickSong = async data => {
    const service = services.find(s => s.id === data.serviceId)
    if (!service) return
    const order = (service.order || []).map(section => section.id === data.sectionId ? { ...section, items: [...(section.items || []), { id: uid(), songId: null, title: data.title.trim(), description: data.description.trim(), key: data.key || 'C', duration: data.duration || '0:00', isTemporary: true }] } : section)
    await persistService({ ...service, order })
    setModal(null)
    flash('Canción temporal agregada a este servicio. Puedes incorporarla al repertorio más adelante.')
  }
  const deleteService = async (id) => {
    if (!window.confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) return
    const existing = services.find(s => s.id === id)
    if (existing) {
      // Delete the service once, then remove its individual responses and recalculate song visibility.
      await servicesStore.remove(id)
      for (const response of responsesStore.items.filter(item => item.serviceId === id)) await responsesStore.remove(response.id)
      const removedSongIds = new Set((existing.order || []).flatMap(section => (section.items || []).map(item => item.songId).filter(Boolean)))
      const remainingServices = services.filter(service => service.id !== id)
      for (const song of songsStore.items.filter(item => removedSongIds.has(item.id))) {
        const visibleTo = new Set()
        for (const service of remainingServices) {
          if (!(service.order || []).some(section => (section.items || []).some(item => item.songId === song.id))) continue
          ;[...(service.invitedPersonIds || []), ...Object.values(service.teamAssignments || {}).flat()].forEach(personId => visibleTo.add(personId))
        }
        await songsStore.upsert({ ...song, visibleTo: [...visibleTo].sort() })
      }
    } else {
      await servicesStore.remove(id)
    }
    if (selectedServiceId === id) navigate('services')
    flash('Servicio eliminado.')
  }

  const shellNav = isViewer
    ? [{ id: 'schedule', label: 'Mis servicios', icon: CalendarDays }, { id: 'songs', label: 'Canciones', icon: ListMusic }]
    : isAdmin
      ? [{ id: 'services', label: 'Servicios', icon: CalendarDays }, { id: 'songs', label: 'Canciones', icon: ListMusic }, { id: 'people', label: 'Personas y permisos', icon: Users }]
      : [{ id: 'services', label: 'Servicios', icon: CalendarDays }, { id: 'songs', label: 'Canciones', icon: ListMusic }, { id: 'teams', label: 'Equipos', icon: Guitar }]

  if (allLoading) return <div className="loading-screen"><div className="loader"/><span>Cargando tus servicios…</span></div>
  if (cloud && (!accessProfile || accessProfile.active !== true || !['Administrador', 'Editor', 'Visor'].includes(accessProfile.role))) return <AccessBlockedScreen user={user}/>
  return <div className="app-frame">
    <header className="topbar"><button className="mobile-menu icon-btn" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button><button className="brand top-brand" onClick={() => navigate('services')}><span className="brand-mark"><img src="/planningband-logo.svg" alt="" /></span><span>PlanningBand</span><ChevronDown size={14} className="brand-chevron"/></button><nav className="top-nav">{shellNav.map(n => <button key={n.id} className={`top-nav-item ${page === n.id || (n.id === 'services' && page === 'service-detail') ? 'active' : ''}`} onClick={() => navigate(n.id)}>{n.label}</button>)}</nav><div className="top-spacer"/><button className="search-shortcut" onClick={() => { setPage('songs'); setMobileNav(false); window.setTimeout(() => document.querySelector('.global-search')?.focus(), 100) }}><Search size={17}/><span>Buscar</span><kbd>⌘ K</kbd></button><button className="icon-btn notification-btn" onClick={() => flash(declineCount ? `Hay ${declineCount} declinación(es) que requieren revisar reemplazos.` : 'No tienes respuestas pendientes.')} aria-label="Notificaciones"><Bell size={19}/>{declineCount>0&&<i/>}</button><div className="account-wrap"><button className="account-btn" onClick={() => setAccountMenu(!accountMenu)}><span className="avatar avatar-main">{initials(user?.email?.split('@')[0] || 'IR')}</span><span className="account-name">{user?.email?.split('@')[0] || 'Cuenta'}</span><ChevronDown size={14}/></button>{accountMenu && <div className="account-popover"><div className="account-popover-head"><strong>{user?.email || 'Sesión de usuario'}</strong><span>Conectado a Firebase</span></div>{cloud ? <button onClick={() => signOut(auth)}><LogOut size={15}/> Cerrar sesión</button> : <button onClick={() => flash('Configura Firebase para habilitar cuentas y sincronización en la nube.')}><Settings size={15}/> Configurar sincronización</button>}</div>}</div></header>
    <div className="notice-bar"><span className="notice-dot"><Activity size={14}/></span><span>Espacio conectado a Firebase. Los cambios se sincronizan en la nube.</span><button onClick={() => setAccountMenu(false)} aria-label="Cerrar aviso"><X size={15}/></button></div>
    <div className="app-body">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}><div className="workspace-switch"><span className="workspace-icon"><img src="/planningband-logo.svg" alt="" /></span><span><strong>Casa de Alabanza</strong><small>Equipo de alabanza</small></span><ChevronDown size={15}/></div><div className="sidebar-label">ESPACIO DE TRABAJO</div>{shellNav.map(n => { const Icon = n.icon; return <button key={n.id} className={`side-link ${page === n.id || (n.id === 'services' && page === 'service-detail') ? 'selected' : ''}`} onClick={() => navigate(n.id)}><Icon size={18}/><span>{n.label}</span>{n.id === 'services' && <span className="side-count">{services.length}</span>}</button> })}<div className="sidebar-divider"/><div className="sidebar-label">HERRAMIENTAS</div>{!isViewer && <button className={`side-link ${page === 'schedule' ? 'selected' : ''}`} onClick={() => navigate('schedule')}><CalendarDays size={18}/><span>Vista de agenda</span></button>}{canEdit && <button className={`side-link ${page === 'teams' ? 'selected' : ''}`} onClick={() => navigate('teams')}><Guitar size={18}/><span>Equipos</span></button>}{isAdmin && <button className={`side-link ${page === 'settings' ? 'selected' : ''}`} onClick={() => navigate('settings')}><Settings size={18}/><span>Configuración</span></button>}<div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>¿Necesitas ayuda?</strong><p>Organiza a tu equipo con todo en un solo lugar.</p><button onClick={() => setModal({ kind: 'help' })}>Ver guía rápida <ArrowRight size={14}/></button></div><div className="sidebar-user"><span className="avatar avatar-small">{initials(user?.email?.split('@')[0] || 'IR')}</span><div><strong>{user?.email?.split('@')[0] || 'Usuario'}</strong><small>{user ? user.email : 'Administrador'}</small></div><button className="icon-btn subtle" onClick={() => setAccountMenu(!accountMenu)}><MoreHorizontal size={18}/></button></div></div></aside>
      <main className="main-content">
        {storeError && <div className="error-banner"><ShieldCheck size={16}/>{storeError}</div>}
        {page === 'services' && canEdit && <ServicesPage services={services} serviceTypes={serviceTypes} songs={songs} people={people} isAdmin={isAdmin} monthCursor={monthCursor} setMonthCursor={setMonthCursor} selectedDay={selectedDay} setSelectedDay={setSelectedDay} expandedTypes={expandedTypes} setExpandedTypes={setExpandedTypes} setModal={setModal} createService={createService} openService={s => { setSelectedServiceId(s.id); setServiceTab('order'); navigate('service-detail') }} />}
        {page === 'service-detail' && selectedService && canEdit && <ServiceDetail service={selectedService} servicesStore={servicesStore} cloud={cloud} isAdmin={isAdmin} songs={songs} people={people} teams={teams} serviceTypes={serviceTypes} serviceResponses={serviceResponses} tab={serviceTab} setTab={setServiceTab} setModal={setModal} updateService={updateService} persistService={persistService} deleteService={deleteService} flash={flash} />}
        {page === 'service-detail' && !selectedService && canEdit && <EmptyState icon={CalendarDays} title="Todavía no hay servicios" body="Crea el primer servicio de tu iglesia para comenzar a planificar." action="Crear servicio" onAction={() => setModal({ kind: 'service', value: null })}/>}
        {page === 'songs' && <SongsPage songs={visibleSongs} services={visibleServices} songsStore={songsStore} query={query} setQuery={setQuery} setModal={setModal} flash={flash} readOnly={!isAdmin}/>}
        {page === 'people' && isAdmin && <PeoplePage people={people} peopleStore={peopleStore} teams={teams} teamsStore={teamsStore} query={query} setQuery={setQuery} subtab={peopleSubtab} setSubtab={setPeopleSubtab} setModal={setModal} flash={flash}/>}
        {page === 'teams' && canEdit && <TeamsPage teams={teams} people={people} teamsStore={teamsStore} setModal={setModal} flash={flash}/>}
        {page === 'schedule' && (isViewer ? <ViewerDashboard services={visibleServices} person={currentPerson} songs={visibleSongs} responses={serviceResponses} onRespond={saveResponse} /> : <MySchedule services={services} people={people} openService={s => {setSelectedServiceId(s.id);setServiceTab('order');navigate('service-detail')}} />)}
        {page === 'services' && !canEdit && <ViewerDashboard services={visibleServices} person={currentPerson} songs={visibleSongs} responses={serviceResponses} onRespond={saveResponse} />}
        {page === 'settings' && isAdmin && <SettingsPage user={user} services={services} flash={flash} />}
      </main>
    </div>
    <div className="utility-rail"><button onClick={() => setModal({ kind: 'help' })} aria-label="Ayuda"><CircleHelp size={19}/></button><button onClick={() => flash(declineCount ? `Hay ${declineCount} declinación(es) que requieren revisar reemplazos.` : 'No tienes respuestas pendientes.')} aria-label="Notificaciones"><Bell size={19}/></button><button onClick={() => navigate('schedule')} aria-label="Agenda"><CalendarDays size={19}/></button><button onClick={() => navigate('songs')} aria-label="Canciones"><Music2 size={19}/></button><button onClick={() => setModal({ kind: 'help' })} aria-label="Ideas"><Sparkles size={19}/></button></div>
    <AppEventsBridge onNavigate={navigate} onDuplicate={async record => { await persistService(record); setSelectedServiceId(record.id); navigate('service-detail'); flash('Servicio duplicado.') }} onDeleteService={deleteService} onSectionUpdate={async data => { await persistService(data.service); flash('Sección actualizada.') }} />
    {modal && (canEdit || modal.kind === 'song-reader') && <ModalHost modal={modal} setModal={setModal} onCreateService={createService} onUpdateService={updateService} onDeleteService={deleteService} onSaveInvitations={saveInvitations} onAddQuickSong={addQuickSong} onSaveSong={async d => { const rec = await songsStore.upsert(d); setModal(null); flash('Canción guardada. Los PDF se generan cuando cada integrante los abre.'); return rec }} onImportSongs={async records => { await Promise.all(records.map(record => songsStore.upsert(record))); setModal(null); flash(`${records.length} canción(es) importada(s) desde PDF.`) }} onDeleteSong={id => songsStore.remove(id)} onSavePerson={async d => { const { previousEmail, ...personData } = d; const saved = await peopleStore.upsert({ ...personData, role: roleName(d.role), email: String(d.email || '').trim().toLowerCase() }); if (cloud && previousEmail && previousEmail !== saved.email) await deleteDoc(doc(db, 'memberAccess', String(previousEmail).toLowerCase())); if (cloud && saved.email) { const profile = { email: saved.email, personId: saved.id, role: roleName(saved.role), active: saved.status !== 'Inactivo' }; await setDoc(doc(db, 'memberAccess', saved.email), profile, { merge: true }); if (saved.email === String(user?.email || '').toLowerCase()) setAccessProfile(profile) }; setModal(null); flash('Integrante guardado. Abre su ficha para enviarle el enlace de acceso.') }} onSaveType={async d => { await typesStore.upsert(d); setModal(null); flash('Tipo de servicio guardado.') }} onSaveTeam={async d => { await teamsStore.upsert(d); setModal(null); flash('Equipo guardado.') }} onSendInvite={sendAccountSetupLink} cloud={cloud} songs={songs} people={people} teams={teams} serviceTypes={serviceTypes} services={services} currentRole={currentRole} />}
    {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
  </div>
}

function PageHeading({ eyebrow, title, description, actions }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="heading-actions">{actions}</div>}</div> }
function SectionTitle({ title, meta, actions }) { return <div className="section-title"><div><h2>{title}</h2>{meta && <span>{meta}</span>}</div>{actions}</div> }
function Btn({ children, variant = 'default', size = '', ...props }) { return <button className={`btn ${variant} ${size}`} {...props}>{children}</button> }
function EmptyState({ icon: Icon = Folder, title, body, action, onAction }) { return <div className="empty-state"><div className="empty-icon"><Icon size={24}/></div><h2>{title}</h2><p>{body}</p>{action && <Btn variant="primary" onClick={onAction}><Plus size={16}/>{action}</Btn>}</div> }

function MiniCalendar({ services, monthCursor, setMonthCursor, selectedDay, setSelectedDay }) {
  const year = monthCursor.getFullYear(), month = monthCursor.getMonth()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1
    const date = dayNum < 1 ? new Date(year, month - 1, prevDays + dayNum) : dayNum > daysInMonth ? new Date(year, month + 1, dayNum - daysInMonth) : new Date(year, month, dayNum)
    return { date, day: date.getDate(), inMonth: date.getMonth() === month, iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
  })
  const scheduled = new Set(services.map(s => s.date))
  return <div className="calendar-widget"><div className="calendar-head"><strong>{monthName(monthCursor)}</strong><div className="calendar-arrows"><button onClick={() => setMonthCursor(new Date(year, month - 1, 1))}><ChevronLeft size={15}/></button><button onClick={() => setMonthCursor(new Date())} title="Ir al mes actual"><span>•</span></button><button onClick={() => setMonthCursor(new Date(year, month + 1, 1))}><ChevronRight size={15}/></button></div></div><div className="calendar-grid calendar-weekdays">{['LU','MA','MI','JU','VI','SÁ','DO'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{cells.slice(0, 35).map((c, i) => <button key={i} className={`calendar-day ${!c.inMonth ? 'outside' : ''} ${selectedDay === c.iso ? 'current' : ''} ${c.iso === localTodayISO() ? 'today' : ''}`} onClick={() => {setSelectedDay(c.iso); if (!c.inMonth) setMonthCursor(new Date(c.date.getFullYear(), c.date.getMonth(), 1))}}>{c.day}{scheduled.has(c.iso) && <i/>}</button>)}</div><button className="calendar-link" onClick={() => { setSelectedDay(''); setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1)) }}>Ver calendario completo <ArrowRight size={13}/></button></div>
}

function ServicesPage({ services, serviceTypes, songs, people, isAdmin = false, monthCursor, setMonthCursor, selectedDay, setSelectedDay, expandedTypes, setExpandedTypes, setModal, createService, openService }) {
  const [view, setView] = useState('list')
  const selectedServices = services.filter(s => !selectedDay || s.date === selectedDay).sort((a,b) => (a.date || '').localeCompare(b.date || ''))
  const upcoming = [...services].sort((a,b) => (a.date || '').localeCompare(b.date || '')).filter(s => s.date >= localTodayISO())
  const fmtTime = d => { const [h,m] = (d.startTime || '11:00').split(':').map(Number); const hh = h % 12 || 12; return `${hh}:${String(m).padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'}` }
  const dateOverview = selectedDay ? fmtDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximos servicios'
  const toggleType = id => setExpandedTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  return <>
    <div className="context-strip"><span className="context-dot"/> CASA DE ALABANZA <span className="context-sep">/</span> PLANIFICACIÓN</div>
    <PageHeading eyebrow="PLANIFICACIÓN" title="Servicios" description="Organiza cada reunión, prepara el repertorio y coordina a tu equipo." actions={<><Btn onClick={() => setView(view === 'list' ? 'calendar' : 'list')}><CalendarDays size={16}/>{view === 'list' ? 'Vista calendario' : 'Vista lista'}</Btn><Btn variant="primary" onClick={() => setModal({ kind: 'service', value: null })}><Plus size={17}/>Nuevo servicio</Btn></>}/>
    <div className="service-overview-grid"><div className="calendar-column"><MiniCalendar services={services} monthCursor={monthCursor} setMonthCursor={setMonthCursor} selectedDay={selectedDay} setSelectedDay={setSelectedDay}/><div className="day-agenda"><div className="mini-section-head"><span>{selectedDay ? dateOverview : 'ESTA SEMANA'}</span><span className="count-pill">{selectedServices.length}</span></div>{selectedServices.length ? selectedServices.slice(0, 3).map(s => <button className="agenda-item" key={s.id} onClick={() => openService(s)}><span className="agenda-line"/><span className="agenda-copy"><strong>{s.title}</strong><small>{s.startTime || 'Hora por definir'} · {serviceTypes.find(t => t.id === s.typeId)?.category || 'Servicio'}</small></span></button>) : <div className="agenda-empty">No hay servicios para esta fecha.</div>}{selectedDay && <button className="text-link" onClick={() => setModal({ kind: 'service', value: { date: selectedDay } })}><Plus size={13}/> Agregar a este día</button>}</div></div>
      <div className="service-types-column"><div className="service-types-head"><div><SectionTitle title="Tipos de servicio" meta={`${serviceTypes.length} plantillas`}/></div>{isAdmin && <button className="btn small" onClick={() => setModal({ kind: 'type', value: null })}><Plus size={15}/> Añadir tipo</button>}</div>
        {view === 'calendar' ? <div className="calendar-list-large"><div className="calendar-list-top"><button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()-1, 1))}><ChevronLeft size={18}/></button><h3>{monthName(monthCursor)}</h3><button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 1))}><ChevronRight size={18}/></button></div>{Array.from({length:new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,0).getDate()},(_,i)=>i+1).map(day=>{const date=`${monthCursor.getFullYear()}-${String(monthCursor.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const matches=services.filter(s=>s.date===date);return <button key={date} className={`calendar-event-row ${selectedDay===date?'chosen':''}`} onClick={()=>setSelectedDay(date)}><span className="calendar-event-date"><b>{day}</b><small>{new Intl.DateTimeFormat('es-CL',{weekday:'short'}).format(new Date(`${date}T12:00:00`))}</small></span><span className="calendar-event-content">{matches.length ? matches.map(s=><span key={s.id} onClick={e=>{e.stopPropagation();openService(s)}} className="calendar-event-pill">{s.title}</span>) : <span className="no-event">Sin servicios programados</span>}</span></button>})}</div> : <div className="service-type-list">{serviceTypes.map((type, idx) => {const matches = services.filter(s => s.typeId === type.id);const expanded = expandedTypes.includes(type.id);return <div className="service-type-group" key={type.id}><div className="service-type-row"><button className="type-expand" onClick={() => toggleType(type.id)}>{expanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</button><button className="type-main" onClick={() => matches[0] ? openService(matches[0]) : setModal({ kind: 'service', value: { typeId: type.id, title: type.name } })}><span className={`type-color ${type.color || 'green'}`}/><span>{type.name}</span><small>{matches.length} {matches.length === 1 ? 'servicio' : 'servicios'}</small></button><div className="type-actions"><button className="type-view-btn" onClick={() => matches[0] ? openService(matches[0]) : setModal({ kind: 'service', value: { typeId: type.id, title: type.name } })}>Ver plan <ChevronDown size={13}/></button>{isAdmin && <button className="icon-btn subtle" onClick={() => setModal({ kind: 'type', value: type })} title="Editar tipo"><Settings size={16}/></button>}<button className="icon-btn subtle" onClick={() => setModal({ kind: 'service', value: { typeId: type.id, title: type.name } })} title="Crear servicio"><Plus size={17}/></button></div></div>{expanded && <div className="type-expanded">{matches.length ? matches.map(s => <button key={s.id} className="type-service-row" onClick={() => openService(s)}><span className="type-service-date"><CalendarDays size={14}/>{dateWritten(s.date)}</span><ChevronRight size={15}/></button>) : <div className="type-no-services">No hay servicios programados en esta plantilla. <button onClick={() => setModal({ kind: 'service', value: { typeId: type.id, title: type.name } })}>Crear el primero <ArrowRight size={13}/></button></div>}</div>}</div>})}</div>}
        <div className="schedule-summary"><div className="summary-icon"><CalendarPlus size={18}/></div><div><strong>{upcoming.length} próximos servicios</strong><p>{songs.length} canciones en repertorio · {people.length} integrantes registrados</p></div><button className="icon-btn" onClick={() => setModal({ kind: 'service', value: null })}><Plus size={17}/></button></div>
      </div></div>
    <div className="below-fold-grid"><div className="panel"><SectionTitle title="Próximos servicios" meta="Ordenados por fecha" actions={<button className="text-link" onClick={() => setView('calendar')}>Ver calendario <ArrowRight size={14}/></button>}/>{upcoming.length ? <div className="upcoming-list">{upcoming.slice(0,4).map((s,i)=><button key={s.id} className="upcoming-row" onClick={() => openService(s)}><div className="date-tile"><small>{new Intl.DateTimeFormat('es-CL',{month:'short'}).format(new Date(`${s.date}T12:00:00`)).toUpperCase()}</small><strong>{new Date(`${s.date}T12:00:00`).getDate()}</strong></div><div className="upcoming-info"><strong>{s.title}</strong><span>{serviceTypes.find(t=>t.id===s.typeId)?.category || 'Servicio'} · {s.startTime || 'Hora por definir'}</span></div><span className="upcoming-status"><i/> Planificable</span><ChevronRight size={17}/></button>)}</div>:<p className="muted pad">No hay servicios próximos. Crea uno para empezar.</p>}</div><div className="panel quick-panel"><SectionTitle title="Accesos rápidos"/>{isAdmin && <button onClick={() => setModal({kind:'song',value:null})}><span className="quick-icon lavender"><Music2 size={17}/></span><span><strong>Agregar canción</strong><small>Ampliar el repertorio</small></span><Plus size={16}/></button>}{isAdmin && <button onClick={() => setModal({kind:'person',value:null})}><span className="quick-icon mint"><UserRound size={17}/></span><span><strong>Invitar integrante</strong><small>Completar el equipo</small></span><Plus size={16}/></button>}{isAdmin && <button onClick={() => setModal({kind:'type',value:null})}><span className="quick-icon peach"><CalendarDays size={17}/></span><span><strong>Crear plantilla</strong><small>Reutilizar un servicio</small></span><Plus size={16}/></button>}</div></div>
  </>
}

function ServiceDetail({ service, servicesStore, cloud, isAdmin = false, songs, people, teams, serviceTypes, serviceResponses = [], tab, setTab, setModal, updateService, persistService, deleteService, flash }) {
  const type = serviceTypes.find(t => t.id === service.typeId)
  const [newSection, setNewSection] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [songSearch, setSongSearch] = useState('')
  const [notesDraft, setNotesDraft] = useState(service.notes || '')
  const [rehearsalDraft, setRehearsalDraft] = useState(service.rehearsalNotes || '')
  useEffect(() => { setNotesDraft(service.notes || ''); setRehearsalDraft(service.rehearsalNotes || '') }, [service.id, service.notes, service.rehearsalNotes])
  const saveServiceText = async (field, value) => { try { await servicesStore.upsert({ ...service, [field]: value }); flash('Cambios guardados.'); } catch (error) { console.error(error); flash('No se pudo guardar. Comprueba la conexión y los permisos.'); } }
  const durationSeconds = (service.order || []).flatMap(s => s.items || []).reduce((sum, item) => { const p = (item.duration || '0:00').split(':').map(Number); return sum + (p[0] || 0)*60 + (p[1] || 0) }, 0)
  const durationText = `${Math.floor(durationSeconds/60)}:${String(durationSeconds%60).padStart(2,'0')}`
  const patch = (changes) => persistService({ ...service, ...changes })
  const patchOrder = order => patch({ order })
  const addSong = (sectionId, song, keyOverride = song.key || 'C') => { const pdf = (song.fileVariants||[]).find(file=>file.key===keyOverride&&file.kind==='acordes'); const order = (service.order||[]).map(section => section.id === sectionId ? { ...section, items: [...(section.items||[]), { id: uid(), songId: song.id, title: song.title, key: keyOverride, fileUrl: pdf?.url || '', duration: song.duration || '0:00' }] } : section); patchOrder(order); setSongSearch(''); flash(`“${song.title}” agregado en ${keyOverride}.`) }
  const removeSong = (sectionId, itemId) => patchOrder((service.order||[]).map(section => section.id === sectionId ? { ...section, items: section.items.filter(x => x.id !== itemId) } : section))
  const moveSong = (sectionId, idx, delta) => { const order=(service.order||[]).map(section=>{if(section.id!==sectionId)return section;const items=[...section.items];const dest=idx+delta;if(dest<0||dest>=items.length)return section;[items[idx],items[dest]]=[items[dest],items[idx]];return {...section,items}});patchOrder(order) }
  const updateSongItem = (sectionId,itemId,changes) => patchOrder((service.order||[]).map(section=>section.id===sectionId?{...section,items:section.items.map(item=>item.id===itemId?{...item,...changes}:item)}:section))
  const addSection = () => { if(!sectionName.trim())return; patchOrder([...(service.order||[]),{id:uid(),name:sectionName.trim().toUpperCase(),items:[]}]);setSectionName('');setNewSection(false) }
  const toggleMember = (instrument, memberId) => { const current = service.teamAssignments || {}; const list = current[instrument] || []; const next = { ...current, [instrument]: list.includes(memberId) ? list.filter(id => id !== memberId) : [...list, memberId] }; const cleanAssignments = Object.fromEntries(Object.entries(next).filter(([, ids]) => ids.length)); const invitedPersonIds = [...new Set(Object.values(cleanAssignments).flat())]; patch({ teamAssignments: cleanAssignments, invitedPersonIds }) }
  const roleBuckets = teams.flatMap(team => (team.groups || []).map(group => ({ ...group, teamName: team.name })))
  const groups = roleBuckets.length ? roleBuckets : [{name:'Bajo',instruments:['Bajo'],memberIds:[]},{name:'Batería',instruments:['Batería'],memberIds:[]},{name:'Guitarra acústica',instruments:['Guitarra acústica'],memberIds:[]},{name:'Guitarra eléctrica',instruments:['Guitarra eléctrica'],memberIds:[]},{name:'Keys',instruments:['Teclado'],memberIds:[]},{name:'Ministro',instruments:['Voz'],memberIds:[]},{name:'Coros',instruments:['Voz'],memberIds:[]},{name:'FOH',instruments:['Audio'],memberIds:[]}]
  return <>
    <div className="detail-breadcrumb"><button onClick={() => window.dispatchEvent(new CustomEvent('alabanza:navigate',{detail:'services'}))}><ArrowLeft size={15}/> Servicios</button><span>/</span><span>{type?.category || 'Servicio'}</span></div>
    <div className="detail-header"><div><div className="eyebrow">CASA DE ALABANZA · {type?.category?.toUpperCase() || 'PLAN DE SERVICIO'}</div><h1>{service.title}</h1><div className="detail-meta"><span><CalendarDays size={15}/>{fmtDate(service.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span><span><Clock3 size={15}/>{service.startTime || 'Hora por definir'}</span><span className="meta-dot"/><span>{(service.order||[]).flatMap(s=>s.items||[]).length} canciones</span><span>Duración estimada {durationText}</span></div></div><div className="heading-actions"><Btn onClick={() => setModal({kind:'service',value:service})}><Edit3 size={15}/>Editar</Btn><button className="icon-btn bordered" onClick={() => window.print()} title="Imprimir plan"><Printer size={17}/></button><button className="icon-btn bordered" onClick={() => setModal({kind:'service-actions',value:service})}><MoreHorizontal size={18}/></button></div></div>
    <div className="service-tabs"><button className={tab==='order'?'active':''} onClick={()=>setTab('order')}><ListMusic size={17}/>Orden <span>{(service.order||[]).flatMap(s=>s.items||[]).length}</span></button><button className={tab==='teams'?'active':''} onClick={()=>setTab('teams')}><Users size={17}/>Equipos <span>{Object.values(service.teamAssignments||{}).flat().length}</span></button><button className={tab==='rehearse'?'active':''} onClick={()=>setTab('rehearse')}><Headphones size={17}/>Ensayo</button></div>
    {tab==='order' && <div className="detail-content order-layout"><div className="order-main"><div className="order-toolbar"><div><h2>Orden del servicio</h2><p>Organiza la música y los momentos de la reunión.</p></div><div className="order-actions"><Btn onClick={() => setNewSection(!newSection)}><Plus size={15}/>Agregar sección</Btn><button className="icon-btn bordered" onClick={() => window.print()}><Printer size={16}/></button></div></div>{newSection && <form className="add-section-form" onSubmit={e=>{e.preventDefault();addSection()}}><input autoFocus value={sectionName} onChange={e=>setSectionName(e.target.value)} placeholder="Nombre de la sección, por ej. ORACIÓN"/><Btn variant="primary" type="submit">Agregar</Btn><Btn onClick={()=>setNewSection(false)}>Cancelar</Btn></form>}
      <div className="order-table"><div className="order-table-head"><span>ORDEN</span><span>TÍTULO</span><span>TONO</span><span>DURACIÓN</span><span/></div>{(service.order||[]).map(section=><div className="order-section" key={section.id}><div className="order-section-head"><span className="section-grip"><GripVertical size={14}/></span><strong>{section.name}</strong><span className="section-count">{section.items?.length || 0} canciones</span><div className="section-controls"><button onClick={()=>setModal({kind:'section-edit',value:{service,section}})} title="Editar sección"><Settings size={14}/></button><button onClick={()=>patchOrder((service.order||[]).filter(s=>s.id!==section.id))} title="Eliminar sección"><Trash2 size={14}/></button></div></div>{(section.items||[]).map((item,i)=><div className="order-item" key={item.id}><div className="order-item-grip"><button onClick={()=>moveSong(section.id,i,-1)} disabled={i===0} title="Subir"><ArrowDown className="move-up" size={13}/></button><button onClick={()=>moveSong(section.id,i,1)} disabled={i===section.items.length-1} title="Bajar"><ArrowDown size={13}/></button></div><div className="order-item-title"><span className="song-mini-icon"><Music2 size={15}/></span><button onClick={()=>setModal(isAdmin?{kind:'song',value:songs.find(s=>s.id===item.songId)||item}:{kind:'song-reader',value:songs.find(s=>s.id===item.songId)||item})}><strong>{item.title}</strong><small>{songs.find(s=>s.id===item.songId)?.artist || 'Canción del repertorio'}</small></button></div><select value={item.key||'C'} aria-label="Tonalidad" onChange={e=>updateSongItem(section.id,item.id,{key:e.target.value})}>{['C','C#','Db','D','Eb','E','F','F#','Gb','G','Ab','A','Bb','B','Cm','C#m','Dm','Ebm','Em','Fm','F#m','Gm','G#m','Am','Bbm','Bm'].map(k=><option key={k}>{k}</option>)}</select><input className="duration-input" value={item.duration||'0:00'} onChange={e=>updateSongItem(section.id,item.id,{duration:e.target.value})} aria-label="Duración"/><div className="order-item-actions"><button onClick={()=>moveSong(section.id,i,-1)} title="Mover arriba"><ChevronLeft size={15}/></button><button onClick={()=>removeSong(section.id,item.id)} title="Quitar canción"><X size={15}/></button></div></div>)}<div className="add-song-row"><Search size={15}/><input value={songSearch} onChange={e=>setSongSearch(e.target.value)} placeholder="Buscar o agregar canción al bloque…"/>{isAdmin && <button onClick={()=>setModal({kind:'song',value:null,returnTo:'service'})}><Plus size={14}/> Nueva canción</button>}{songSearch && <div className="song-search-results">{songs.filter(s=>s.title.toLowerCase().includes(songSearch.toLowerCase())).slice(0,5).map(song=><div className="song-search-result" key={song.id}><span><strong>{song.title}</strong><small>{song.bpm ? `${song.bpm} BPM` : 'Sin BPM'} · Elige una tonalidad disponible</small></span><div className="available-key-buttons">{[...new Set([song.key,...(song.variants||[]).map(v=>v.key),...(song.fileVariants||[]).map(v=>v.key)].filter(Boolean))].map(k=><button key={k} onClick={()=>addSong(section.id,song,k)}>{k}</button>)}</div></div>)}{!songs.some(s=>s.title.toLowerCase().includes(songSearch.toLowerCase()))&&<div className="no-search-results"><span>No existe en el repertorio.</span><button onClick={()=>setModal({kind:'quick-song',value:{title:songSearch,serviceId:service.id,sectionId:section.id}})}><Plus size={14}/>Agregar título temporal</button></div>}</div>}</div></div>)}</div>
      <div className="order-footer"><span><Clock3 size={15}/> Duración total estimada</span><strong>{durationText}</strong><span className="footer-sep"/><span>{(service.order||[]).flatMap(s=>s.items||[]).length} canciones</span><button className="text-link" onClick={()=>patch({order:[...(service.order||[]),{id:uid(),name:'NUEVA SECCIÓN',items:[]}]})}><Plus size={14}/>Sección vacía</button></div></div>
      <aside className="order-aside"><div className="panel info-panel"><div className="aside-title"><h3>Resumen del servicio</h3><button className="icon-btn subtle" onClick={()=>setModal({kind:'service',value:service})}><Edit3 size={14}/></button></div><div className="summary-line"><span>Fecha</span><strong>{fmtDate(service.date,{day:'numeric',month:'short',year:'numeric'})}</strong></div><div className="summary-line"><span>Hora de inicio</span><strong>{service.startTime || 'Por definir'}</strong></div><div className="summary-line"><span>Tipo</span><strong>{type?.category || 'Servicio'}</strong></div><div className="summary-line"><span>Canciones</span><strong>{(service.order||[]).flatMap(s=>s.items||[]).length}</strong></div><div className="summary-line"><span>Duración</span><strong>{durationText}</strong></div><div className="aside-progress"><div><span>Planificación</span><strong>{(service.order||[]).flatMap(s=>s.items||[]).length ? 'En progreso' : 'Por comenzar'}</strong></div><div className="progress-track"><i style={{width:(service.order||[]).flatMap(s=>s.items||[]).length?'68%':'12%'}}/></div></div></div><div className="panel note-panel"><div className="aside-title"><h3>Notas del servicio</h3><FileText size={16}/></div><textarea value={notesDraft} onChange={e=>setNotesDraft(e.target.value)} placeholder="Indicaciones para el equipo, anuncios o detalles importantes…"/><div className="note-save-row"><span>{notesDraft === (service.notes || '') ? 'Sin cambios pendientes' : 'Cambios sin guardar'}</span><Btn size="small" variant="primary" disabled={notesDraft === (service.notes || '')} onClick={() => saveServiceText('notes', notesDraft)}><Save size={13}/>Guardar nota</Btn></div></div></aside></div>}
    {tab==='teams' && <div className="detail-content"><div className="team-plan-head"><div><h2>Equipo asignado</h2><p>Distribuye las responsabilidades de este servicio por instrumento o función.</p></div><div className="heading-actions"><Btn onClick={()=>setModal({kind:'invite-team',value:service})}><Users size={16}/>Convocar por lote</Btn>{isAdmin && <Btn variant="primary" onClick={()=>setModal({kind:'person',value:null})}><Plus size={16}/>Nuevo integrante</Btn>}</div></div><div className="assigned-team-grid">{groups.map((g,idx)=>{const instrument = g.name; const selectedIds = service.teamAssignments?.[instrument] ?? g.memberIds ?? []; const selectedPeople = people.filter(p=>selectedIds.includes(p.id));const eligible = people.filter(p=>(p.instruments||[]).some(i=>(g.instruments||[g.name]).includes(i)) || (g.name==='Coros'&&p.teams?.includes('Voces')) || (g.name==='Ministro'&&p.teams?.includes('Voces')) || (g.name==='FOH'&&p.teams?.includes('Audio')));return <div className="assigned-team-card" key={`${g.name}-${idx}`}><div className="assigned-team-head"><div className={`instrument-icon tint-${idx%5}`}>{instrumentIcon(g.name)}</div><div><h3>{g.name}</h3><small>{g.teamName || 'Equipo'}</small></div></div><div className="assigned-members">{selectedPeople.length ? selectedPeople.map(p=><div className="assigned-member" key={p.id}><span className="avatar">{initials(`${p.firstName} ${p.lastName}`)}</span><span><strong>{p.firstName} {p.lastName}</strong><small>{p.role}</small></span><button className="remove-assignee" onClick={()=>toggleMember(instrument,p.id)}><X size={14}/></button></div>) : <div className="member-empty">Aún no hay integrantes asignados</div>}</div><div className="assign-picker"><label htmlFor={`assign-${idx}`}>Agregar integrante</label><select id={`assign-${idx}`} value="" onChange={e=>e.target.value&&toggleMember(instrument,e.target.value)}><option value="">Seleccionar persona…</option>{eligible.filter(p=>!selectedIds.includes(p.id)).map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}{!eligible.filter(p=>!selectedIds.includes(p.id)).length&&people.filter(p=>!selectedIds.includes(p.id)).map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></div></div>})}</div><div className="panel invitations-panel"><div className="invitations-head"><div><h3>Convocatoria y respuestas</h3><p>Los integrantes responden desde su agenda. Si declinan, deben explicar el motivo.</p></div><span className="count-pill">{(service.invitedPersonIds||[]).length} convocados</span></div>{(service.invitedPersonIds||[]).length ? <div className="invitee-list">{(service.invitedPersonIds||[]).map(id=>{const person=people.find(p=>p.id===id);if(!person)return null;const response=serviceResponses.find(r=>r.serviceId===service.id&&r.personId===id)||{status:'pending'};const text=`Hola ${person.firstName}, estás convocado/a a ${service.title} el ${dateWritten(service.date)}. Entra a ${window.location.origin} para confirmar o declinar tu asistencia en PlanningBand.`;const phone=(person.phone||'').replace(/[^0-9]/g,'');return <div className="invitee-row" key={id}><div className="invitee-person"><span className="avatar">{initials(`${person.firstName} ${person.lastName}`)}</span><span><strong>{person.firstName} {person.lastName}</strong><small>{Object.entries(service.teamAssignments||{}).filter(([,ids])=>(ids||[]).includes(id)).map(([position])=>position).join(', ')||'Sin posición'}</small>{response.status==='declined'&&<small className="decline-reason">Motivo: {response.reason||'No indicado'}</small>}</span></div><span className={`response-pill ${response.status||'pending'}`}>{response.status==='accepted'?'Aceptó':response.status==='declined'?'Declinó':'Pendiente'}</span><div className="invitee-actions">{response.status==='declined'&&<button className="btn small" onClick={()=>setModal({kind:'invite-team',value:service})} title="Agregar reemplazo">Buscar reemplazo</button>}{phone && <a className="icon-btn bordered" title="Preparar mensaje de WhatsApp" href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageSquare size={16}/></a>}{person.email && <a className="icon-btn bordered" title="Preparar correo" href={`mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(`Convocatoria: ${service.title}`)}&body=${encodeURIComponent(text)}`}><Mail size={16}/></a>}</div></div>})}</div>:<div className="invite-empty">Aún no has convocado integrantes. Usa “Convocar por lote” para seleccionar varias personas y asignarles una posición.</div>}<p className="notification-note"><Bell size={14}/> WhatsApp y correo abren un mensaje preparado; por ahora debes pulsar “Enviar” en cada aplicación. Las respuestas quedan registradas aquí.</p></div><div className="team-hint"><ShieldCheck size={17}/><span>Las asignaciones se guardan en este servicio. Puedes reutilizar los equipos guardados para próximos servicios.</span></div></div>}
    {tab==='rehearse' && <div className="detail-content rehearse-layout"><div className="panel rehearsal-plan"><div className="rehearse-top"><div className="rehearsal-icon"><Headphones size={22}/></div><div><h2>Preparación del ensayo</h2><p>Reúne los detalles que el equipo necesita antes de tocar.</p></div></div><label className="field-label">Notas de ensayo</label><textarea className="rehearsal-textarea" value={rehearsalDraft} onChange={e=>setRehearsalDraft(e.target.value)} placeholder="Ej. Repasar el puente de la canción 2, confirmar entrada de voces…"/><div className="note-save-row"><span>{rehearsalDraft === (service.rehearsalNotes || '') ? 'Sin cambios pendientes' : 'Cambios sin guardar'}</span><Btn size="small" variant="primary" disabled={rehearsalDraft === (service.rehearsalNotes || '')} onClick={() => saveServiceText('rehearsalNotes', rehearsalDraft)}><Save size={13}/>Guardar notas</Btn></div><div className="rehearsal-checklist"><h3>Checklist previo al servicio</h3>{['Confirmar tonalidades con el ministro','Revisar transiciones y finales','Probar monitoreo y microfonía','Compartir orden del servicio al equipo'].map((x,i)=><label key={x}><input type="checkbox"/> <span>{x}</span></label>)}</div></div><div className="panel rehearsal-songs"><SectionTitle title="Repertorio a ensayar" meta={`${(service.order||[]).flatMap(s=>s.items||[]).length} canciones`}/>{(service.order||[]).flatMap(s=>s.items||[]).length?(service.order||[]).flatMap(s=>s.items||[]).map(item=><div className="rehearsal-song-row" key={item.id}><span className="song-mini-icon"><Music2 size={15}/></span><span><strong>{item.title}</strong><small>{item.key} · {item.duration || 'Duración pendiente'}</small></span><button className="icon-btn subtle" onClick={()=>setModal({kind:'song',value:songs.find(s=>s.id===item.songId)||item})}><FileText size={15}/></button></div>):<p className="muted">Agrega canciones a la orden para preparar el ensayo.</p>}</div></div>}
  </>
}
function instrumentIcon(name) { if (/Batería/i.test(name)) return <Drum size={19}/>; if (/Guitarra/i.test(name)||/Bajo/i.test(name)) return <Guitar size={19}/>; if (/Key|Teclado/i.test(name)) return <Piano size={19}/>; if (/Voz|Ministro|Coro/i.test(name)) return <Mic2 size={19}/>; if (/Audio|FOH/i.test(name)) return <Volume2 size={19}/>; return <Music2 size={19}/> }

function SongsPage({ songs, services = [], songsStore, query, setQuery, setModal, flash, readOnly = false }) {
  const [keyFilter, setKeyFilter] = useState('all')
  const [sort, setSort] = useState('title')
  const [selected, setSelected] = useState([])
  const filtered = useMemo(() => songs
    .filter(song => `${song.title} ${song.artist || ''} ${(song.tags || []).join(' ')} ${song.key || ''}`.toLowerCase().includes(query.toLowerCase()) && (keyFilter === 'all' || song.key === keyFilter))
    .sort((a, b) => String(a[sort] || '').localeCompare(String(b[sort] || ''))), [songs, query, keyFilter, sort])
  const exportSongs = list => downloadCsv('repertorio.csv', ['Título', 'Tonalidad', 'BPM', 'Duración', 'Artista', 'Etiquetas'], list.map(song => [song.title, song.key, song.bpm, song.duration, song.artist, (song.tags || []).join(', ')]))
  const lastScheduledService = song => services
    .filter(service => (service.order || []).some(section => (section.items || []).some(item => item.songId === song.id)))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0]
  const deleteSelected = async () => {
    if (!selected.length || !window.confirm(`¿Eliminar ${selected.length} canciones? Esta acción no se puede deshacer.`)) return
    try {
      await Promise.all(selected.map(id => songsStore.remove(id)))
      setSelected([])
      flash('Canciones eliminadas correctamente.')
    } catch (error) {
      console.error(error)
      flash('No se pudieron eliminar todas las canciones. Revisa tu conexión y permisos.')
    }
  }
  return <>
    <PageHeading eyebrow="REPERTORIO" title="Canciones" description="Toda la música de tu iglesia, organizada y lista para cada servicio." actions={!readOnly && <><Btn onClick={() => exportSongs(songs)}><Upload size={15}/>Exportar</Btn><Btn onClick={() => setModal({kind:'song-pdf-import',value:null})}><FileText size={16}/>Importar PDF</Btn><Btn variant="primary" onClick={() => setModal({kind:'song',value:null})}><Plus size={17}/>Agregar canción</Btn></>}/>
    <div className="stat-strip"><div><span>Canciones registradas</span><strong>{songs.length}</strong></div><div><span>Tonalidades distintas</span><strong>{new Set(songs.map(song => song.key).filter(Boolean)).size}</strong></div><div><span>Repertorio con BPM</span><strong>{songs.filter(song => song.bpm).length}</strong></div><div className="stat-note"><span className="stat-mini-icon"><Music2 size={17}/></span><span>Un repertorio ordenado ayuda a preparar cada encuentro.</span></div></div>
    <div className="panel song-library"><div className="library-toolbar"><div className="global-search-wrap"><Search size={17}/><input className="global-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por título, artista o etiqueta…"/></div><div className="filter-buttons"><select value={keyFilter} onChange={event => setKeyFilter(event.target.value)} aria-label="Filtrar por tonalidad"><option value="all">Todas las tonalidades</option>{[...new Set(songs.map(song => song.key).filter(Boolean))].sort().map(key => <option key={key}>{key}</option>)}</select><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Ordenar canciones"><option value="title">Ordenar: título</option><option value="bpm">Ordenar: BPM</option><option value="key">Ordenar: tonalidad</option></select><button className="icon-btn bordered" onClick={() => {setQuery('');setKeyFilter('all');setSort('title');setSelected([])}} title="Restablecer filtros"><RotateCcw size={16}/></button></div></div>
      <div className="table-meta"><span>{filtered.length} canciones</span><div>{!readOnly && <><button className="icon-btn subtle" onClick={() => exportSongs(filtered)} title="Descargar resultados filtrados en CSV"><Upload size={16}/></button><button className="icon-btn subtle" onClick={() => setSelected(selected.length === filtered.length ? [] : filtered.map(song => song.id))} title={selected.length === filtered.length ? 'Quitar selección' : 'Seleccionar resultados'}><CheckCircle2 size={16}/></button></>}</div></div>
      <div className="data-table-wrap"><table className="data-table songs-table"><thead><tr>{!readOnly && <th><input aria-label="Seleccionar todas las canciones" type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={event => setSelected(event.target.checked ? filtered.map(song => song.id) : [])}/></th>}<th>Título</th><th>Archivos</th><th>BPM</th><th>Tonalidad</th><th>Último servicio</th><th/></tr></thead><tbody>{filtered.map(song => {
        const lastService = lastScheduledService(song)
        return <tr key={song.id}>{!readOnly && <td><input aria-label={`Seleccionar ${song.title}`} type="checkbox" checked={selected.includes(song.id)} onChange={event => setSelected(prev => event.target.checked ? [...new Set([...prev, song.id])] : prev.filter(id => id !== song.id))}/></td>}<td><button className="table-title-button" onClick={() => setModal(readOnly ? {kind:'song-reader',value:song} : {kind:'song',value:song})}><span className="song-table-icon"><Music2 size={16}/></span><span><strong>{song.title}</strong><small>{song.artist || 'Sin artista asignado'}</small></span></button></td><td><div className="file-indicators">{(song.lyrics || (song.fileVariants || []).some(file => file.kind === 'letra')) && <span title="Letra disponible"><FileText size={15}/></span>}{(song.chords || (song.fileVariants || []).some(file => file.kind === 'acordes') || (song.variants || []).length > 0) && <span title="Acordes disponibles"><Guitar size={15}/></span>}{(song.audioUrl || song.referenceUrl) && <a href={song.audioUrl || song.referenceUrl} target="_blank" rel="noreferrer" title="Abrir audio o video"><FileAudio size={15}/></a>}{!(song.lyrics || song.chords || (song.fileVariants || []).length || song.audioUrl || song.referenceUrl) && <span className="muted">—</span>}</div></td><td>{song.bpm || '—'}</td><td>{song.key ? <span className="key-pill">{song.key}</span> : '—'}</td><td className="muted">{lastService ? dateWritten(lastService.date) : 'Aún no programada'}</td><td><button className="icon-btn subtle" onClick={() => setModal(readOnly ? {kind:'song-reader',value:song} : {kind:'song',value:song})} title={readOnly ? 'Ver canción' : 'Editar canción'}>{readOnly ? <Eye size={17}/> : <MoreHorizontal size={18}/>}</button></td></tr>
      })}</tbody></table>{filtered.length === 0 && <div className="table-empty"><Music2 size={21}/><strong>No encontramos canciones</strong><span>Prueba otra búsqueda o agrega una canción nueva.</span></div>}</div>
      <div className="table-bottom"><span>Mostrando {filtered.length} de {songs.length} canciones</span></div>
    </div>
    {!readOnly && selected.length > 0 && <div className="bulk-bar"><span>{selected.length} seleccionadas</span><Btn onClick={deleteSelected}><Trash2 size={15}/>Eliminar seleccionadas</Btn><Btn onClick={() => setSelected([])}>Cancelar</Btn></div>}
  </>
}

function PeoplePage({ people, peopleStore, teams, teamsStore, query, setQuery, subtab, setSubtab, setModal, flash }) {
  const filtered=people.filter(p=>`${p.firstName} ${p.lastName} ${p.email} ${p.role} ${(p.instruments||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const [roleFilter,setRoleFilter]=useState('all')
  const visiblePeople=roleFilter==='all'?filtered:filtered.filter(p=>p.role===roleFilter)
  return <><PageHeading eyebrow="COMUNIDAD" title="Personas" description="Conoce a tus integrantes, administra sus roles y mantén los equipos coordinados." actions={<><Btn onClick={()=>setModal({kind:'team',value:null})}><Users size={16}/>Crear equipo</Btn><Btn variant="primary" onClick={()=>setModal({kind:'person',value:null})}><Plus size={17}/>Agregar persona</Btn></>}/><div className="subtabs people-tabs"><button className={subtab==='people'?'active':''} onClick={()=>setSubtab('people')}>Personas <span>{people.length}</span></button><button className={subtab==='teams'?'active':''} onClick={()=>setSubtab('teams')}>Equipos <span>{teams.length}</span></button></div>{subtab==='people'?<><div className="people-summary"><div className="people-summary-num"><strong>{people.length}</strong><span>Integrantes totales</span></div><div className="people-summary-num"><strong>{people.filter(p=>p.status!=='Inactivo').length}</strong><span>Activos</span></div><div className="people-summary-num"><strong>{people.filter(p=>p.role==='Editor'||p.role==='Administrador').length}</strong><span>Editores y administradores</span></div><div className="people-avatars">{people.slice(0,3).map(p=><span className="avatar" key={p.id}>{initials(`${p.firstName} ${p.lastName}`)}</span>)}{people.length>3&&<span className="avatar avatar-more">+{people.length-3}</span>}</div></div><div className="panel people-table-panel"><div className="people-filter-row"><div className="global-search-wrap"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar personas por nombre, correo o instrumento…"/></div><div className="filter-buttons"><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="all">Todos los roles</option>{[...new Set(people.map(p=>p.role).filter(Boolean))].map(r=><option key={r}>{r}</option>)}</select><button className="icon-btn bordered" onClick={()=>{setQuery('');setRoleFilter('all')}}><Filter size={16}/></button></div></div><div className="table-meta"><span>{visiblePeople.length} personas</span><div><button className="icon-btn subtle" onClick={()=>downloadCsv('integrantes.csv',['Nombre','Apellido','Correo','Teléfono','Rol','Estado','Instrumentos','Equipos'],visiblePeople.map(p=>[p.firstName,p.lastName,p.email,p.phone,p.role,p.status,(p.instruments||[]).join(', '),(p.teams||[]).join(', ')]))} title="Descargar directorio CSV"><Upload size={16}/></button><button className="icon-btn subtle" onClick={()=>setModal({kind:'person',value:null})}><Plus size={17}/></button></div></div><div className="data-table-wrap"><table className="data-table people-table"><thead><tr><th>Nombre</th><th>Correo electrónico</th><th>Teléfono</th><th>Permisos / rol</th><th>Equipos</th><th>Estado</th><th/></tr></thead><tbody>{visiblePeople.map(p=><tr key={p.id}><td><button className="person-cell" onClick={()=>setModal({kind:'person',value:p})}><span className="avatar">{initials(`${p.firstName} ${p.lastName}`)}</span><span><strong>{p.firstName} {p.lastName}</strong><small>{(p.instruments||[]).join(', ')||'Sin instrumento'}</small></span></button></td><td>{p.email||'—'}</td><td>{p.phone||'—'}</td><td><span className={`role-pill ${p.role==='Administrador'?'admin':p.role==='Editor'?'leader':''}`}>{p.role||'Músico'}</span></td><td><div className="team-pills">{(p.teams||[]).slice(0,2).map(t=><span key={t}>{t}</span>)}{!(p.teams||[]).length&&<span>—</span>}</div></td><td><span className={`status-pill ${p.status==='Inactivo'?'inactive':''}`}><i/>{p.status||'Activo'}</span></td><td><button className="icon-btn subtle" onClick={()=>setModal({kind:'person',value:p})}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{!visiblePeople.length&&<div className="table-empty"><Users size={20}/><strong>No hay personas para mostrar</strong></div>}</div><div className="table-bottom"><span>Mostrando {visiblePeople.length} de {people.length} integrantes</span></div></div></>:<div className="teams-directory-grid">{teams.map(team=><div key={team.id} className="team-directory-card"><div className="team-card-title"><span className="team-avatar"><Users size={19}/></span><div><h3>{team.name}</h3><small>{(team.groups||[]).length} roles o secciones</small></div><button className="icon-btn subtle" onClick={()=>setModal({kind:'team',value:team})}><Edit3 size={15}/></button></div><div className="team-directory-groups">{(team.groups||[]).map((g,i)=><div key={i}><span>{g.name}</span><span className="avatar-stack">{(g.memberIds||[]).slice(0,3).map(id=>{const p=people.find(x=>x.id===id);return p?<span className="avatar" key={id} title={`${p.firstName} ${p.lastName}`}>{initials(`${p.firstName} ${p.lastName}`)}</span>:null})}<small>{(g.memberIds||[]).length}</small></span></div>)}</div><button className="team-card-footer" onClick={()=>setModal({kind:'team',value:team})}>Administrar equipo <ArrowRight size={14}/></button></div>)}<button className="add-team-card" onClick={()=>setModal({kind:'team',value:null})}><span><Plus size={22}/></span><strong>Crear nuevo equipo</strong><small>Organiza por función, instrumento o área</small></button></div>}</>
}

function TeamsPage({ teams, people, teamsStore, setModal, flash }) {
  return <><PageHeading eyebrow="ORGANIZACIÓN" title="Equipos" description="Agrupa músicos y voluntarios por instrumento, función o área de servicio." actions={<Btn variant="primary" onClick={()=>setModal({kind:'team',value:null})}><Plus size={16}/>Crear equipo</Btn>}/><div className="teams-directory-grid standalone-teams">{teams.map((team,i)=><div className="team-directory-card" key={team.id}><div className="team-card-title"><span className={`team-avatar tint-${i%5}`}><Users size={19}/></span><div><h3>{team.name}</h3><small>{(team.groups||[]).length} secciones · {(team.groups||[]).reduce((n,g)=>n+(g.memberIds||[]).length,0)} asignaciones</small></div><button className="icon-btn subtle" onClick={()=>setModal({kind:'team',value:team})}><MoreHorizontal size={17}/></button></div><div className="team-directory-groups">{(team.groups||[]).map((g,idx)=><div key={idx}><span className="role-with-icon">{instrumentIcon(g.name)}{g.name}</span><span className="avatar-stack">{(g.memberIds||[]).slice(0,3).map(id=>{const p=people.find(x=>x.id===id);return p?<span className="avatar" key={id}>{initials(`${p.firstName} ${p.lastName}`)}</span>:null})}<small>{(g.memberIds||[]).length}</small></span></div>)}</div><button className="team-card-footer" onClick={()=>setModal({kind:'team',value:team})}>Editar miembros y funciones <ArrowRight size={14}/></button></div>)}<button className="add-team-card" onClick={()=>setModal({kind:'team',value:null})}><span><Plus size={22}/></span><strong>Crear nuevo equipo</strong><small>Agrega instrumentos o equipos de servicio</small></button></div><div className="panel team-tip"><div className="tip-icon"><Sparkles size={18}/></div><div><strong>Una lista de equipo siempre actualizada</strong><p>Define quién toca cada instrumento y selecciona esas mismas personas al armar el equipo de cada servicio.</p></div></div></>
}

function MySchedule({ services, people, openService }) {
  const [filter,setFilter]=useState('upcoming')
  const ordered=[...services].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).filter(s=>filter==='all'||s.date>=localTodayISO())
  return <><PageHeading eyebrow="MI ESPACIO" title="Mi agenda" description="Consulta los próximos servicios y prepara tu participación." actions={<Btn onClick={()=>setFilter(filter==='all'?'upcoming':'all')}><Filter size={15}/>{filter==='all'?'Próximos':'Todos'}</Btn>}/><div className="schedule-timeline">{ordered.map(s=><button key={s.id} className="schedule-timeline-row" onClick={()=>openService(s)}><div className="timeline-date"><small>{new Intl.DateTimeFormat('es-CL',{month:'short'}).format(new Date(`${s.date}T12:00:00`)).toUpperCase()}</small><strong>{new Date(`${s.date}T12:00:00`).getDate()}</strong></div><div className="timeline-line"><i/></div><div className="timeline-card"><div><span className="eyebrow">{fmtDate(s.date,{weekday:'long'})} · {s.startTime}</span><h3>{s.title}</h3><p>{(s.order||[]).flatMap(x=>x.items||[]).length} canciones programadas · {(s.teamAssignments?Object.values(s.teamAssignments).flat().length:0)} asignaciones</p></div><span className="timeline-open">Abrir plan <ArrowRight size={15}/></span></div></button>)}{!ordered.length&&<EmptyState icon={CalendarDays} title="No hay servicios en tu agenda" body="Cuando se programen nuevos servicios aparecerán aquí."/>}</div></>
}

function SettingsPage({ user, services, flash }) {
  return <><PageHeading eyebrow="PREFERENCIAS" title="Configuración" description="Administra el espacio de tu iglesia y revisa el estado de la conexión."/><div className="settings-grid"><div className="panel settings-card"><div className="settings-icon"><ShieldCheck size={20}/></div><h2>Conexión y datos</h2><p>La aplicación está conectada a Firebase. Los cambios se sincronizan en la nube con las cuentas autorizadas.</p><div className="settings-status"><span className="status-pill"><i/>Firebase conectado</span><span>{user?.email||'Sesión autorizada'}</span></div><div className="settings-stat-line"><span>Servicios registrados</span><strong>{services.length}</strong></div><div className="settings-next"><strong>Almacenamiento optimizado</strong><p>Las letras, acordes, tonalidades y metadatos se guardan como texto. Los PDF externos se registran mediante enlaces; los PDF generados se preparan bajo demanda.</p></div></div><div className="panel settings-card"><div className="settings-icon lavender"><Users size={20}/></div><h2>Equipo de la iglesia</h2><p>Gestiona integrantes, roles, equipos y asignaciones desde las secciones Personas y Equipos.</p></div><div className="panel settings-card"><div className="settings-icon peach"><LockKeyhole size={20}/></div><h2>Permisos y seguridad</h2><p>Los permisos se aplican tanto en la interfaz como en las reglas de Firestore: Administrador, Editor y Visor tienen accesos distintos.</p></div></div></>
}

function ModalHost({ modal, setModal, onCreateService, onUpdateService, onDeleteService, onSaveInvitations, onAddQuickSong, onSaveSong, onImportSongs, onDeleteSong, onSavePerson, onSaveType, onSaveTeam, onSendInvite, cloud, songs, people, teams, serviceTypes, services, currentRole }) {
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const close=()=>{setModal(null);setError('')}
  const value=modal.value||{}
  const save=async(fn,data)=>{setSaving(true);setError('');try{await fn(data)}catch(e){console.error(e);setError('No se pudieron guardar los cambios. Comprueba tu conexión y los permisos.')}finally{setSaving(false)}}
  const remove=async(fn,id)=>{if(!window.confirm('¿Seguro que deseas eliminar este registro?'))return;try{await fn(id);close()}catch(e){setError('No se pudo eliminar el registro.')}}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className={`modal ${['song','person','team','invite-team','song-reader','song-pdf-import'].includes(modal.kind)?'modal-wide':''}`} role="dialog" aria-modal="true"><div className="modal-header"><div><span className="eyebrow">{modal.kind==='service'?'PLANIFICACIÓN':modal.kind==='song'?'REPERTORIO':modal.kind==='person'?'DIRECTORIO':modal.kind==='team'||modal.kind==='invite-team'?'ORGANIZACIÓN':modal.kind==='type'?'PLANTILLAS':modal.kind==='quick-song'?'CANCIÓN TEMPORAL':modal.kind==='song-reader'?'LECTURA MUSICAL':modal.kind==='song-pdf-import'?'IMPORTACIÓN MUSICAL':'AYUDA'}</span><h2>{modal.kind==='service'?(value.id?'Editar servicio':'Nuevo servicio'):modal.kind==='song'?(value.id?'Editar canción':'Agregar canción'):modal.kind==='person'?(value.id?'Editar integrante':'Agregar integrante'):modal.kind==='type'?(value.id?'Editar tipo de servicio':'Nuevo tipo de servicio'):modal.kind==='team'?(value.id?'Editar equipo':'Crear equipo'):modal.kind==='service-actions'?'Opciones del servicio':modal.kind==='section-edit'?'Editar sección':modal.kind==='invite-team'?'Convocar integrantes':modal.kind==='quick-song'?'Agregar canción manualmente':modal.kind==='song-reader'?'Ver canción':modal.kind==='song-pdf-import'?'Importar canciones desde PDF':'Guía rápida'}</h2></div><button className="icon-btn subtle" onClick={close}><X size={20}/></button></div>
    {modal.kind==='service'&&<ServiceForm value={value} serviceTypes={serviceTypes} saving={saving} error={error} onSubmit={data=>save(value.id?onUpdateService:onCreateService,data)} onClose={close} />}
    {modal.kind==='song-reader'&&<SongReader song={value} onClose={close}/>}
    {modal.kind==='song-pdf-import'&&<SongPdfImportForm existingSongs={songs} saving={saving} error={error} onSubmit={records=>save(onImportSongs,records)} onClose={close}/>}
    {modal.kind==='song'&&<SongForm value={value} saving={saving} error={error} onSubmit={d=>save(onSaveSong,d)} onClose={close} onDelete={value.id&&currentRole==='Administrador'?()=>remove(onDeleteSong,value.id):null}/>}
    {modal.kind==='person'&&<PersonForm value={value} teams={teams} cloud={cloud} saving={saving} error={error} onSubmit={d=>save(onSavePerson,d)} onSendInvite={onSendInvite} onClose={close}/>}
    {modal.kind==='type'&&<TypeForm value={value} saving={saving} error={error} onSubmit={d=>save(onSaveType,d)} onClose={close} />}
    {modal.kind==='team'&&<TeamForm value={value} people={people} saving={saving} error={error} onSubmit={d=>save(onSaveTeam,d)} onClose={close}/>}
    {modal.kind==='invite-team'&&<InviteTeamForm service={value} people={people} teams={teams} saving={saving} error={error} onSubmit={d=>save(onSaveInvitations,d)} onClose={close}/>}
    {modal.kind==='quick-song'&&<QuickSongForm value={value} saving={saving} error={error} onSubmit={d=>save(onAddQuickSong,d)} onClose={close}/>}
    {modal.kind==='service-actions'&&<div className="modal-body action-options"><button onClick={()=>{setModal({kind:'service',value});}}><Edit3 size={17}/><span><strong>Editar datos del servicio</strong><small>Cambiar fecha, hora y tipo.</small></span></button><button onClick={()=>{const copy={...value,id:uid(),title:`${value.title} (copia)`,date:addDaysISO(value.date || localTodayISO(), 7),order:(value.order||[]).map(s=>({...s,id:uid(),items:(s.items||[]).map(i=>({...i,id:uid()}))}))};window.dispatchEvent(new CustomEvent('alabanza:duplicate-service',{detail:copy}));close()}}><Copy size={17}/><span><strong>Duplicar servicio</strong><small>Crear una copia para otra fecha.</small></span></button><button className="danger-option" onClick={()=>{onDeleteService(value.id);close()}}><Trash2 size={17}/><span><strong>Eliminar servicio</strong><small>Esta acción no se puede deshacer.</small></span></button><div className="modal-form-error">Nota: las acciones se procesan desde el detalle del servicio.</div></div>}
    {modal.kind==='section-edit'&&<SectionEditForm value={value.section} onClose={close} onSave={name=>{const svc=value.service;const order=(svc.order||[]).map(s=>s.id===value.section.id?{...s,name:name.toUpperCase()}:s);window.dispatchEvent(new CustomEvent('alabanza:section-update',{detail:{service:{...svc,order}}}));close()}}/>}
    {modal.kind==='help'&&<div className="modal-body help-modal-content"><p>Usa el menú lateral para entrar a cada área. Un flujo recomendado es:</p><ol><li><strong>Registra a los integrantes</strong> y agrúpalos en Banda, Voces y Audio.</li><li><strong>Completa el repertorio</strong> con tonalidades, BPM, letras y acordes.</li><li><strong>Crea un servicio</strong>, agrega secciones y selecciona las canciones.</li><li><strong>Asigna el equipo</strong> a cada función y comparte las notas de ensayo.</li></ol><p className="muted">La información se guarda en Firebase y solo se muestra a las cuentas autorizadas.</p><div className="modal-actions"><Btn variant="primary" onClick={close}>Entendido</Btn></div></div>}
  </div></div>
}

function ServiceForm({ value, serviceTypes, onSubmit, onClose, saving, error }) {
  const [date,setDate]=useState(value.date||localTodayISO())
  const [startTime,setStartTime]=useState(value.startTime||'11:00')
  const [typeId,setTypeId]=useState(value.typeId||serviceTypes[0]?.id||'')
  const chosenType=serviceTypes.find(t=>t.id===typeId)
  const submit=e=>{e.preventDefault();onSubmit({ ...value,title:chosenType?.name||value.title||'Servicio',date,startTime,typeId })}
  return <form className="modal-form" onSubmit={submit}><div className="service-type-preview"><CalendarDays size={19}/><div><small>PLANTILLA SELECCIONADA</small><strong>{chosenType?.name||'Selecciona un tipo de servicio'}</strong><span>El título del servicio se toma de la plantilla. En el calendario se mostrará la fecha escrita.</span></div></div><label>Tipo de servicio<select required value={typeId} onChange={e=>setTypeId(e.target.value)}><option value="">Seleccionar tipo…</option>{serviceTypes.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label><div className="form-two"><label>Fecha del servicio<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Hora de inicio<input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></label></div>{error&&<div className="inline-alert">{error}</div>}<div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving||!typeId}><Save size={15}/>{saving?'Guardando…':'Guardar servicio'}</Btn></div></form>
}
function SongPdfImportForm({ existingSongs = [], onSubmit, onClose, saving, error }) {
  const [records, setRecords] = useState([])
  const [reading, setReading] = useState(false)
  const [status, setStatus] = useState('')
  const [readErrors, setReadErrors] = useState([])
  const update = (id, changes) => setRecords(prev => prev.map(record => record.id === id ? { ...record, ...changes } : record))
  const remove = id => setRecords(prev => prev.filter(record => record.id !== id))
  const chooseFiles = async event => {
    const files = Array.from(event.currentTarget.files || [])
    event.currentTarget.value = ''
    if (!files.length) return
    setReading(true)
    setStatus(`Leyendo ${files.length} PDF${files.length===1?'':'s'} en este dispositivo…`)
    setReadErrors([])
    const imported = []
    const failures = []
    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          failures.push(`${file.name}: el archivo no parece ser un PDF.`)
          continue
        }
        try {
          const parsed = await readSongPdfInBrowser(file)
          imported.push(parsed)
        } catch (err) {
          failures.push(`${file.name}: ${err?.message || 'no pude leer este archivo.'}`)
        }
      }
      setRecords(prev => [...prev, ...imported])
      setReadErrors(failures)
      setStatus(imported.length ? `Detecté ${imported.length} canción(es). Revisa el contenido antes de guardarlas.` : 'No pude extraer canciones de los archivos seleccionados.')
    } catch (err) {
      setStatus('No pude iniciar el lector de PDF. Inténtalo de nuevo o verifica la conexión para descargar el componente lector.')
      console.error(err)
    } finally {
      setReading(false)
    }
  }
  const selectedCount = records.filter(record => record.include && record.title.trim()).length
  const submit = () => {
    const selectedRecords = records.filter(record => record.include && record.title.trim()).map(record => {
      const { importFileName, importWarnings, include, ...song } = record
      return { ...song, title: song.title.trim(), artist: song.artist.trim(), key: song.key || 'C', lyrics: song.lyrics.trim(), chords: song.chords.trim() }
    })
    if (!selectedRecords.length) { setStatus('Marca al menos una canción con título para importarla.'); return }
    onSubmit(selectedRecords)
  }
  return <div className="modal-form pdf-import-form">
    <div className="song-editor-block" style={{ gap: 8 }}>
      <div className="form-section-heading"><div><strong>Importación local</strong><small>Selecciona uno o varios PDF de tu repertorio antiguo. Se analizan en tu navegador; los archivos no se suben ni se guardan en Firebase.</small></div></div>
      <label className="pdf-import-picker" style={{ display:'flex', alignItems:'center', gap:12, padding:14, border:'1px dashed #79c9c4', borderRadius:12, background:'#f1fbfa', cursor:'pointer', flexWrap:'wrap' }}>
        <FileText size={21} color="#128f8b"/>
        <span style={{ flex:'1 1 180px', minWidth:0 }}><strong>{reading?'Leyendo archivos…':'Seleccionar PDF'}</strong><small style={{ display:'block', color:'#607574', marginTop:3 }}>Puedes seleccionar varios archivos a la vez.</small></span>
        <input type="file" accept=".pdf,application/pdf" multiple disabled={reading} onChange={chooseFiles} style={{ maxWidth:'100%', fontSize:13 }}/>
      </label>
      {status && <div className={readErrors.length ? 'inline-alert' : 'setup-note'}>{status}</div>}
      {readErrors.map((message,index)=><div className="inline-alert" key={`${index}-${message}`}>{message}</div>)}
    </div>
    {records.map((record,index)=>{
      const duplicate = existingSongs.find(song => String(song.title||'').trim().toLowerCase() === record.title.trim().toLowerCase())
      return <div key={record.id} className="song-editor-block" style={{ gap:12, marginTop:14, borderColor:record.include?'#b8e3df':'#e0ebea', opacity:record.include?1:.72 }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start', flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, flex:'1 1 180px' }}><input type="checkbox" checked={record.include} onChange={e=>update(record.id,{include:e.target.checked})}/><span><strong>{index+1}. {record.importFileName}</strong><small style={{ display:'block', color:'#6a7c7d', fontWeight:400 }}>Revisa los campos detectados antes de guardar.</small></span></label>
          <button type="button" className="icon-btn subtle" onClick={()=>remove(record.id)} title="Quitar este PDF de la importación"><Trash2 size={16}/></button>
        </div>
        {duplicate && <div className="inline-alert">Ya existe una canción con el título “{duplicate.title}”. Desmarca esta importación si no quieres crear una copia.</div>}
        {(record.importWarnings||[]).map((warning,i)=><div key={i} className="setup-note">{warning}</div>)}
        <div className="form-two">
          <label>Título de la canción<input value={record.title} onChange={e=>update(record.id,{title:e.target.value})} required/></label>
          <label>Artista / ministerio<input value={record.artist} onChange={e=>update(record.id,{artist:e.target.value})} placeholder="Autor o ministerio"/></label>
        </div>
        <div className="form-two">
          <label>Tonalidad detectada<select value={record.key} onChange={e=>update(record.id,{key:e.target.value})}>{[...new Set([...keyOptions, record.key])].map(key=><option key={key}>{key}</option>)}</select></label>
          <label>Duración (opcional)<input value={record.duration} onChange={e=>update(record.id,{duration:e.target.value})} placeholder="4:30"/></label>
        </div>
        <div className="form-two">
          <label>Letra extraída<textarea rows="6" value={record.lyrics} onChange={e=>update(record.id,{lyrics:e.target.value})} placeholder="Letra, con secciones como INTRO y VERSO" style={{ minHeight:130 }}/></label>
          <label>Acordes y letra alineados<textarea rows="8" value={record.chords} onChange={e=>update(record.id,{chords:e.target.value})} placeholder="Acordes sobre la letra, con espacios preservados" style={{ minHeight:170, fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace', whiteSpace:'pre', overflowX:'auto' }}/></label>
        </div>
      </div>
    })}
    <div className="storage-footnote"><ShieldCheck size={15}/><span>Solo se guardarán los campos de la canción en Firestore. El PDF original y sus bytes se descartan al terminar la lectura. Esta versión requiere PDF con texto seleccionable; los PDF escaneados se identifican y se informan para no guardar datos incorrectos.</span></div>
    {error && <div className="inline-alert">{error}</div>}
    <div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="button" disabled={saving||reading||selectedCount===0} onClick={submit}><Save size={15}/>{saving?'Guardando…':`Guardar ${selectedCount} canción(es)`}</Btn></div>
  </div>
}

function SongForm({ value, onSubmit, onClose, onDelete, saving, error }) {
  const [title,setTitle]=useState(value.title||'')
  const [artist,setArtist]=useState(value.artist||'')
  const [key,setKey]=useState(value.key||'C')
  const [bpm,setBpm]=useState(value.bpm||'')
  const [duration,setDuration]=useState(value.duration||'')
  const [lyrics,setLyrics]=useState(value.lyrics||'')
  const [chords,setChords]=useState(value.chords||'')
  const [tags,setTags]=useState((value.tags||[]).join(', '))
  const [referenceUrl,setReferenceUrl]=useState(value.referenceUrl||value.audioUrl||'')
  const [variants,setVariants]=useState(value.variants||[])
  const [fileVariants,setFileVariants]=useState(value.fileVariants||[])
  const [targetKey,setTargetKey]=useState(value.key||'G')
  const [pdfUrl,setPdfUrl]=useState('')
  const [pdfKey,setPdfKey]=useState(value.key||'C')
  const [pdfKind,setPdfKind]=useState('acordes')
  const [pdfLabel,setPdfLabel]=useState('')
  const addPdfLink=()=>{
    if(!/^https?:\/\//i.test(pdfUrl.trim())){alert('Pega un enlace https:// válido del PDF (por ejemplo, Google Drive o OneDrive).');return}
    setFileVariants(prev=>[...prev,{id:uid(),url:pdfUrl.trim(),key:pdfKey,kind:pdfKind,label:pdfLabel.trim()||`PDF ${pdfKind} · ${pdfKey}`}])
    setPdfUrl('');setPdfLabel('')
  }
  const addVariant=()=>{
    if(targetKey===key){alert('Elige una tonalidad diferente a la original.');return}
    setVariants(prev=>[...prev.filter(v=>v.key!==targetKey),{id:uid(),key:targetKey,chords:transposeChordText(chords,key,targetKey),label:`Tonalidad ${targetKey}`}])
  }
  const submit=e=>{
    e.preventDefault()
    onSubmit({...value,title:title.trim(),artist:artist.trim(),key,bpm:bpm?Number(bpm):null,duration,lyrics,chords,tags:tags.split(',').map(x=>x.trim()).filter(Boolean),audioUrl:referenceUrl.trim(),referenceUrl:referenceUrl.trim(),variants,fileVariants})
  }
  return <form className="modal-form song-form" onSubmit={submit}>
    <div className="form-two"><label>Título de la canción<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nombre de la canción"/></label><label>Artista / referencia<input value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Autor o ministerio"/></label></div>
    <div className="form-three"><label>Tonalidad original<select value={key} onChange={e=>setKey(e.target.value)}>{keyOptions.map(k=><option key={k}>{k}</option>)}</select></label><label>BPM<input type="number" min="1" max="300" value={bpm} onChange={e=>setBpm(e.target.value)} placeholder="72"/></label><label>Duración<input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="4:30"/></label></div>
    <label>Etiquetas<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Alabanza, Adoración (separadas por coma)"/></label>
    <label>Enlace a YouTube, YouTube Music, Spotify u otra app<input type="url" value={referenceUrl} onChange={e=>setReferenceUrl(e.target.value)} placeholder="https://…"/><small className="field-hint">Se guarda solo el enlace, no el audio.</small></label>
    <div className="song-editor-block"><div className="form-section-heading"><strong>Letra</strong><button type="button" className="text-link" onClick={()=>openPrintDocument(`${title||'Canción'} — Letra`,lyrics,`Tonalidad original: ${key}`)}><FileText size={15}/> Generar PDF de letra</button></div><textarea rows="7" value={lyrics} onChange={e=>setLyrics(e.target.value)} placeholder="Pega la letra aquí…"/></div>
    <div className="song-editor-block"><div className="form-section-heading"><strong>Acordes originales</strong><button type="button" className="text-link" onClick={()=>openPrintDocument(`${title||'Canción'} — Acordes ${key}`,chords,`Tonalidad: ${key}`,true)}><FileText size={15}/> Generar PDF de acordes</button></div><textarea rows="4" value={chords} onChange={e=>setChords(e.target.value)} placeholder="Pega los acordes aquí. Ej. G · D · Em · C"/></div>
    <div className="song-editor-block variant-editor"><div className="form-section-heading"><div><strong>Tonalidades alternativas</strong><small>Genera una versión transpuesta. Revisa los acordes antes de guardar.</small></div></div><div className="inline-add-row"><select value={targetKey} onChange={e=>setTargetKey(e.target.value)}>{keyOptions.map(k=><option key={k}>{k}</option>)}</select><Btn type="button" onClick={addVariant}><Sparkles size={15}/>Generar alternativa</Btn></div>{variants.map(variant=><div className="variant-edit-card" key={variant.id||variant.key}><div className="variant-card-head"><strong>Tono {variant.key}</strong><button type="button" className="icon-btn subtle" onClick={()=>setVariants(prev=>prev.filter(v=>v.key!==variant.key))} aria-label="Eliminar tonalidad"><Trash2 size={15}/></button></div><textarea rows="3" aria-label={`Acordes en ${variant.key}`} value={variant.chords||''} onChange={e=>setVariants(prev=>prev.map(v=>v.key===variant.key?{...v,chords:e.target.value}:v))}/><button type="button" className="text-link" onClick={()=>openPrintDocument(`${title||'Canción'} — Acordes ${variant.key}`,variant.chords,`Versión alternativa · tonalidad ${variant.key}`,true)}><FileText size={14}/> Generar PDF de esta versión</button></div>)}{!variants.length&&<p className="muted">Todavía no hay tonos alternativos guardados.</p>}</div>
    <div className="song-editor-block"><div className="form-section-heading"><div><strong>PDF ya existentes</strong><small>Guarda el enlace y la tonalidad de cada archivo. No consume espacio de Firebase Storage.</small></div></div><div className="form-two"><label>Tipo de PDF<select value={pdfKind} onChange={e=>setPdfKind(e.target.value)}><option value="letra">Solo letra</option><option value="acordes">Letra con acordes / partitura</option></select></label><label>Tonalidad que aparece en el PDF<select value={pdfKey} onChange={e=>setPdfKey(e.target.value)}>{keyOptions.map(k=><option key={k}>{k}</option>)}</select></label></div><label>Nombre descriptivo del archivo (opcional)<input value={pdfLabel} onChange={e=>setPdfLabel(e.target.value)} placeholder="Ej. Acordes en Sol para teclado"/></label><label>Enlace compartido del PDF<input type="url" value={pdfUrl} onChange={e=>setPdfUrl(e.target.value)} placeholder="https://drive.google.com/..."/></label><div><Btn type="button" onClick={addPdfLink}><Plus size={15}/>Añadir PDF a esta tonalidad</Btn></div>{fileVariants.length>0&&<div className="linked-pdf-list">{fileVariants.map(file=><div className="linked-pdf-row" key={file.id||file.url}><FileText size={16}/><div><strong>{file.label||`PDF ${file.kind} · ${file.key}`}</strong><small>{file.kind==='letra'?'Solo letra':'Acordes / partitura'} · Tonalidad {file.key}</small></div><a href={file.url} target="_blank" rel="noreferrer">Ver</a><button type="button" className="icon-btn subtle" onClick={()=>setFileVariants(prev=>prev.filter(f=>f!==file))} aria-label="Quitar enlace"><X size={15}/></button></div>)}</div>}</div>
    {error&&<div className="inline-alert">{error}</div>}
    <div className="storage-footnote"><ShieldCheck size={15}/><span>La letra, acordes y tonalidades ocupan poco espacio. Los archivos PDF externos se guardan como enlaces; los PDF generados se crean al abrirlos y no se almacenan en Firebase.</span></div>
    <div className="modal-actions modal-actions-split">{onDelete&&<button className="danger-text" type="button" onClick={onDelete}><Trash2 size={15}/>Eliminar canción</button>}<span/><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving}><Save size={15}/>{saving?'Guardando…':'Guardar canción'}</Btn></div>
  </form>
}

function PersonForm({ value, teams, cloud, onSubmit, onSendInvite, onClose, saving, error }) {
  const [inviteBusy,setInviteBusy]=useState(false);const [inviteMessage,setInviteMessage]=useState('')
  const [firstName,setFirstName]=useState(value.firstName||'');const [lastName,setLastName]=useState(value.lastName||'');const [email,setEmail]=useState(value.email||'');const [phone,setPhone]=useState(value.phone||'');const [role,setRole]=useState(roleName(value.role||'Visor'));const [status,setStatus]=useState(value.status||'Activo');const [instruments,setInstruments]=useState(value.instruments||[]);const [selectedTeams,setSelectedTeams]=useState(value.teams||[])
  const instrumentOptions=['Bajo','Batería','Guitarra acústica','Guitarra eléctrica','Teclado','Voz','Audio','Proyección','Dirección']
  const toggle=(list,set,item)=>set(list.includes(item)?list.filter(x=>x!==item):[...list,item])
  const submit=e=>{e.preventDefault();onSubmit({...value,previousEmail:value.email||'',firstName:firstName.trim(),lastName:lastName.trim(),email:email.trim().toLowerCase(),phone:phone.trim(),role,status,instruments,teams:selectedTeams})}
  const sendInvite=async()=>{setInviteBusy(true);setInviteMessage('');try{await onSendInvite(email.trim().toLowerCase());setInviteMessage(`Enviamos a ${email.trim()} un enlace seguro para crear o restablecer su contraseña.`)}catch(e){console.error(e);setInviteMessage(e.code==='auth/invalid-email'?'El correo no tiene un formato válido.':e.code==='auth/operation-not-allowed'?'Activa Email/Password en Firebase Authentication.':e.code==='auth/too-many-requests'?'Firebase limitó temporalmente los envíos. Inténtalo más tarde.':e.message||'No se pudo enviar el enlace. Revisa Firebase Authentication y el dominio autorizado.')}finally{setInviteBusy(false)}}
  return <form className="modal-form" onSubmit={submit}><div className="form-two"><label>Nombre<input required value={firstName} onChange={e=>setFirstName(e.target.value)}/></label><label>Apellido<input required value={lastName} onChange={e=>setLastName(e.target.value)}/></label></div><div className="form-two"><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@correo.cl" required/></label><label>Teléfono<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+56 9 …"/></label></div><div className="form-two"><label>Permisos de acceso<select value={role} onChange={e=>setRole(e.target.value)}>{['Administrador','Editor','Visor'].map(r=><option key={r}>{r}</option>)}</select><small className="permission-description">{role==='Administrador'?'Acceso completo: servicios, canciones, personas, permisos y configuración.':role==='Editor'?'Puede preparar servicios, equipos y repertorio; no puede administrar permisos.':'Solo ve sus convocatorias, fecha, posición y canciones asignadas.'}</small></label><label>Estado<select value={status} onChange={e=>setStatus(e.target.value)}><option>Activo</option><option>Inactivo</option></select></label></div><fieldset className="choice-field"><legend>Instrumentos y funciones</legend><div className="choice-grid">{instrumentOptions.map(item=><label key={item} className={instruments.includes(item)?'checked':''}><input type="checkbox" checked={instruments.includes(item)} onChange={()=>toggle(instruments,setInstruments,item)}/>{item}</label>)}</div></fieldset><fieldset className="choice-field"><legend>Equipos</legend><div className="choice-grid">{[...new Set([...teams.map(t=>t.name),'Banda','Voces','Audio'])].map(item=><label key={item} className={selectedTeams.includes(item)?'checked':''}><input type="checkbox" checked={selectedTeams.includes(item)} onChange={()=>toggle(selectedTeams,setSelectedTeams,item)}/>{item}</label>)}</div></fieldset>{value.id&&email.trim()&&<div className="invite-email-box"><div><strong>Acceso de la persona</strong><p>{cloud?'Envía desde Firebase un enlace seguro para definir su contraseña. No necesitas compartir una contraseña temporal.':'Conecta Firebase para enviar el enlace de acceso desde la aplicación.'}</p>{inviteMessage&&<small className="invite-feedback">{inviteMessage}</small>}</div><Btn type="button" disabled={!cloud||inviteBusy} onClick={sendInvite}><Mail size={15}/>{inviteBusy?'Enviando…':'Enviar enlace de acceso'}</Btn></div>}{error&&<div className="inline-alert">{error}</div>}<div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving}><Save size={15}/>{saving?'Guardando…':'Guardar integrante'}</Btn></div></form>
}
function TypeForm({ value, onSubmit, onClose, saving, error }) {
  const [name,setName]=useState(value.name||'');const [category,setCategory]=useState(value.category||'Servicio');const [color,setColor]=useState(value.color||'green')
  return <form className="modal-form" onSubmit={e=>{e.preventDefault();onSubmit({...value,name:name.trim(),category,color})}}><label>Nombre de la plantilla<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Servicio Domingo 11AM"/></label><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>{['Servicio','Reunión','Oración','Ensayo','Especial','Capacitación'].map(c=><option key={c}>{c}</option>)}</select></label><label>Color identificador<div className="color-options">{[['green','Verde'],['blue','Azul'],['violet','Violeta'],['rose','Rosa'],['amber','Ámbar'],['teal','Turquesa'],['slate','Gris']].map(([v,l])=><button type="button" key={v} className={`color-option ${v} ${color===v?'chosen':''}`} onClick={()=>setColor(v)}><i/>{l}{color===v&&<Check size={13}/>}</button>)}</div></label>{error&&<div className="inline-alert">{error}</div>}<div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving}><Save size={15}/>{saving?'Guardando…':'Guardar plantilla'}</Btn></div></form>
}
function TeamForm({ value, people, onSubmit, onClose, saving, error }) {
  const [name,setName]=useState(value.name||'');const [groups,setGroups]=useState(value.groups||[])
  const addGroup=()=>setGroups(prev=>[...prev,{name:'Nueva función',instruments:[],memberIds:[]}])
  const patchGroup=(idx,changes)=>setGroups(prev=>prev.map((g,i)=>i===idx?{...g,...changes}:g))
  const toggleMember=(idx,id)=>setGroups(prev=>prev.map((g,i)=>i===idx?{...g,memberIds:(g.memberIds||[]).includes(id)?g.memberIds.filter(x=>x!==id):[...(g.memberIds||[]),id]}:g))
  const submit=e=>{e.preventDefault();onSubmit({...value,name:name.trim(),groups})}
  return <form className="modal-form" onSubmit={submit}><label>Nombre del equipo<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Banda"/></label><div className="team-edit-groups"><div className="form-section-heading"><strong>Funciones e instrumentos</strong><button type="button" className="text-link" onClick={addGroup}><Plus size={14}/>Agregar función</button></div>{groups.map((g,i)=><div className="team-edit-group" key={i}><div className="team-edit-group-top"><input aria-label="Nombre de función" value={g.name} onChange={e=>patchGroup(i,{name:e.target.value})}/><button type="button" className="icon-btn subtle" onClick={()=>setGroups(prev=>prev.filter((_,j)=>j!==i))}><Trash2 size={15}/></button></div><input aria-label="Instrumentos separados por coma" value={(g.instruments||[]).join(', ')} onChange={e=>patchGroup(i,{instruments:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder="Instrumentos separados por coma"/><div className="team-member-checks">{people.map(p=><label key={p.id}><input type="checkbox" checked={(g.memberIds||[]).includes(p.id)} onChange={()=>toggleMember(i,p.id)}/>{p.firstName} {p.lastName}</label>)}</div></div>)}{!groups.length&&<p className="muted">Agrega la primera función para este equipo.</p>}</div>{error&&<div className="inline-alert">{error}</div>}<div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving}><Save size={15}/>{saving?'Guardando…':'Guardar equipo'}</Btn></div></form>
}
function InviteTeamForm({ service, people, teams, onSubmit, onClose, saving, error }) {
  const activePeople = people.filter(person => person.status !== 'Inactivo')
  const positions=[...new Set((teams||[]).flatMap(team=>(team.groups||[]).map(group=>group.name)).filter(Boolean))]
  if(!positions.length) positions.push('Voz','Bajo','Batería','Guitarra acústica','Guitarra eléctrica','Teclado','Audio')
  const initial=activePeople.map(person=>{
    const currentPosition=Object.entries(service.teamAssignments||{}).find(([,ids])=>(ids||[]).includes(person.id))?.[0]
    const instrumentMatch=(person.instruments||[]).map(instrument=>positions.find(position=>position.toLowerCase().includes(instrument.toLowerCase())||instrument.toLowerCase().includes(position.toLowerCase()))).find(Boolean)
    return {personId:person.id,checked:(service.invitedPersonIds||[]).includes(person.id)||(service.teamAssignments && Object.values(service.teamAssignments).some(ids=>(ids||[]).includes(person.id))),position:currentPosition||instrumentMatch||positions[0]}
  })
  const [rows,setRows]=useState(initial)
  const patchRow=(id,changes)=>setRows(prev=>prev.map(row=>row.personId===id?{...row,...changes}:row))
  const selected=rows.filter(row=>row.checked).length
  return <form className="modal-form invite-form" onSubmit={e=>{e.preventDefault();onSubmit({serviceId:service.id,invitees:rows})}}>
    <div className="invite-service-summary"><CalendarDays size={19}/><div><strong>{service.title}</strong><span>{dateWritten(service.date)}</span></div></div>
    <p className="muted">Selecciona varios integrantes de una vez y asigna a cada uno su posición en este servicio. Después podrás prepararles el aviso por WhatsApp o correo.</p>
    <div className="invite-select-all"><label><input type="checkbox" checked={rows.length>0&&selected===rows.length} onChange={e=>setRows(prev=>prev.map(row=>({...row,checked:e.target.checked})))}/> Seleccionar todos los integrantes</label><strong>{selected} seleccionados</strong></div>
    <div className="invite-batch-list">{activePeople.map(person=>{const row=rows.find(r=>r.personId===person.id);return <div className={`invite-batch-row ${row?.checked?'selected':''}`} key={person.id}><label className="invite-batch-person"><input type="checkbox" checked={Boolean(row?.checked)} onChange={e=>patchRow(person.id,{checked:e.target.checked})}/><span className="avatar">{initials(`${person.firstName} ${person.lastName}`)}</span><span><strong>{person.firstName} {person.lastName}</strong><small>{(person.instruments||[]).join(', ')||person.email||'Integrante'}</small></span></label><select aria-label={`Posición de ${person.firstName}`} value={row?.position||positions[0]} onChange={e=>patchRow(person.id,{position:e.target.value})}>{positions.map(position=><option key={position}>{position}</option>)}</select></div>})}</div>
    {error&&<div className="inline-alert">{error}</div>}
    <div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving||selected===0}><Users size={15}/>{saving?'Guardando…':`Guardar ${selected} convocado(s)`}</Btn></div>
  </form>
}

function QuickSongForm({ value, onSubmit, onClose, saving, error }) {
  const [title,setTitle]=useState(value.title||'')
  const [description,setDescription]=useState('')
  const [key,setKey]=useState('C')
  const [duration,setDuration]=useState('0:00')
  return <form className="modal-form" onSubmit={e=>{e.preventDefault();onSubmit({...value,title:title.trim(),description:description.trim(),key,duration})}}>
    <div className="inline-alert info">Esta canción será temporal y se añadirá solo a este servicio. Más tarde el administrador podrá registrarla en la biblioteca completa.</div>
    <label>Título de la canción<input required autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Escribe el nombre tal como lo conoces"/></label>
    <label>Descripción o indicaciones<textarea rows="3" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ej. versión acústica, comenzar desde el coro, enlace pendiente…"/></label>
    <div className="form-two"><label>Tonalidad<select value={key} onChange={e=>setKey(e.target.value)}>{keyOptions.map(k=><option key={k}>{k}</option>)}</select></label><label>Duración estimada<input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="0:00"/></label></div>
    {error&&<div className="inline-alert">{error}</div>}
    <div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit" disabled={saving}><Plus size={15}/>Agregar al servicio</Btn></div>
  </form>
}

function SongReader({ song, onClose }) {
  const [selectedKey,setSelectedKey]=useState(song.key||'C')
  const chordVariant=(song.variants||[]).find(v=>v.key===selectedKey)
  const chordText=chordVariant?.chords || transposeChordText(song.chords||'',song.key||'C',selectedKey)
  const pdfs=(song.fileVariants||[]).filter(file=>file.key===selectedKey)
  const originalPdfs=(song.fileVariants||[])
  return <div className="song-reader-body">
    <div className="reader-song-heading"><div className="song-table-icon large"><Music2 size={22}/></div><div><h3>{song.title}</h3><p>{song.artist||'Repertorio de la iglesia'} · Original: {song.key||'Sin tono'}</p></div></div>
    {song.referenceUrl&&<a className="reference-link" href={song.referenceUrl} target="_blank" rel="noreferrer"><Play size={16}/>Abrir referencia de audio/video</a>}
    <label className="reader-key-select">Tonalidad para consultar<select value={selectedKey} onChange={e=>setSelectedKey(e.target.value)}>{[...new Set([...keyOptions, song.key||'C', ...(song.variants||[]).map(v=>v.key), ...originalPdfs.map(v=>v.key)].filter(Boolean))].map(k=><option key={k}>{k}</option>)}</select></label>
    <section className="reader-section"><div className="form-section-heading"><strong>Letra</strong><button className="text-link" onClick={()=>openPrintDocument(`${song.title} — Letra`,song.lyrics,`Tonalidad original: ${song.key||'No indicada'}`)}><FileText size={15}/> Generar PDF de letra</button></div>{song.lyrics?<pre className="reader-content">{song.lyrics}</pre>:<p className="muted">No se ha ingresado la letra como texto. Revisa los PDF enlazados más abajo.</p>}</section>
    <section className="reader-section"><div className="form-section-heading"><strong>Acordes · {selectedKey}</strong><button className="text-link" onClick={()=>openPrintDocument(`${song.title} — Acordes ${selectedKey}`,chordText,`Tonalidad: ${selectedKey}`,true)}><FileText size={15}/> Generar PDF de acordes</button></div>{chordText?<pre className="reader-content chord-content">{chordText}</pre>:<p className="muted">No hay acordes guardados.</p>}</section>
    {!!pdfs.length&&<section className="reader-section"><div className="form-section-heading"><strong>PDF disponibles en {selectedKey}</strong></div>{pdfs.map(file=><a className="reader-pdf-link" key={file.id||file.url} href={file.url} target="_blank" rel="noreferrer"><FileText size={17}/><span><strong>{file.label||`PDF ${file.kind}`}</strong><small>{file.kind==='letra'?'Solo letra':'Acordes / partitura'}</small></span><ArrowRight size={15}/></a>)}</section>}
    {originalPdfs.some(file=>file.key!==selectedKey)&&<section className="reader-section"><strong>Otras tonalidades con PDF original</strong>{originalPdfs.filter(file=>file.key!==selectedKey).map(file=><a className="reader-pdf-link" key={file.id||file.url} href={file.url} target="_blank" rel="noreferrer"><FileText size={16}/><span>{file.label||`PDF ${file.kind} · ${file.key}`}</span><small>{file.key}</small></a>)}</section>}
    <div className="modal-actions"><Btn variant="primary" onClick={onClose}>Listo</Btn></div>
  </div>
}

function ViewerDashboard({ services, person, songs, responses = [], onRespond }) {
  const [declining,setDeclining]=useState(null)
  const [reasons,setReasons]=useState({})
  const ordered=[...services].sort((a,b)=>(a.date||'').localeCompare(b.date||''))
  const name=person?`${person.firstName} ${person.lastName}`:'Integrante'
  const submitDecline=async service=>{
    const reason=(reasons[service.id]||'').trim()
    if(!reason){alert('Escribe el motivo antes de declinar la convocatoria.');return}
    await onRespond(service.id,person.id,'declined',reason)
    setDeclining(null)
  }
  return <>
    <div className="context-strip"><span className="context-dot"/> MI ESPACIO <span className="context-sep">/</span> CONVOCATORIAS</div>
    <PageHeading eyebrow="MI AGENDA" title={`Hola, ${person?.firstName||'bienvenido'}`} description="Aquí aparecen solo los servicios a los que te han convocado, tu posición y las canciones para preparar."/>
    <div className="viewer-pending-alert"><Bell size={18}/><div><strong>{ordered.filter(s=>(responses.find(r=>r.serviceId===s.id&&r.personId===person?.id)?.status||'pending')==='pending').length ? `Tienes ${ordered.filter(s=>(responses.find(r=>r.serviceId===s.id&&r.personId===person?.id)?.status||'pending')==='pending').length} convocatoria(s) pendiente(s)` : 'Tu agenda está al día'}</strong><span>Responde a cada convocatoria para que el administrador pueda organizar los reemplazos a tiempo.</span></div></div><div className="viewer-summary-grid"><div><span>Servicios asignados</span><strong>{ordered.length}</strong></div><div><span>Por responder</span><strong>{ordered.filter(s=>((responses.find(r=>r.serviceId===s.id&&r.personId===person?.id)?.status)||'pending')==='pending').length}</strong></div><div><span>Declinaciones</span><strong>{ordered.filter(s=>responses.find(r=>r.serviceId===s.id&&r.personId===person?.id)?.status==='declined').length}</strong></div></div>
    {ordered.length? <div className="viewer-service-list">{ordered.map(service=>{
      const response=responses.find(r=>r.serviceId===service.id&&r.personId===person?.id)||{status:'pending',reason:''}
      const positions=Object.entries(service.teamAssignments||{}).filter(([,ids])=>(ids||[]).includes(person?.id)).map(([position])=>position)
      const assignedSongs=(service.order||[]).flatMap(section=>section.items||[])
      return <article className="viewer-service-card" key={service.id}>
        <div className="viewer-service-head"><div className="viewer-date-icon"><CalendarDays size={19}/></div><div className="viewer-service-main"><div className="eyebrow">CONVOCATORIA</div><h2>{service.title}</h2><p>{dateWritten(service.date)}{service.startTime?` · ${service.startTime}`:''}</p></div><span className={`response-pill ${response.status}`}>{response.status==='accepted'?'Asistencia aceptada':response.status==='declined'?'Declinaste':'Pendiente de respuesta'}</span></div>
        <div className="viewer-position"><span>Tu posición</span><strong>{positions.length?positions.join(' · '):'Por confirmar con el líder'}</strong></div>
        <div className="viewer-songs"><div className="form-section-heading"><strong>Canciones para preparar</strong><span>{assignedSongs.length} canciones</span></div>{assignedSongs.length?assignedSongs.map((item,index)=>{
          const song=songs.find(s=>s.id===item.songId)
          const chordVariant=song?.variants?.find(v=>v.key===(item.key||song.key))
          const externalPdf=(song?.fileVariants||[]).filter(file=>file.key===(item.key||song.key))
          return <div className="viewer-song-row" key={item.id||`${item.title}-${index}`}><span className="viewer-song-number">{String(index+1).padStart(2,'0')}</span><div><strong>{item.title}</strong><small>{item.key||song?.key||'Tono pendiente'}{item.duration?` · ${item.duration}`:''}</small>{item.description&&<p>{item.description}</p>}</div><div className="viewer-song-actions">{song?.lyrics&&<button className="icon-btn bordered" title="Ver o generar PDF de letra" onClick={()=>openPrintDocument(`${song.title} — Letra`,song.lyrics,`Servicio: ${service.title}`)}><FileText size={16}/></button>}{(song?.chords||chordVariant)&&<button className="icon-btn bordered" title="Ver o generar PDF de acordes" onClick={()=>openPrintDocument(`${song.title} — Acordes ${item.key||song.key}`,chordVariant?.chords||transposeChordText(song.chords,song.key,item.key||song.key),`Servicio: ${service.title}`,true)}><Music2 size={16}/></button>}{externalPdf.map(file=><a className="icon-btn bordered" title={file.label||'Abrir PDF'} href={file.url} target="_blank" rel="noreferrer" key={file.id||file.url}><FileText size={16}/></a>)}{song?.referenceUrl&&<a className="icon-btn bordered" title="Abrir audio o video" href={song.referenceUrl} target="_blank" rel="noreferrer"><Play size={16}/></a>}</div></div>
        }):<div className="viewer-no-songs">Todavía no se han agregado canciones a este servicio.</div>}</div>
        {response.status==='declined'&&<div className="decline-saved"><strong>Motivo informado</strong><p>{response.reason}</p></div>}
        {response.status==='pending'&&<div className="viewer-response-actions"><button className="btn primary" onClick={()=>onRespond(service.id,person?.id,'accepted','')}><CheckCircle2 size={16}/>Aceptar convocatoria</button><button className="btn" onClick={()=>setDeclining(declining===service.id?null:service.id)}><X size={16}/>Declinar</button></div>}
        {declining===service.id&&<div className="decline-form"><label>Motivo para declinar (obligatorio)<textarea rows="3" value={reasons[service.id]||''} onChange={e=>setReasons(prev=>({...prev,[service.id]:e.target.value}))} placeholder="Cuéntanos por qué no podrás asistir…"/></label><div className="decline-form-actions"><button className="btn" onClick={()=>setDeclining(null)}>Cancelar</button><button className="btn primary" disabled={!(reasons[service.id]||'').trim()} onClick={()=>submitDecline(service)}>Enviar motivo y declinar</button></div></div>}
        <div className="viewer-service-footer"><Bell size={15}/> Tu respuesta se verá en el panel del administrador para que pueda coordinar un reemplazo si hace falta.</div>
      </article>
    })}</div> : <div className="panel viewer-empty"><CalendarDays size={26}/><h2>Aún no tienes convocatorias</h2><p>Cuando el administrador te asigne a un servicio, verás aquí la fecha, tu posición, las canciones y la opción de confirmar o declinar.</p></div>}
  </>
}

function SectionEditForm({ value, onClose, onSave }) { const [name,setName]=useState(value.name||'');return <form className="modal-form" onSubmit={e=>{e.preventDefault();onSave(name)}}><label>Nombre de la sección<input required value={name} onChange={e=>setName(e.target.value)}/></label><div className="modal-actions"><Btn type="button" onClick={onClose}>Cancelar</Btn><Btn variant="primary" type="submit"><Save size={15}/>Guardar sección</Btn></div></form> }

// Bridge actions from modal menus back to the app state.
function AppEventsBridge({ onNavigate, onDuplicate, onDeleteService, onSectionUpdate }) {
  useEffect(()=>{
    const nav=e=>onNavigate(e.detail), dup=e=>onDuplicate(e.detail), del=e=>onDeleteService(e.detail), sec=e=>onSectionUpdate(e.detail)
    window.addEventListener('alabanza:navigate',nav);window.addEventListener('alabanza:duplicate-service',dup);window.addEventListener('alabanza:delete-service',del);window.addEventListener('alabanza:section-update',sec)
    return()=>{window.removeEventListener('alabanza:navigate',nav);window.removeEventListener('alabanza:duplicate-service',dup);window.removeEventListener('alabanza:delete-service',del);window.removeEventListener('alabanza:section-update',sec)}
  },[onNavigate,onDuplicate,onDeleteService,onSectionUpdate])
  return null
}

createRoot(document.getElementById('root')).render(<AppRoot />)
