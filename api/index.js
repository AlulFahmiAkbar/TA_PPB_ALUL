import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
// Juga fallback ke root .env jika ada
dotenv.config({ path: path.resolve(__dirname, '../.env') })
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.SUPABASE_URL || ''
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const db = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)
const app = express()
app.use(cors(), express.json({ limit: '15mb' }), express.urlencoded({ extended: true, limit: '15mb' }))
const r = express.Router()

// ---------- helpers ----------
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data })
const fail = (res, code, message) => res.status(code).json({ success: false, message })
const h = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error('[API Error]:', e)
  return fail(res, 500, e.message || 'Internal Server Error')
})
const q = async (p) => { const { data, error } = await p; if (error) throw error; return data }
const JWT_SECRET = process.env.JWT_SECRET || 'kostara_jwt_secret_rahasia_12345'
const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name, email: u.email }, JWT_SECRET, { expiresIn: '7d' })
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').slice(7), JWT_SECRET); next() }
  catch { fail(res, 401, 'Silakan login terlebih dahulu') }
}
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : fail(res, 403, 'Hanya admin'))

const KOS = '*, rooms(*), kos_facilities(facilities(id,name))'
const shape = (k) => {
  const rooms = k.rooms || []
  const prices = rooms.map((x) => Number(x.price))
  return { ...k, kos_facilities: undefined,
    facilities: (k.kos_facilities || []).map((f) => f.facilities.name),
    min_price: prices.length ? Math.min(...prices) : 0,
    available_rooms: rooms.filter((x) => x.availability).length }
}

// ---------- AUTH ----------
r.post('/auth/register', h(async (req, res) => {
  const { name, email, password, phone } = req.body
  if (!name || !email || !password || password.length < 6) return fail(res, 400, 'Nama, email, dan password (min. 6 karakter) wajib diisi')
  const exist = await q(db.from('users').select('id').eq('email', email))
  if (exist.length) return fail(res, 409, 'Email sudah terdaftar')
  const [u] = await q(db.from('users').insert({ name, email, phone, password: await bcrypt.hash(password, 10) }).select())
  ok(res, { token: sign(u), user: { id: u.id, name, email, phone, role: u.role } }, 201)
}))
r.post('/auth/login', h(async (req, res) => {
  const [u] = await q(db.from('users').select('*').eq('email', req.body.email || ''))
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return fail(res, 401, 'Email atau password salah')
  ok(res, { token: sign(u), user: { id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, phone: u.phone } })
}))
r.get('/auth/me', auth, h(async (req, res) => {
  try {
    const [u] = await q(db.from('users').select('id,name,email,phone,role,avatar,created_at').eq('id', req.user.id))
    ok(res, u)
  } catch {
    const [u] = await q(db.from('users').select('id,name,email,phone,role,created_at').eq('id', req.user.id))
    ok(res, u)
  }
}))
r.put('/auth/profile', auth, h(async (req, res) => {
  const { name, phone, avatar } = req.body
  try {
    const [u] = await q(db.from('users').update({ name, phone, avatar }).eq('id', req.user.id).select('id,name,email,phone,role,avatar'))
    ok(res, u)
  } catch {
    const [u] = await q(db.from('users').update({ name, phone }).eq('id', req.user.id).select('id,name,email,phone,role'))
    ok(res, { ...u, avatar })
  }
}))

// ---------- KOS: list + search + filter ----------
const listKos = h(async (req, res) => {
  const { q: kw, type, max, facility, page, limit } = req.query
  let list = (await q(db.from('kos').select(KOS).order('created_at', { ascending: false }))).map(shape)
  if (kw) list = list.filter((k) => [k.name, k.area, k.address].join(' ').toLowerCase().includes(kw.toLowerCase()))
  if (type) list = list.filter((k) => k.kos_type === type)
  if (max) list = list.filter((k) => k.min_price <= Number(max))
  if (facility) list = list.filter((k) => facility.split(',').every((f) => k.facilities.includes(f)))
  
  if (page && limit) {
    const p = Math.max(1, parseInt(page, 10))
    const l = Math.max(1, parseInt(limit, 10))
    const offset = (p - 1) * l
    res.setHeader('X-Total-Count', list.length)
    list = list.slice(offset, offset + l)
  }
  ok(res, list)
})
r.get('/kos', listKos)
r.get('/kos/search', listKos)

// ---------- Rekomendasi (rule-based: 40/30/20/10) ----------
const recommend = async (pref) => {
  const { budget, area, kos_type, facilities = [] } = pref
  const list = (await q(db.from('kos').select(KOS))).map(shape)
  return list.filter((k) => !kos_type || k.kos_type === kos_type).map((k) => {
    const harga = !budget ? 100 : k.min_price <= budget ? 100 : Math.max(0, 100 - ((k.min_price - budget) / budget) * 100)
    const lokasi = !area ? 100 : [k.area, k.address].join(' ').toLowerCase().includes(area.toLowerCase()) ? 100 : 0
    const fas = facilities.length ? (facilities.filter((f) => k.facilities.includes(f)).length / facilities.length) * 100 : 100
    const ada = k.available_rooms > 0 ? 100 : 0
    const score = Math.round(harga * 0.4 + lokasi * 0.3 + fas * 0.2 + ada * 0.1)
    return { ...k, score }
  }).sort((a, b) => b.score - a.score)
}
r.post('/recommendations', h(async (req, res) => ok(res, await recommend(req.body))))
r.get('/kos/recommendations', h(async (req, res) =>
  ok(res, await recommend({ budget: Number(req.query.budget) || 0, area: req.query.area, kos_type: req.query.type }))))

