import { useState, useEffect } from 'react'
import { setToken, getToken, getUser, setUser, api } from './api'
import { Login, Home, Explore, Detail, Room, Favorites, Compare, Profile, PostKos } from './pages.jsx'
import { IconHome, IconSearch, IconHeart, IconCompare, IconUser } from './icons.jsx'

const TABS = [
  ['home', IconHome, 'Beranda'],
  ['explore', IconSearch, 'Jelajah'],
  ['favorites', IconHeart, 'Favorit'],
  ['compare', IconCompare, 'Bandingkan'],
  ['profile', IconUser, 'Profil']
]

const PAGES = {
  home: Home,
  explore: Explore,
  detail: Detail,
  room: Room,
  favorites: Favorites,
  compare: Compare,
  profile: Profile,
  postKos: PostKos
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken())
  const [currentUser, setCurrentUser] = useState(() => getUser())
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('kostara_user_avatar') || getUser()?.avatar || '')
  const [stack, setStack] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const kosId = params.get('kos')
      if (kosId) return [{ name: 'home' }, { name: 'detail', id: kosId }]
      const tabParam = params.get('tab')
      if (tabParam && ['home', 'explore', 'favorites', 'compare', 'profile'].includes(tabParam)) {
        return [{ name: tabParam }]
      }
    } catch {}
    return [{ name: 'home' }]
  })
  const [cmp, setCmp] = useState(() => JSON.parse(localStorage.getItem('kostara_cmp') || '[]'))
  const [toast, setToast] = useState('')
  const view = stack[stack.length - 1]

  // Auto-sync / refresh user profile from server in background on startup
  useEffect(() => {
    if (authed) {
      api.get('/auth/me').then((u) => {
        if (u) {
          setUser(u)
          setCurrentUser(u)
          if (u.avatar) {
            setUserAvatar(u.avatar)
            localStorage.setItem('kostara_user_avatar', u.avatar)
          }
        }
      }).catch(() => {})
    }
  }, [authed])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const go = (name, id, extra) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (name === 'detail' && id) {
      window.history.replaceState(null, '', `?kos=${id}`)
    }
    setStack((s) => [...s, { name, id, extra }])
  }
  const tab = (name) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.replaceState(null, '', window.location.pathname)
    setStack([{ name }])
  }
  const back = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStack((s) => {
      const nextStack = s.length > 1 ? s.slice(0, -1) : s
      const nextView = nextStack[nextStack.length - 1]
      if (nextView.name === 'detail' && nextView.id) {
        window.history.replaceState(null, '', `?kos=${nextView.id}`)
      } else {
        window.history.replaceState(null, '', window.location.pathname)
      }
      return nextStack
    })
  }
  const logout = () => {
    setToken(null)
    setUser(null)
    setCurrentUser(null)
    setUserAvatar('')
    setAuthed(false)
    tab('home')
  }

  const toggleCmp = (id) => {
    if (!cmp.includes(id) && cmp.length >= 3) return alert('Maksimal 3 kos untuk dibandingkan')
    const n = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp, id]
    setCmp(n)
    localStorage.setItem('kostara_cmp', JSON.stringify(n))
  }

  if (!authed) return <Login onAuth={() => setAuthed(true)} />

  const Page = PAGES[view.name]
  const active = stack.length === 1 ? view.name : ['detail', 'room'].includes(view.name) ? 'explore' : view.name

  return (
    <div className="figma-pwa-container">
      {/* Toast Notification */}
      {toast && (
        <div className="figma-toast-banner">
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header - Matching Figma Header */}
      <header className="figma-header">
        <div className="header-left">
          {stack.length > 1 ? (
            <button className="header-back-btn" onClick={(e) => { e.stopPropagation(); back(); }} aria-label="Kembali">
              ←
            </button>
          ) : (
            <div className="header-left-placeholder"></div>
          )}
        </div>

        <div className="header-center" onClick={() => tab('home')}>
          <div className="brand-title-figma">KOSTARA</div>
          <span className="brand-sub-figma">
            {view.name === 'home'
              ? 'Beranda'
              : view.name === 'explore'
              ? 'Jelajah'
              : view.name === 'favorites'
              ? 'Favorit'
              : view.name === 'compare'
              ? 'Bandingkan'
              : view.name === 'profile'
              ? 'Profil'
              : view.name === 'postKos'
              ? 'Pasang Kos'
              : view.name === 'room'
              ? 'Pilih Kamar'
              : 'Detail Kos'}
          </span>
        </div>

        <div className="header-actions">
          <div className="header-avatar" onClick={() => tab('profile')} title="Profil Akun">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="header-avatar-img" />
            ) : (
              <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className={`figma-main page-${view.name}`}>
        <Page
          key={view.name + (view.id || '')}
          {...{ go, back, tab, cmp, toggleCmp, logout, id: view.id, extra: view.extra, showToast, userAvatar, setUserAvatar, currentUser, setCurrentUser }}
        />
      </main>

      {/* Bottom Navigation Dock - Matching Figma Nav */}
      <nav className="figma-bottom-nav">
        {TABS.map(([n, Icon, lb]) => {
          const isActive = active === n
          return (
            <button
              key={n}
              className={`nav-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => tab(n)}
            >
              <div className="tab-icon-wrapper">
                <Icon active={isActive} size={20} />
                {n === 'compare' && cmp.length > 0 && <span className="tab-counter-badge">{cmp.length}</span>}
              </div>
              <span className="tab-label">{lb}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
