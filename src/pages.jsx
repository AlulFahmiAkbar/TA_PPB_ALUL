import { useState, useEffect } from 'react'
import { api, setToken, rupiah, getUser, setUser } from './api'
import {
  IconSearch,
  IconHeart,
  IconCompare,
  IconMapPin,
  IconCampus,
  IconSparkles,
  IconCheck,
  IconClose,
  IconPlus,
  IconWhatsApp,
  IconFilter,
  IconWiFi,
  IconAC,
  IconBath,
  IconZap,
  IconShare,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconCamera,
  IconUpload
} from './icons.jsx'

export function compressImageFile(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan gambar'))
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export async function handleShareKos(k, showToast) {
  if (!k) return
  const url = `${window.location.origin}${window.location.pathname}?kos=${k.id}`
  const shareData = {
    title: `${k.name} - Kostara`,
    text: `Cek kos ${k.name} (${k.area || ''}) seharga ${rupiah(k.min_price)}/bln di Kostara!`,
    url: url
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(url)
    if (showToast) showToast('✓ Link kos berhasil disalin ke clipboard!')
    else alert('Link kos berhasil disalin ke clipboard:\n' + url)
  } catch {
    window.prompt('Salin link kos berikut:', url)
  }
}

// ---- Hook fetch data + loading ----
function useFetch(fn, deps = []) {
  const [s, set] = useState({ loading: true })
  useEffect(() => {
    let live = true
    set({ loading: true })
    fn().then(
      (data) => live && set({ data, loading: false }),
      (e) => live && set({ error: e.message, loading: false })
    )
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return s
}

const State = ({ s, children }) =>
  s.loading ? (
    <div className="figma-loading">
      <div className="figma-spinner"></div>
      <p>Memuat data kos…</p>
    </div>
  ) : s.error ? (
    <div className="figma-error-banner">
      <p>⚠ {s.error}</p>
    </div>
  ) : (
    children(s.data)
  )

const TYPES = ['Putra', 'Putri', 'Campur']
const FACS = ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir', 'Dapur Bersama', 'Laundry']

const CURATED_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=700&q=80'
]

const getRoomImage = (src, index = 0) => {
  if (src && !src.includes('picsum.photos')) return src
  return CURATED_ROOM_IMAGES[index % CURATED_ROOM_IMAGES.length]
}

// ---------------- Login / Register ----------------
export function Login({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const d = await api.post('/auth/' + mode, f)
      setToken(d.token)
      if (d.user) {
        setUser(d.user)
      }
      try {
        const me = await api.get('/auth/me')
        if (me) {
          setUser(me)
          if (me.avatar) localStorage.setItem('kostara_user_avatar', me.avatar)
        }
      } catch { }
      onAuth()
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="figma-auth-screen">
      <div className="figma-auth-card">
        <div className="auth-brand-header">
          <div className="auth-brand-logo">🏡</div>
          <h2>Kostara</h2>
          <p className="auth-brand-sub">Cari, bandingkan, dan temukan kos impianmu di sekitarmu.</p>
        </div>

        <div className="auth-pill-switch">
          <button
            type="button"
            className={`pill-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErr('') }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={`pill-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErr('') }}
          >
            Daftar Akun
          </button>
        </div>

        <form onSubmit={submit} className="figma-form">
          {mode === 'register' && (
            <div className="figma-input-group">
              <label>Nama Lengkap</label>
              <input
                placeholder="Alul Fahmi Akbar"
                value={f.name}
                onChange={set('name')}
                required
              />
            </div>
          )}

          <div className="figma-input-group">
            <label>Alamat Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={f.email}
              onChange={set('email')}
              required
            />
          </div>

          <div className="figma-input-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={f.password}
              onChange={set('password')}
              required
              minLength={6}
            />
          </div>

          {err && <div className="figma-error-banner">⚠ {err}</div>}

          <button className="figma-btn-primary" disabled={busy}>
            {busy ? 'Memproses…' : mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
          </button>
        </form>

        <div className="auth-card-footer">
          <span>{mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}</span>
          <button
            className="auth-link-button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}
          >
            {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Beranda (Home Page) ----------------
export function Home({ go, tab, cmp = [], toggleCmp, showToast, userAvatar, currentUser, setCurrentUser }) {
  const latest = useFetch(() => api.get('/kos'))

  // Instant synchronous user resolution from prop or localStorage (0 ms delay on reload)
  const activeUser = currentUser || getUser()
  const [user, setUserState] = useState(activeUser)
  const [kw, setKw] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [homePage, setHomePage] = useState(1)
  const homeItemsPerPage = 3

  useEffect(() => {
    let live = true
    api.get('/auth/me').then((data) => {
      if (live && data) {
        setUser(data)
        setUserState(data)
        if (setCurrentUser) setCurrentUser(data)
      }
    }).catch(() => { })
    return () => { live = false }
  }, [setCurrentUser])

  const profile = user || activeUser
  const fullName = profile?.name || ''
  const firstName = fullName ? fullName.trim().split(' ')[0] : ''
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : 'U'

  // Hitung jumlah data kos secara realtime dari database / API
  const allKosList = Array.isArray(latest.data) ? latest.data : []
  const countPutri = latest.loading ? '…' : `${allKosList.filter((k) => k.kos_type === 'Putri').length} Kos`
  const countPutra = latest.loading ? '…' : `${allKosList.filter((k) => k.kos_type === 'Putra').length} Kos`
  const countCampur = latest.loading ? '…' : `${allKosList.filter((k) => k.kos_type === 'Campur').length} Kos`

  return (
    <div className="figma-home-wrapper">
      {/* 1. Section: Greeting Bar */}
      <section className="section-greeting-bar">
        <div className="greeting-profile-group" onClick={() => tab('profile')}>
          <div className="greeting-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="greeting-avatar-img" />
            ) : (
              <span>{avatarLetter}</span>
            )}
          </div>
          <div className="greeting-text-col">
            <div className="greeting-row">
              <span className="greeting-name">Halo{firstName ? `, ${firstName}` : ''}</span>
              <span className="greeting-wave">👋</span>
            </div>
            <span className="greeting-sub">Sudah menemukan kos impianmu?</span>
          </div>
        </div>
      </section>

      {/* 2. Section: Search Bar & Filter Trigger */}
      <section className="section-search-bar-trigger">
        <form className="interactive-search-form" onSubmit={(e) => { e.preventDefault(); go('explore', null, kw) }}>
          <div className="search-pill-box">
            <IconSearch size={16} color="#717973" />
            <input
              type="text"
              placeholder="Cari kos berdasarkan nama atau lokasi"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
          </div>
          <button type="button" className="search-filter-trigger-btn" onClick={() => tab('explore')} title="Filter Pencarian">
            <IconFilter size={16} color="#FFFFFF" />
          </button>
        </form>
      </section>

      {/* 3. Section: Promo Hero Card */}
      <section className="section-promo-hero">
        <div className="promo-hero-card">
          <div className="ambient-shape-glow"></div>
          <div className="promo-badge-tag">
            <IconSparkles size={12} color="#FFB869" />
            <span>Promo Spesial Kampus</span>
          </div>
          <h2 className="promo-title">Temukan Tempat Tinggal yang Tepat</h2>
          <p className="promo-sub">Diskon survei & rekomendasi kos terverifikasi dekat kampus impianmu</p>
          <button className="promo-cta-btn" onClick={() => tab('explore')}>
            <span>Jelajahi Sekarang</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* 4. Section: Kategori Kos */}
      <section className="section-kategori-kos">
        <div className="section-header-row">
          <h3 className="section-heading-text">Kategori Kos</h3>
          <span className="section-link-more" onClick={() => tab('explore')}>Lihat Semua</span>
        </div>

        <div className="categories-grid-container">
          <div className="category-pill-card" onClick={() => go('explore', null, 'Putri')}>
            <div className="category-icon-box">
              <span style={{ fontSize: 18 }}>👩</span>
            </div>
            <div className="category-text-col">
              <span className="category-title">Kos Putri</span>
              <span className="category-sub">{countPutri}</span>
            </div>
          </div>

          <div className="category-pill-card" onClick={() => go('explore', null, 'Putra')}>
            <div className="category-icon-box">
              <span style={{ fontSize: 18 }}>👨</span>
            </div>
            <div className="category-text-col">
              <span className="category-title">Kos Putra</span>
              <span className="category-sub">{countPutra}</span>
            </div>
          </div>

          <div className="category-pill-card" onClick={() => go('explore', null, 'Campur')}>
            <div className="category-icon-box">
              <span style={{ fontSize: 18 }}>👫</span>
            </div>
            <div className="category-text-col">
              <span className="category-title">Kos Campur</span>
              <span className="category-sub">{countCampur}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Post Kos Banner for Owners */}
      <section className="section-post-kos-home">
        <div className="post-kos-home-card">
          <div className="post-kos-home-text">
            <span className="post-kos-home-tag">Untuk Pemilik Kos</span>
            <h4 className="post-kos-home-title">Punya Kos untuk Disewakan?</h4>
            <p className="post-kos-home-desc">Iklankan kosmu dengan cepat & gratis. Dilihat ribuan mahasiswa tiap hari!</p>
          </div>
          <button className="btn-post-kos-cta" onClick={() => go('postKos')}>
            <IconPlus size={14} color="#FFFFFF" />
            <span>Pasang Kos</span>
          </button>
        </div>
      </section>

      {/* 5. Section: Rekomendasi Untukmu (Featured Card) */}
      <section className="section-rekomendasi-feed">
        <div className="section-header-row">
          <div className="header-title-stack">
            <h3 className="section-heading-text">Rekomendasi Untukmu</h3>
            <span className="section-sub-text">Sesuai preferensi jarak & budgetmu</span>
          </div>
        </div>

        <State s={latest}>
          {(list) => {
            if (!list.length) return <p className="empty-text">Belum ada kos terdaftar.</p>
            const featured = list[0]
            const isFav = false
            return (
              <div className="featured-rec-card" onClick={() => go('detail', featured.id)}>
                <div className="card-image-top">
                  <img
                    src={getRoomImage(featured.image_url, 0)}
                    alt={featured.name}
                    className="rec-img"
                  />
                  <div className="gradient-overlay"></div>

                  <div className="top-tags-left">
                    <span className="tag-type-white">{featured.kos_type}</span>
                    <span className="tag-verified">
                      <IconCheck size={10} color="#002113" />
                      <span>Terverifikasi</span>
                    </span>
                  </div>

                  <div className="top-tags-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="glass-action-btn"
                      onClick={() => handleShareKos(featured, showToast)}
                      title="Bagikan Link Kos"
                    >
                      <IconShare size={13} color="#404943" />
                    </button>
                    <button
                      className="glass-action-btn"
                      onClick={() => toggleCmp(featured.id)}
                      title="Bandingkan"
                    >
                      <IconCompare size={14} color={cmp.includes(featured.id) ? '#174D35' : '#404943'} />
                    </button>
                    <button
                      className="glass-action-btn"
                      onClick={async () => {
                        await api.post('/favorites', { kos_id: featured.id })
                        if (showToast) showToast('✓ Ditambahkan ke favorit!')
                        else alert('Ditambahkan ke favorit!')
                      }}
                      title="Simpan Favorit"
                    >
                      <IconHeart size={14} filled={isFav} />
                    </button>
                  </div>
                </div>

                <div className="rec-card-body">
                  <div className="body-top-row">
                    <h4 className="rec-card-title">{featured.name}</h4>
                  </div>

                  <div className="location-row">
                    <IconMapPin size={12} color="#174D35" />
                    <span className="location-text">{featured.address || featured.area}</span>
                  </div>

                  <div className="facilities-pill-row">
                    {(featured.facilities || ['WiFi', 'AC', 'Kamar Mandi Dalam']).slice(0, 3).map((f) => (
                      <span key={f} className="amenity-chip">
                        {f === 'WiFi' ? <IconWiFi size={11} /> : f === 'AC' ? <IconAC size={11} /> : <IconBath size={11} />}
                        <span>{f}</span>
                      </span>
                    ))}
                  </div>

                  <div className="rec-card-footer">
                    <div className="footer-price-col">
                      <span className="price-lead-label">Mulai dari</span>
                      <div className="price-main-row">
                        <b className="price-amount">{rupiah(featured.min_price)}</b>
                        <span className="price-freq">/ bulan</span>
                      </div>
                    </div>
                    <button className="btn-detail-small">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            )
          }}
        </State>
      </section>

      {/* 6. Section: Kos Terbaru (Horizontal Stack) */}
      <section className="section-kos-terbaru">
        <div className="section-header-row">
          <div className="header-title-stack">
            <h3 className="section-heading-text">Kos Terbaru</h3>
            <span className="section-sub-text">Baru diverifikasi & siap huni minggu ini</span>
          </div>
          <span className="section-link-more" onClick={() => tab('explore')}>
            Semua ({allKosList.length})
          </span>
        </div>

        <State s={latest}>
          {(rawList) => {
            const list = rawList || []
            const totalItems = list.length
            const totalPages = Math.ceil(totalItems / homeItemsPerPage) || 1
            const currentPage = Math.min(homePage, totalPages)
            const paginatedList = list.slice((currentPage - 1) * homeItemsPerPage, currentPage * homeItemsPerPage)

            if (!list.length) {
              return <p className="empty-text">Belum ada kos terdaftar.</p>
            }

            return (
              <>
                <div className="recent-kos-stack">
                  {paginatedList.map((k, idx) => (
                    <div key={k.id} className="recent-kos-card" onClick={() => go('detail', k.id)}>
                      <div className="recent-thumb-wrapper">
                        <img src={getRoomImage(k.image_url, (currentPage - 1) * homeItemsPerPage + idx)} alt={k.name} className="recent-thumb-img" />
                        <span className="recent-type-overlay">{k.kos_type}</span>
                      </div>
                      <div className="recent-info-col">
                        <div className="recent-title-row">
                          <h4 className="recent-kos-title">{k.name}</h4>
                        </div>
                        <div className="recent-location-row">
                          <IconMapPin size={10} color="#174D35" />
                          <span>{k.area || k.address}</span>
                        </div>
                        <div className="recent-amenities-row">
                          {(k.facilities || ['WiFi', 'AC', 'Parkir']).slice(0, 3).map((fac) => (
                            <span key={fac} className="recent-mini-chip">{fac}</span>
                          ))}
                        </div>
                        <div className="recent-price-row">
                          <b className="recent-price-val">{rupiah(k.min_price)}</b>
                          <span className="recent-price-sub">/ bln</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls on Home Page */}
                {totalPages > 1 && (
                  <nav className="figma-pagination" style={{ margin: '14px 0 6px' }} aria-label="Navigasi Kos Terbaru">
                    <button
                      className="pagination-btn arrow"
                      disabled={currentPage <= 1}
                      onClick={() => setHomePage((p) => Math.max(1, p - 1))}
                      title="Halaman Sebelumnya"
                    >
                      <IconChevronLeft size={16} color={currentPage <= 1 ? '#717973' : '#174D35'} />
                      <span>Prev</span>
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={`page-num-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => setHomePage(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-btn arrow"
                      disabled={currentPage >= totalPages}
                      onClick={() => setHomePage((p) => Math.min(totalPages, p + 1))}
                      title="Halaman Selanjutnya"
                    >
                      <span>Next</span>
                      <IconChevronRight size={16} color={currentPage >= totalPages ? '#717973' : '#174D35'} />
                    </button>
                  </nav>
                )}
              </>
            )
          }}
        </State>
      </section>
    </div>
  )
}

// ---------------- Jelajah Kos (Explore Page) ----------------
export function Explore({ go, extra, cmp = [], toggleCmp, showToast }) {
  const isTypeExtra = ['Putri', 'Putra', 'Campur'].includes(extra)
  const [q, setQ] = useState(isTypeExtra ? '' : (extra || ''))
  const [selectedType, setSelectedType] = useState(isTypeExtra ? extra : '')
  const [selectedMax, setSelectedMax] = useState('')
  const [selectedFacility, setSelectedFacility] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 4

  useEffect(() => {
    if (extra) {
      if (['Putri', 'Putra', 'Campur'].includes(extra)) {
        setSelectedType(extra)
        setQ('')
      } else {
        setQ(extra)
        setSelectedType('')
      }
    }
  }, [extra])

  const params = {}
  if (q) params.q = q
  if (selectedType) params.type = selectedType
  if (selectedMax) params.max = selectedMax
  if (selectedFacility) params.facility = selectedFacility

  const s = useFetch(() => api.get('/kos', { params }), [q, selectedType, selectedMax, selectedFacility])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [q, selectedType, selectedMax, selectedFacility])

  const FILTER_CHIPS = [
    { label: 'Semua', value: '' },
    { label: 'Putri', value: 'Putri' },
    { label: 'Putra', value: 'Putra' },
    { label: 'Campur', value: 'Campur' },
    { label: '≤ 1 Jt', max: '1000000' },
    { label: '≤ 1.5 Jt', max: '1500000' }
  ]

  return (
    <div className="figma-explore-wrapper">
      {/* 1. Search & Heading Section */}
      <section className="explore-heading-section">
        <div className="explore-heading-top-row">
          <div className="heading-text-group">
            <h1 className="explore-main-heading">Jelajahi Kos</h1>
            <p className="explore-subtitle">Temukan kos impian terverifikasi di sekitarmu</p>
          </div>
          <button className="btn-post-kos-small" onClick={() => go('postKos')} title="Pasang Iklan Kos">
            <IconPlus size={14} color="#174D35" />
            <span>Post Kos</span>
          </button>
        </div>

        <div className="interactive-search-bar">
          <IconSearch size={16} color="#003521" />
          <input
            type="text"
            placeholder="Cari nama kos atau wilayah (mis. Tembalang)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="clear-search-btn" onClick={() => setQ('')}>
              <IconClose size={12} color="#404943" />
            </button>
          )}
        </div>
      </section>

      {/* 2. Horizontal Scrollable Filter Chips */}
      <section className="explore-filter-chips-section">
        <div className="chips-scroll-container">
          <button
            className={`filter-chip-pill trigger ${selectedType || selectedMax ? 'active-count' : ''}`}
            onClick={() => { setSelectedType(''); setSelectedMax(''); setSelectedFacility(''); setQ('') }}
          >
            <IconFilter size={12} color={selectedType || selectedMax ? '#FFFFFF' : '#174D35'} />
            <span>Filter</span>
            {(selectedType || selectedMax) && <span className="chip-count-dot">1</span>}
          </button>

          {FILTER_CHIPS.map((chip, idx) => {
            const isTypeActive = chip.value !== undefined && selectedType === chip.value
            const isMaxActive = chip.max !== undefined && selectedMax === chip.max
            const isActive = isTypeActive || isMaxActive

            return (
              <button
                key={idx}
                className={`filter-chip-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (chip.value !== undefined) setSelectedType(isTypeActive ? '' : chip.value)
                  if (chip.max !== undefined) setSelectedMax(isMaxActive ? '' : chip.max)
                }}
              >
                <span>{chip.label}</span>
                {isActive && <IconClose size={8} color="#174D35" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Section: Kos Listing Cards Feed with Pagination */}
      <section className="explore-cards-feed-section">
        <State s={s}>
          {(rawList) => {
            const list = rawList || []
            const totalItems = list.length
            const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
            const currentPage = Math.min(page, totalPages)
            const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

            if (!list.length) {
              return (
                <div className="compare-empty-box">
                  <div className="empty-circle-icon">🔍</div>
                  <h3>Tidak ada kos ditemukan</h3>
                  <p>Coba ubah kata kunci pencarian atau reset filter untuk melihat kos lainnya.</p>
                  <button
                    className="figma-btn-primary"
                    onClick={() => { setSelectedType(''); setSelectedMax(''); setSelectedFacility(''); setQ('') }}
                    style={{ marginTop: 14 }}
                  >
                    Reset Filter
                  </button>
                </div>
              )
            }

            return (
              <>
                <div className="pagination-info-strip">
                  <span>Menampilkan <b>{((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}</b> dari <b>{totalItems}</b> kos</span>
                  <span className="page-indicator-pill">Halaman {currentPage} dari {totalPages}</span>
                </div>

                <div className="feed-cards-column">
                  {paginatedList.map((k, idx) => (
                    <article key={k.id} className="figma-listing-card" onClick={() => go('detail', k.id)}>
                      <div className="listing-card-media">
                        <img
                          src={getRoomImage(k.image_url, idx + (currentPage - 1) * itemsPerPage)}
                          alt={k.name}
                          className="listing-card-img"
                        />
                        <div className="gradient-overlay"></div>

                        {/* Top Tags Row */}
                        <div className="top-tags-row">
                          <div className="tags-left">
                            <span className="tag-pill-white">{k.kos_type}</span>
                            <span className="tag-pill-mint">
                              <IconCheck size={10} color="#002113" />
                              <span>Terverifikasi</span>
                            </span>
                          </div>

                          <div className="tags-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="glass-icon-btn"
                              onClick={() => handleShareKos(k, showToast)}
                              title="Bagikan Link Kos"
                            >
                              <IconShare size={13} color="#404943" />
                            </button>
                            <button
                              className="glass-icon-btn"
                              onClick={() => toggleCmp(k.id)}
                              title="Bandingkan"
                            >
                              <IconCompare size={14} color={cmp.includes(k.id) ? '#174D35' : '#404943'} />
                            </button>
                            <button
                              className="glass-icon-btn"
                              onClick={async () => {
                                await api.post('/favorites', { kos_id: k.id })
                                if (showToast) showToast('✓ Tersimpan di favorit!')
                                else alert('Tersimpan di favorit!')
                              }}
                              title="Simpan Favorit"
                            >
                              <IconHeart size={14} color="#BA1A1A" />
                            </button>
                          </div>
                        </div>

                        {/* Room Availability Badge (Bottom Left overlay) */}
                        <div className="room-availability-badge-overlay">
                          <span className={`scarcity-badge-inner ${k.available_rooms <= 1 ? 'scarcity' : 'normal'}`}>
                            {k.available_rooms <= 1 ? `● Sisa ${k.available_rooms || 0} Kamar` : `● ${k.available_rooms} Kamar Tersedia`}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="listing-card-body">
                        <div className="body-header-row">
                          <h2 className="listing-title">{k.name}</h2>
                        </div>

                        <div className="listing-location-row">
                          <IconMapPin size={11} color="#003521" />
                          <span className="location-name">{k.address || k.area}</span>
                        </div>

                        {/* Facilities Pill Row */}
                        <div className="listing-facilities-row">
                          {(k.facilities || ['WiFi', 'AC', 'Kamar Mandi Dalam']).slice(0, 4).map((fac) => (
                            <span key={fac} className="listing-facility-pill">
                              {fac === 'WiFi' ? <IconWiFi size={11} /> : fac === 'AC' ? <IconAC size={11} /> : <IconBath size={11} />}
                              <span>{fac}</span>
                            </span>
                          ))}
                        </div>

                        {/* Pricing & Action Row */}
                        <div className="listing-pricing-action-row">
                          <div className="pricing-col">
                            <span className="price-prefix">Mulai dari</span>
                            <div className="price-display-group">
                              <b className="price-bold">{rupiah(k.min_price)}</b>
                              <span className="price-unit">/ bln</span>
                            </div>
                          </div>
                          <button className="btn-listing-action">
                            Lihat Detail
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav className="figma-pagination" aria-label="Navigasi Halaman">
                    <button
                      className="pagination-btn arrow"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1))
                        window.scrollTo({ top: 100, behavior: 'smooth' })
                      }}
                      title="Halaman Sebelumnya"
                    >
                      <IconChevronLeft size={16} color={currentPage <= 1 ? '#717973' : '#174D35'} />
                      <span>Prev</span>
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={`page-num-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => {
                            setPage(p)
                            window.scrollTo({ top: 100, behavior: 'smooth' })
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-btn arrow"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1))
                        window.scrollTo({ top: 100, behavior: 'smooth' })
                      }}
                      title="Halaman Selanjutnya"
                    >
                      <span>Next</span>
                      <IconChevronRight size={16} color={currentPage >= totalPages ? '#717973' : '#174D35'} />
                    </button>
                  </nav>
                )}
              </>
            )
          }}
        </State>
      </section>
    </div>
  )
}

// ---------------- Bandingkan Kos (Compare Page) ----------------
export function Compare({ cmp, toggleCmp, go }) {
  const s = useFetch(() => Promise.all(cmp.map((id) => api.get('/kos/' + id))), [cmp.join()])

  if (!cmp.length) {
    return (
      <div className="figma-compare-wrapper empty">
        <div className="compare-title-header">
          <div className="context-chip">
            <IconCompare size={12} color="#174D35" />
            <span>KOMPARASI CERDAS</span>
          </div>
          <h1 className="compare-heading">Bandingkan Kos</h1>
          <p className="compare-subtext">Bandingkan fasilitas, harga, dan lokasi hingga 3 tempat kos sekaligus untuk keputusan terbaikmu.</p>
        </div>
        <div className="compare-empty-box">
          <div className="empty-circle-icon">⚖️</div>
          <h3>Belum ada kos yang dipilih</h3>
          <p>Buka halaman Jelajah atau Detail kos, lalu tekan tombol <b>"Bandingkan"</b> untuk membandingkan kos secara langsung di sini.</p>
          <button className="figma-btn-primary" onClick={() => go('explore')} style={{ marginTop: 16 }}>
            Cari Kos Sekarang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="figma-compare-wrapper">
      {/* Title & Context Header */}
      <section className="compare-title-header">
        <div className="context-chip">
          <IconCompare size={12} color="#174D35" />
          <span>KOMPARASI CERDAS</span>
        </div>
        <h1 className="compare-heading">Bandingkan Kos</h1>
        <p className="compare-subtext">Bandingkan fasilitas, harga, dan lokasi hingga 3 tempat kos sekaligus untuk keputusan terbaikmu.</p>
      </section>

      {/* Smart Recommendation Banner */}
      <section className="smart-rec-banner">
        <div className="smart-rec-icon-circle">
          <IconSparkles size={14} color="#003521" />
        </div>
        <div className="smart-rec-content-col">
          <span className="smart-rec-badge">Rekomendasi Kostara</span>
          <p className="smart-rec-text">
            Kos <b>{cmp[0] ? 'pilihan teratas' : ''}</b> lebih hemat Rp150.000/bulan dan 800 meter lebih dekat ke area kampus.
          </p>
        </div>
      </section>

      {/* Comparison Matrix Component */}
      <section className="comparison-matrix-section">
        <State s={s}>
          {(list) => (
            <div className="matrix-scroll-container">
              {/* Sticky Headers (Properties) */}
              <div className="matrix-headers-row">
                <div className="matrix-feature-label-cell">
                  <span className="item-fitur-title">ITEM FITUR</span>
                </div>

                {list.map((k) => (
                  <div key={k.id} className="matrix-property-card">
                    <button className="property-delete-btn" onClick={() => toggleCmp(k.id)} title="Hapus">
                      <IconClose size={8} color="#404943" />
                    </button>
                    <div className="property-thumb-box">
                      <img src={getRoomImage(k.image_url)} alt={k.name} className="property-thumb-img" />
                      <span className="property-type-pill">{k.kos_type}</span>
                    </div>
                    <h3 className="property-name" onClick={() => go('detail', k.id)}>{k.name}</h3>
                    <span className="property-area">{k.area}</span>
                  </div>
                ))}
              </div>

              {/* Add Slot Quick Trigger */}
              {list.length < 3 && (
                <div className="add-slot-trigger-row" onClick={() => go('explore')}>
                  <button className="add-slot-btn">
                    <IconPlus size={13} color="#003521" />
                    <span>+ Tambah Kos Pembanding ({list.length}/3)</span>
                  </button>
                </div>
              )}

              {/* Data Section: Harga */}
              <div className="matrix-data-section">
                <div className="data-row-label">
                  <span className="data-label-text">Harga Mulai</span>
                </div>
                <div className="data-row-values">
                  {list.map((k, idx) => (
                    <div key={k.id} className="data-val-cell">
                      <b className="price-big">{rupiah(k.min_price)}</b>
                      <span className="price-sub-label">/ bulan</span>
                      {idx === 0 && <span className="best-price-badge">Termurah</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Section: Lokasi / Area */}
              <div className="matrix-data-section">
                <div className="data-row-label">
                  <span className="data-label-text">Lokasi & Jarak</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => (
                    <div key={k.id} className="data-val-cell">
                      <b className="data-main-text">{k.area}</b>
                      <span className="data-sub-text">~5 mnt ke kampus</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Section: Tipe / Gender */}
              <div className="matrix-data-section subtle">
                <div className="data-row-label">
                  <span className="data-label-text">Tipe Kos</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => (
                    <div key={k.id} className="data-val-cell">
                      <span className="gender-pill">{k.kos_type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Section: Ketersediaan */}
              <div className="matrix-data-section">
                <div className="data-row-label">
                  <span className="data-label-text">Ketersediaan</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => (
                    <div key={k.id} className="data-val-cell">
                      <b className={k.available_rooms ? 'text-green' : 'text-red'}>
                        {k.available_rooms ? `${k.available_rooms} Kamar` : 'Penuh'}
                      </b>
                      <span className="data-sub-text">Lantai 1 & 2</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Section: Kamar Mandi */}
              <div className="matrix-data-section subtle">
                <div className="data-row-label">
                  <span className="data-label-text">Kamar Mandi</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => {
                    const hasKM = (k.facilities || []).includes('Kamar Mandi Dalam')
                    return (
                      <div key={k.id} className="data-val-cell">
                        <b className="data-main-text">{hasKM ? 'K. Mandi Dalam' : 'K. Mandi Luar'}</b>
                        <span className="data-sub-text">{hasKM ? 'Shower, Kloset Duduk' : 'Bersama, Bersih'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Data Section: AC */}
              <div className="matrix-data-section">
                <div className="data-row-label">
                  <span className="data-label-text">Air Conditioner (AC)</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => {
                    const hasAC = (k.facilities || []).includes('AC')
                    return (
                      <div key={k.id} className="data-val-cell">
                        <span className={`feature-status-check ${hasAC ? 'yes' : 'no'}`}>
                          {hasAC ? '✓ Ada AC' : '— Kipas Angin'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Data Section: WiFi */}
              <div className="matrix-data-section subtle">
                <div className="data-row-label">
                  <span className="data-label-text">Koneksi WiFi</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => {
                    const hasWiFi = (k.facilities || []).includes('WiFi')
                    return (
                      <div key={k.id} className="data-val-cell">
                        <b className="data-main-text">{hasWiFi ? 'WiFi Fiber Cepat' : '— Tidak Ada'}</b>
                        <span className="data-sub-text">{hasWiFi ? 'Up to 50 Mbps' : '-'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Data Section: Aksi Lanjutan */}
              <div className="matrix-data-section action-buttons-row">
                <div className="data-row-label">
                  <span className="data-label-text">Aksi Lanjutan</span>
                </div>
                <div className="data-row-values">
                  {list.map((k) => {
                    const roomId = k.rooms?.find((r) => r.availability)?.id || k.rooms?.[0]?.id || k.id
                    return (
                      <div key={k.id} className="data-val-cell action-buttons-cell">
                        <button className="compare-btn-select" onClick={() => go('room', roomId)}>
                          Pilih Kos Ini
                        </button>
                        <button className="compare-btn-detail" onClick={() => go('detail', k.id)}>
                          Detail Unit
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </State>
      </section>

      {/* Bottom helper card matching Figma */}
      <section className="compare-bottom-helper-card">
        <div className="helper-card-content">
          <div className="helper-card-icon">💡</div>
          <div className="helper-card-text">
            <b>Masih Ragu?</b>
            <span>Tambah 1 kos dari daftar favoritmu untuk melihat perbandingan.</span>
          </div>
        </div>
        <button className="helper-card-cta" onClick={() => go('explore')}>
          Cari Kos
        </button>
      </section>
    </div>
  )
}

// ---------------- Detail Kos ----------------
export function Detail({ id, go, cmp = [], toggleCmp, showToast }) {
  const s = useFetch(() => Promise.all([api.get('/kos/' + id), api.get('/favorites')]), [id])
  const [fav, setFav] = useState(null)

  return (
    <State s={s}>
      {([k, favs]) => {
        const isFav = fav ?? favs.some((x) => x.id === k.id)
        const toggle = async () => {
          isFav ? await api.delete('/favorites/' + k.id) : await api.post('/favorites', { kos_id: k.id })
          setFav(!isFav)
          if (showToast) showToast(!isFav ? '✓ Ditambahkan ke favorit!' : 'Dihapus dari favorit')
        }

        return (
          <div className="figma-detail-wrapper">
            <div className="detail-media-container">
              <img src={getRoomImage(k.image_url)} alt={k.name} className="detail-cover-img" />
              <div className="gradient-overlay"></div>
              <span className="detail-type-badge">{k.kos_type}</span>

              <div className="detail-top-floating-btns">
                <button
                  className="glass-icon-btn"
                  onClick={() => handleShareKos(k, showToast)}
                  title="Bagikan Kos"
                >
                  <IconShare size={15} color="#174D35" />
                </button>
              </div>
            </div>

            <div className="detail-header-card">
              <h1 className="detail-name">{k.name}</h1>
              <div className="detail-location-row">
                <IconMapPin size={14} color="#174D35" />
                <span>{k.address || k.area}</span>
              </div>

              <div className="detail-actions-row">
                <button className={`detail-action-pill ${isFav ? 'active-fav' : ''}`} onClick={toggle}>
                  <IconHeart size={16} filled={isFav} />
                  <span>{isFav ? 'Tersimpan' : 'Simpan Favorit'}</span>
                </button>
                {toggleCmp && (
                  <button className={`detail-action-pill ${cmp.includes(k.id) ? 'active-cmp' : ''}`} onClick={() => toggleCmp(k.id)}>
                    <IconCompare size={16} color={cmp.includes(k.id) ? '#174D35' : '#404943'} />
                    <span>{cmp.includes(k.id) ? '✓ Dibandingkan' : 'Bandingkan'}</span>
                  </button>
                )}
                <button className="detail-action-pill" onClick={() => handleShareKos(k, showToast)}>
                  <IconShare size={16} color="#174D35" />
                  <span>Bagikan</span>
                </button>
                <a
                  className="detail-whatsapp-btn"
                  href={`https://wa.me/${k.owner_phone}?text=Halo%20${encodeURIComponent(k.owner_name)},%20saya%20tertarik%20dengan%20${encodeURIComponent(k.name)}%20di%20Kostara.`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWhatsApp size={16} />
                  <span>WhatsApp Pemilik</span>
                </a>
              </div>
            </div>

            {/* Share Link Card */}
            <div className="detail-content-block share-block">
              <div className="share-header-group">
                <div className="share-icon-circle">
                  <IconShare size={18} color="#174D35" />
                </div>
                <div>
                  <h3 className="block-title" style={{ margin: 0 }}>Bagikan Kos Ini</h3>
                  <p className="share-sub">Ajak teman survei kos bareng atau kirimkan link ke orang tua</p>
                </div>
              </div>
              <div className="share-btn-group">
                <button
                  className="btn-share-whatsapp"
                  onClick={() => {
                    const text = encodeURIComponent(`Halo, coba cek kos ${k.name} (${k.area || ''}) di Kostara seharga ${rupiah(k.min_price)}/bln: ${window.location.origin}${window.location.pathname}?kos=${k.id}`)
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
                  }}
                >
                  <IconWhatsApp size={16} color="#FFFFFF" />
                  <span>Kirim ke WhatsApp</span>
                </button>
                <button
                  className="btn-share-copy"
                  onClick={() => handleShareKos(k, showToast)}
                >
                  <IconCopy size={16} color="#174D35" />
                  <span>Salin Tautan</span>
                </button>
              </div>
            </div>

            <div className="detail-content-block">
              <h3 className="block-title">Deskripsi Kos</h3>
              <p className="block-text">{k.description || 'Hunian kos nyaman dan strategis untuk mahasiswa.'}</p>
            </div>

            <div className="detail-content-block">
              <h3 className="block-title">Fasilitas yang Tersedia</h3>
              <div className="facility-chips-grid">
                {(k.facilities || []).map((f) => (
                  <span key={f} className="detail-facility-chip">
                    <IconCheck size={12} color="#174D35" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-content-block">
              <h3 className="block-title">Daftar Kamar</h3>
              <div className="rooms-stack">
                {(k.rooms || []).map((r) => (
                  <div key={r.id} className="room-card-item" onClick={() => go('room', r.id)}>
                    <div>
                      <b className="room-card-name">Kamar {r.room_name}</b>
                      <span className="room-card-size">📐 {r.size || '3x3 m'}</span>
                    </div>
                    <div className="room-card-right">
                      <b className="room-card-price">{rupiah(r.price)}<small>/bln</small></b>
                      <span className={`room-card-status ${r.availability ? 'available' : 'occupied'}`}>
                        {r.availability ? '● Tersedia' : '● Terisi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }}
    </State>
  )
}

// ---------------- Detail Kamar ----------------
export function Room({ id, go }) {
  const s = useFetch(() => api.get('/rooms/' + id), [id])

  return (
    <State s={s}>
      {(r) => (
        <div className="figma-room-wrapper">
          <div className="room-hero-banner">
            <span className={`room-banner-pill ${r.availability ? 'available' : 'occupied'}`}>
              {r.availability ? '● Kamar Siap Huni' : '● Kamar Penuh'}
            </span>
            <h1 className="room-banner-title">Kamar {r.room_name}</h1>
            <p className="room-banner-price">{rupiah(r.price)}<small> / bulan</small></p>
          </div>

          <div className="detail-content-block">
            <h3 className="block-title">Spesifikasi Kamar</h3>
            <div className="room-specs-row">
              <div className="spec-item">
                <span className="spec-label">Ukuran Kamar</span>
                <span className="spec-val">{r.size || '3x3 meter'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Ketersediaan</span>
                <span className="spec-val">{r.availability ? 'Tersedia' : 'Terisi'}</span>
              </div>
            </div>
            <p className="block-text" style={{ marginTop: 12 }}>{r.description || 'Kamar bersih dengan pencahayaan dan sirkulasi udara yang baik.'}</p>
          </div>

          <div className="detail-content-block">
            <h3 className="block-title">Tempat Kos</h3>
            <p className="parent-kos-title" onClick={() => r.kos?.id && go('detail', r.kos.id)}>
              {r.kos?.name || 'Informasi Kos'}
            </p>
            <p className="parent-kos-address">{r.kos?.address || ''}</p>

            <a
              className="figma-btn-primary"
              style={{ marginTop: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              href={`https://wa.me/${(r.kos?.owner_phone || '').replace(/[^0-9]/g, '')}?text=Halo,%20saya%20tertarik%20dengan%20kamar%20${encodeURIComponent(r.room_name || 'ini')}%20di%20${encodeURIComponent(r.kos?.name || 'kos Anda')}.`}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp size={16} color="#FFFFFF" />
              <span>Hubungi Pemilik Kos</span>
            </a>
          </div>
        </div>
      )}
    </State>
  )
}

// ---------------- Favorit ----------------
export function Favorites({ go, cmp = [], toggleCmp, showToast }) {
  const s = useFetch(() => api.get('/favorites'))
  const [removedIds, setRemovedIds] = useState([])

  const removeFav = async (e, id) => {
    e.stopPropagation()
    try {
      await api.delete('/favorites/' + id)
      setRemovedIds((prev) => [...prev, id])
      if (showToast) showToast('Dihapus dari favorit')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="figma-favorites-wrapper">
      <section className="explore-heading-section">
        <h1 className="explore-main-heading">Kos Favorit</h1>
        <p className="explore-subtitle">Daftar kos impian yang telah Anda simpan</p>
      </section>

      <section className="explore-cards-feed-section">
        <State s={s}>
          {(d) => {
            const list = (d || []).filter((k) => !removedIds.includes(k.id))
            if (!list.length) {
              return (
                <div className="compare-empty-box">
                  <div className="empty-circle-icon">❤️</div>
                  <h3>Belum ada kos favorit</h3>
                  <p>Tekan ikon hati pada kos mana pun di halaman Beranda atau Jelajah untuk menyimpannya di sini.</p>
                  <button className="figma-btn-primary" onClick={() => go('explore')} style={{ marginTop: 16 }}>
                    Jelajahi Kos Sekarang
                  </button>
                </div>
              )
            }

            return (
              <div className="feed-cards-column">
                {list.map((k, idx) => (
                  <article key={k.id} className="figma-listing-card" onClick={() => go('detail', k.id)}>
                    <div className="listing-card-media">
                      <img
                        src={getRoomImage(k.image_url, idx)}
                        alt={k.name}
                        className="listing-card-img"
                      />
                      <div className="gradient-overlay"></div>

                      {/* Top Tags Row */}
                      <div className="top-tags-row">
                        <div className="tags-left">
                          <span className="tag-pill-white">{k.kos_type}</span>
                          <span className="tag-pill-mint">
                            <IconCheck size={10} color="#002113" />
                            <span>Terverifikasi</span>
                          </span>
                        </div>

                        <div className="tags-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="glass-icon-btn"
                            onClick={() => handleShareKos(k, showToast)}
                            title="Bagikan Link Kos"
                          >
                            <IconShare size={13} color="#404943" />
                          </button>
                          {toggleCmp && (
                            <button
                              className="glass-icon-btn"
                              onClick={() => toggleCmp(k.id)}
                              title="Bandingkan"
                            >
                              <IconCompare size={14} color={cmp.includes(k.id) ? '#174D35' : '#404943'} />
                            </button>
                          )}
                          <button
                            className="glass-icon-btn"
                            onClick={(e) => removeFav(e, k.id)}
                            title="Hapus dari Favorit"
                          >
                            <IconHeart size={14} color="#BA1A1A" filled={true} />
                          </button>
                        </div>
                      </div>

                      {/* Room Availability Badge */}
                      <div className="room-availability-badge-overlay">
                        <span className={`scarcity-badge-inner ${k.available_rooms <= 1 ? 'scarcity' : 'normal'}`}>
                          {k.available_rooms <= 1 ? `● Sisa ${k.available_rooms || 0} Kamar` : `● ${k.available_rooms || 2} Kamar Tersedia`}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="listing-card-body">
                      <div className="body-header-row">
                        <h2 className="listing-title">{k.name}</h2>
                      </div>

                      <div className="listing-location-row">
                        <IconMapPin size={11} color="#003521" />
                        <span className="location-name">{k.address || k.area}</span>
                      </div>

                      {/* Facilities Pill Row */}
                      <div className="listing-facilities-row">
                        {(k.facilities || ['WiFi', 'AC', 'Kamar Mandi Dalam']).slice(0, 4).map((fac) => (
                          <span key={fac} className="listing-facility-pill">
                            {fac === 'WiFi' ? <IconWiFi size={11} /> : fac === 'AC' ? <IconAC size={11} /> : <IconBath size={11} />}
                            <span>{fac}</span>
                          </span>
                        ))}
                      </div>

                      {/* Pricing & Action Row */}
                      <div className="listing-pricing-action-row">
                        <div className="pricing-col">
                          <span className="price-prefix">Mulai dari</span>
                          <div className="price-display-group">
                            <b className="price-bold">{rupiah(k.min_price)}</b>
                            <span className="price-unit">/ bln</span>
                          </div>
                        </div>
                        <button className="btn-listing-action">
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          }}
        </State>
      </section>
    </div>
  )
}

// ---------------- Profil ----------------
export function Profile({ logout, go, userAvatar, setUserAvatar, showToast, currentUser, setCurrentUser }) {
  const cachedUser = currentUser || getUser()
  const s = useFetch(() => api.get('/auth/me'))
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState(() => ({
    name: cachedUser?.name || '',
    phone: cachedUser?.phone || ''
  }))
  const [avatar, setAvatar] = useState(userAvatar || cachedUser?.avatar || '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (s.data) {
      setForm({ name: s.data.name, phone: s.data.phone || '' })
      setUser(s.data)
      if (setCurrentUser) setCurrentUser(s.data)
      if (s.data.avatar !== undefined) {
        const freshAvatar = s.data.avatar || ''
        setAvatar(freshAvatar)
        if (setUserAvatar) setUserAvatar(freshAvatar)
        if (freshAvatar) {
          localStorage.setItem('kostara_user_avatar', freshAvatar)
        } else {
          localStorage.removeItem('kostara_user_avatar')
        }
      }
    }
  }, [s.data])

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.85)
      setAvatar(compressed)
      localStorage.setItem('kostara_user_avatar', compressed)
      if (setUserAvatar) setUserAvatar(compressed)
      const updatedUser = { ...(s.data || cachedUser || {}), avatar: compressed }
      setUser(updatedUser)
      if (setCurrentUser) setCurrentUser(updatedUser)
      try {
        await api.put('/auth/profile', { name: form?.name || s.data?.name, phone: form?.phone || '', avatar: compressed })
      } catch { }
      if (showToast) showToast('✓ Foto profil berhasil diperbarui!')
      else setMsg('Foto profil berhasil diperbarui ✓')
    } catch (err) {
      alert('Gagal memproses gambar: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatar('')
    localStorage.removeItem('kostara_user_avatar')
    if (setUserAvatar) setUserAvatar('')
    const updatedUser = { ...(s.data || cachedUser || {}), avatar: '' }
    setUser(updatedUser)
    if (setCurrentUser) setCurrentUser(updatedUser)
    try {
      await api.put('/auth/profile', { name: form?.name || s.data?.name, phone: form?.phone || '', avatar: '' })
    } catch { }
    if (showToast) showToast('Foto profil dihapus')
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      await api.put('/auth/profile', { ...form, avatar })
      const updatedUser = { ...(s.data || cachedUser || {}), ...form, avatar }
      setUser(updatedUser)
      if (setCurrentUser) setCurrentUser(updatedUser)
      setMsg('Profil berhasil diperbarui ✓')
      if (showToast) showToast('✓ Profil berhasil diperbarui')
    } catch (x) {
      setMsg(x.message)
    }
  }

  return (
    <div className="figma-profile-wrapper">
      <div className="explore-heading-section">
        <h1 className="explore-main-heading">Profil Saya</h1>
        <p className="explore-subtitle">Pengaturan akun & profil pengguna Kostara</p>
      </div>

      <State s={s}>
        {(u) =>
          form && (
            <form className="profile-edit-card" onSubmit={save}>
              <div className="profile-avatar-container">
                <div className="profile-large-avatar">
                  {avatar ? (
                    <img src={avatar} alt="Foto Profil" className="profile-large-avatar-img" />
                  ) : (
                    <span>{u.name ? u.name[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <label htmlFor="avatar-file-input" className="profile-avatar-badge" title="Ganti Foto Profil">
                  <IconCamera size={16} color="#FFFFFF" />
                </label>
              </div>

              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
              />

              <div className="profile-avatar-actions">
                <label htmlFor="avatar-file-input" className="btn-upload-photo-label">
                  <IconUpload size={14} color="#174D35" />
                  <span>{uploading ? 'Memproses…' : 'Ganti Foto dari Perangkat'}</span>
                </label>
                {avatar && (
                  <button type="button" className="btn-remove-photo" onClick={handleRemoveAvatar}>
                    Hapus Foto
                  </button>
                )}
              </div>

              <h2 className="profile-display-name">{form.name || u.name}</h2>
              <span className="profile-display-email">{u.email}</span>

              <div className="figma-form" style={{ width: '100%', marginTop: 20 }}>
                <div className="figma-input-group">
                  <label>Nama Lengkap</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="figma-input-group">
                  <label>Nomor WhatsApp</label>
                  <input
                    placeholder="08123456789"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {msg && <div className="figma-success-banner">{msg}</div>}

                <button className="figma-btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )
        }
      </State>

      {/* Quick Action: Post Kos Shortcut */}
      {go && (
        <div className="post-kos-shortcut-card" onClick={() => go('postKos')}>
          <div className="shortcut-icon-box">
            <IconPlus size={20} color="#174D35" />
          </div>
          <div className="shortcut-text-col">
            <h4 className="shortcut-title">Pasang Iklan Kos Baru</h4>
            <p className="shortcut-desc">Punya kos untuk disewakan? Iklankan kosmu dengan cepat & gratis di Kostara.</p>
          </div>
          <span className="shortcut-arrow">→</span>
        </div>
      )}

      <div className="detail-content-block about-kostara-card" style={{ marginTop: 20 }}>
        <h3 className="block-title">Tentang Kostara</h3>
        <p className="about-tagline" style={{ fontWeight: 600, color: '#174D35', fontSize: '12px', marginBottom: 10, lineHeight: '18px' }}>
          Temukan Kos yang Tepat, Mulai Perjalanan Baru Bersama Kostara.
        </p>
        <p className="block-text" style={{ marginBottom: 10 }}>
          Kostara adalah platform pencarian dan perbandingan tempat kos yang dirancang untuk membantu mahasiswa dan masyarakat menemukan hunian yang sesuai dengan kebutuhan, preferensi, serta anggaran mereka.
        </p>
        <p className="block-text" style={{ marginBottom: 10 }}>
          Kami memahami bahwa mencari tempat tinggal bukan sekadar menemukan kamar kosong. Lokasi, harga, fasilitas, kenyamanan, dan ketersediaan kamar merupakan beberapa hal penting yang perlu dipertimbangkan sebelum memilih tempat kos.
        </p>
        <p className="block-text" style={{ margin: 0 }}>
          Melalui Kostara, pengguna dapat menemukan berbagai pilihan tempat kos dalam satu platform, melihat informasi secara terperinci, membandingkan beberapa pilihan, serta memperoleh rekomendasi berdasarkan preferensi yang telah ditentukan.
        </p>
      </div>

      <button className="btn-logout-card" onClick={logout}>
        Keluar dari Akun
      </button>
    </div>
  )
}

// ---------------- Post Kos (Tambah Kos Baru) ----------------
export function PostKos({ go, back, tab, showToast }) {
  const [form, setForm] = useState({
    name: '',
    kos_type: 'Campur',
    area: 'Tembalang',
    address: '',
    description: '',
    price: '',
    room_name: 'Kamar Standard AC',
    size: '3x4 m',
    facilities: ['WiFi', 'AC', 'Kamar Mandi Dalam', 'Parkir'],
    image_url: '',
    owner_name: '',
    owner_phone: ''
  })
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const PRESET_IMAGES = [
    { label: 'Minimalis', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80' },
    { label: 'Aesthetic Cozy', url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80' },
    { label: 'Mezzanine Eksklusif', url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80' },
    { label: 'Skandinavia Cerah', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=80' }
  ]

  const AVAILABLE_FACILITIES = [
    'WiFi',
    'AC',
    'Kamar Mandi Dalam',
    'Kasur Springbed',
    'Lemari & Meja Belajar',
    'Water Heater',
    'Parkir Mobil/Motor',
    'Dapur Bersama',
    'Laundry',
    'CCTV 24 Jam',
    'Listrik Termasuk'
  ]

  const AREAS = [
    'Tembalang',
    'Banyumanik',
    'Sekaran / UNNES',
    'Pleburan',
    'Ngaliyan',
    'Pedurungan',
    'Semarang Barat',
    'Semarang Tengah',
    'Lainnya'
  ]

  const handleDeviceImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const dataUrl = await compressImageFile(file, 900, 600, 0.82)
      setImagePreview(dataUrl)
      setForm((prev) => ({ ...prev, image_url: dataUrl }))
    } catch (err) {
      alert('Gagal memproses gambar: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleFacility = (fac) => {
    setForm((prev) => {
      const has = prev.facilities.includes(fac)
      return {
        ...prev,
        facilities: has ? prev.facilities.filter((f) => f !== fac) : [...prev.facilities, fac]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrorMsg('Nama kos wajib diisi')
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setErrorMsg('Harga sewa per bulan harus diisi')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const finalImage = form.image_url || PRESET_IMAGES[0].url
      const payload = {
        name: form.name.trim(),
        kos_type: form.kos_type,
        area: form.area,
        address: form.address.trim() || form.area,
        description: form.description.trim() || `Kos ${form.kos_type} nyaman dan strategis di area ${form.area}.`,
        price: Number(form.price),
        room_name: form.room_name || 'Kamar Standard AC',
        size: form.size || '3x4 m',
        facilities: form.facilities,
        image_url: finalImage,
        owner_name: form.owner_name.trim(),
        owner_phone: form.owner_phone.trim()
      }

      const res = await api.post('/kos', payload)
      if (showToast) showToast('✓ Iklan kos berhasil dipasang!')

      if (res && res.id) {
        go('detail', res.id)
      } else if (tab) {
        tab('explore')
      } else if (back) {
        back()
      } else {
        go('explore')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memasang kos. Pastikan semua data terisi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="figma-post-kos-wrapper">
      <div className="explore-heading-section">
        <h1 className="explore-main-heading">Pasang Iklan Kos</h1>
        <p className="explore-subtitle">Iklankan kosmu untuk ribuan mahasiswa pencari hunian</p>
      </div>

      <form className="post-kos-form-card" onSubmit={handleSubmit}>
        {/* Step 1: Foto Kos */}
        <div className="post-kos-section-group">
          <label className="section-group-label">1. Foto Kos / Kamar</label>
          <p className="section-group-hint">Unggah foto asli kos dari HP/laptop atau pilih dari galeri</p>

          <div className="post-kos-upload-dropzone">
            {imagePreview || form.image_url ? (
              <div className="preview-image-container">
                <img
                  src={imagePreview || form.image_url}
                  alt="Preview Kos"
                  className="preview-kos-img"
                />
                <button
                  type="button"
                  className="btn-remove-preview-img"
                  onClick={() => { setImagePreview(''); setForm((p) => ({ ...p, image_url: '' })) }}
                  title="Hapus foto"
                >
                  <IconClose size={14} color="#FFFFFF" />
                </button>
              </div>
            ) : (
              <label htmlFor="kos-photo-input" className="upload-placeholder-box">
                <div className="upload-icon-circle">
                  <IconCamera size={26} color="#174D35" />
                </div>
                <span className="upload-main-text">
                  {uploadingImage ? 'Sedang memproses foto…' : 'Ambil Foto / Pilih dari Perangkat'}
                </span>
                <span className="upload-sub-text">Mendukung Kamera HP, JPEG, PNG</span>
              </label>
            )}

            <input
              id="kos-photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleDeviceImage}
            />
          </div>

          {/* Quick preset selector if user doesn't have photos ready */}
          <div className="preset-photos-picker">
            <span className="preset-label">Atau gunakan foto template:</span>
            <div className="preset-photos-row">
              {PRESET_IMAGES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`preset-thumb-btn ${(form.image_url === p.url && !imagePreview) ? 'selected' : ''}`}
                  onClick={() => { setImagePreview(''); setForm((f) => ({ ...f, image_url: p.url })) }}
                >
                  <img src={p.url} alt={p.label} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Info Dasar */}
        <div className="post-kos-section-group">
          <label className="section-group-label">2. Informasi Dasar Kos</label>

          <div className="figma-input-group">
            <label>Nama Kos *</label>
            <input
              type="text"
              placeholder="Contoh: Kos Putri Melati Asri"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-two-cols">
            <div className="figma-input-group">
              <label>Tipe Kos *</label>
              <select
                value={form.kos_type}
                onChange={(e) => setForm({ ...form, kos_type: e.target.value })}
              >
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
                <option value="Campur">Campur</option>
              </select>
            </div>

            <div className="figma-input-group">
              <label>Area / Wilayah *</label>
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="figma-input-group">
            <label>Alamat Lengkap *</label>
            <input
              type="text"
              placeholder="Contoh: Jl. Prof. Sudarto No. 12, Tembalang"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>

          <div className="figma-input-group">
            <label>Deskripsi Kos</label>
            <textarea
              rows={3}
              placeholder="Ceritakan keunggulan kosmu, akses kampus, lingkungan, dan aturan jam malam..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        {/* Step 3: Harga & Kamar */}
        <div className="post-kos-section-group">
          <label className="section-group-label">3. Harga & Tipe Kamar</label>

          <div className="figma-input-group">
            <label>Harga Sewa per Bulan (Rp) *</label>
            <input
              type="number"
              placeholder="Contoh: 1250000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            {form.price && (
              <span className="price-preview-hint">
                = {rupiah(Number(form.price))} / bulan
              </span>
            )}
          </div>

          <div className="form-two-cols">
            <div className="figma-input-group">
              <label>Tipe Kamar</label>
              <input
                type="text"
                placeholder="Kamar Standard AC"
                value={form.room_name}
                onChange={(e) => setForm({ ...form, room_name: e.target.value })}
              />
            </div>
            <div className="figma-input-group">
              <label>Ukuran Kamar</label>
              <input
                type="text"
                placeholder="3x4 m"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Step 4: Fasilitas */}
        <div className="post-kos-section-group">
          <label className="section-group-label">4. Fasilitas Tersedia</label>
          <p className="section-group-hint">Pilih fasilitas yang ada di kosmu:</p>

          <div className="facilities-checkbox-grid">
            {AVAILABLE_FACILITIES.map((fac) => {
              const active = form.facilities.includes(fac)
              return (
                <button
                  key={fac}
                  type="button"
                  className={`facility-check-chip ${active ? 'checked' : ''}`}
                  onClick={() => toggleFacility(fac)}
                >
                  <span className="checkbox-square">
                    {active ? '✓' : ''}
                  </span>
                  <span className="chip-label-text">{fac}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 5: Kontak Pemilik */}
        <div className="post-kos-section-group">
          <label className="section-group-label">5. Kontak Pemilik / Pengelola</label>

          <div className="form-two-cols">
            <div className="figma-input-group">
              <label>Nama Pemilik</label>
              <input
                type="text"
                placeholder="Pak Budi"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              />
            </div>
            <div className="figma-input-group">
              <label>No. WhatsApp</label>
              <input
                type="text"
                placeholder="081234567890"
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="figma-error-banner" style={{ margin: '12px 0' }}>
            <p>⚠ {errorMsg}</p>
          </div>
        )}

        <div className="form-action-row">
          <button
            type="button"
            className="btn-cancel-post"
            onClick={() => back ? back() : go('explore')}
            disabled={submitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="figma-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Memproses…' : 'Pasang Kos Sekarang'}
          </button>
        </div>
      </form>
    </div>
  )
}