r.get('/kos/:id', h(async (req, res) => {
  const [k] = await q(db.from('kos').select(KOS).eq('id', req.params.id))
  k ? ok(res, shape(k)) : fail(res, 404, 'Kos tidak ditemukan')
}))
r.post('/kos', auth, h(async (req, res) => {
  const { name, description, address, area, kos_type, owner_name, owner_phone, image_url, price, room_name, size, facilities = [] } = req.body
  if (!name || !area || !kos_type) return fail(res, 400, 'Nama kos, area, dan tipe kos wajib diisi')

  // Create kos
  const [newKos] = await q(db.from('kos').insert({
    name,
    description: description || 'Kos nyaman dan strategis untuk mahasiswa.',
    address: address || area,
    area,
    kos_type,
    owner_name: owner_name || req.user.name || 'Pemilik Kos',
    owner_phone: owner_phone || '',
    image_url: image_url || 'https://picsum.photos/seed/' + encodeURIComponent(name) + '/600/400'
  }).select())

  // Create room if price provided
  if (price) {
    try {
      await q(db.from('rooms').insert({
        kos_id: newKos.id,
        room_name: room_name || 'Standard Room',
        price: Number(price),
        size: size || '3x3 m',
        availability: true
      }))
    } catch (err) {
      console.warn('Room creation error:', err.message)
    }
  }

  // Link facilities
  if (facilities && facilities.length) {
    try {
      const allFacs = await q(db.from('facilities').select('id, name'))
      for (const facName of facilities) {
        let fac = allFacs.find((f) => f.name.toLowerCase() === facName.toLowerCase())
        if (!fac) {
          const [created] = await q(db.from('facilities').insert({ name: facName }).select())
          fac = created
        }
        if (fac) {
          await q(db.from('kos_facilities').insert({ kos_id: newKos.id, facility_id: fac.id }))
        }
      }
    } catch (err) {
      console.warn('Facility linking error:', err.message)
    }
  }

  ok(res, newKos, 201)
}))
r.put('/kos/:id', auth, h(async (req, res) => ok(res, (await q(db.from('kos').update(req.body).eq('id', req.params.id).select()))[0])))
r.delete('/kos/:id', auth, h(async (req, res) => { await q(db.from('kos').delete().eq('id', req.params.id)); ok(res, null) }))

// ---------- ROOMS ----------
r.get('/kos/:id/rooms', h(async (req, res) => ok(res, await q(db.from('rooms').select('*').eq('kos_id', req.params.id)))))
r.get('/rooms/:id', h(async (req, res) => {
  let [rm] = await q(db.from('rooms').select('*, kos(id,name,address,owner_name,owner_phone)').eq('id', req.params.id))
  if (!rm) {
    const list = await q(db.from('rooms').select('*, kos(id,name,address,owner_name,owner_phone)').eq('kos_id', req.params.id))
    if (list && list.length) {
      rm = list.find((r) => r.availability) || list[0]
    }
  }
  if (!rm) {
    const [k] = await q(db.from('kos').select('id,name,address,owner_name,owner_phone').eq('id', req.params.id))
    if (k) {
      rm = {
        id: k.id,
        kos_id: k.id,
        room_name: 'Standar',
        price: 0,
        size: '3x3 meter',
        availability: true,
        kos: k
      }
    }
  }
  rm ? ok(res, rm) : fail(res, 404, 'Kamar tidak ditemukan')
}))
r.post('/rooms', auth, admin, h(async (req, res) => ok(res, (await q(db.from('rooms').insert(req.body).select()))[0], 201)))
r.put('/rooms/:id', auth, admin, h(async (req, res) => ok(res, (await q(db.from('rooms').update(req.body).eq('id', req.params.id).select()))[0])))
r.delete('/rooms/:id', auth, admin, h(async (req, res) => { await q(db.from('rooms').delete().eq('id', req.params.id)); ok(res, null) }))

// ---------- FACILITIES ----------
r.get('/facilities', h(async (req, res) => ok(res, await q(db.from('facilities').select('*')))))
r.post('/facilities', auth, admin, h(async (req, res) => ok(res, (await q(db.from('facilities').insert(req.body).select()))[0], 201)))

// ---------- FAVORITES ----------
r.get('/favorites', auth, h(async (req, res) => {
  const rows = await q(db.from('favorites').select(`kos(${KOS})`).eq('user_id', req.user.id))
  ok(res, rows.filter((f) => f.kos).map((f) => shape(f.kos)))
}))
r.post('/favorites', auth, h(async (req, res) => {
  await q(db.from('favorites').upsert({ user_id: req.user.id, kos_id: req.body.kos_id }, { onConflict: 'user_id,kos_id' }))
  ok(res, { is_favorited: true }, 201)
}))
r.delete('/favorites/:kosId', auth, h(async (req, res) => {
  await q(db.from('favorites').delete().eq('user_id', req.user.id).eq('kos_id', req.params.kosId))
  ok(res, { is_favorited: false })
}))

// ---------- REVIEWS ----------
r.get('/kos/:id/reviews', h(async (req, res) => ok(res, await q(db.from('reviews').select('*, users(name)').eq('kos_id', req.params.id).order('created_at', { ascending: false })))))
r.post('/kos/:id/reviews', auth, h(async (req, res) => {
  const { rating, comment } = req.body
  if (!(rating >= 1 && rating <= 5)) return fail(res, 400, 'Rating harus 1-5')
  ok(res, (await q(db.from('reviews').insert({ kos_id: req.params.id, user_id: req.user.id, rating, comment }).select()))[0], 201)
}))

app.get('/', (_, res) => res.json({ name: 'Kostara API', version: '1.0' }))
app.get('/api', (_, res) => res.json({ name: 'Kostara API', version: '1.0' }))
app.use('/api/v1', r)
app.use('/v1', r)
app.use(r)

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => console.log(`Kostara API ready on port ${PORT}`))
}

export default app
