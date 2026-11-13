import { useEffect, useRef, useState } from 'react'
import './App.css'

const software = ['SOLIDWORKS', 'Inventor', 'CATIA', 'Fusion 360', 'Siemens NX', 'Onshape']
const AUTH_STORAGE_KEY = 'cad-agent-users'
const SESSION_STORAGE_KEY = 'cad-agent-session'
const sitePageDetails = {
  product: {
    nav: 'Product',
    eyebrow: 'PRODUCT',
    title: 'One workspace for better design decisions.',
    description: 'Bring model context, focused conversations, and reviewable next steps into one CAD workflow.',
    image: '/images/cad-engineering.jpg',
    imageAlt: 'Engineer reviewing technical drawings and a mechanical assembly.',
    imageCaption: 'DESIGN INTENT · MODEL REVIEW',
  },
  demo: {
    nav: 'Demo',
    eyebrow: 'INTERACTIVE DEMO',
    title: 'See a CAD conversation take shape.',
    description: 'Explore a sample workflow and see how CAD-Agent can help turn a clear question into a practical next step.',
    image: '/images/cad-suspension-detail.jpg',
    imageAlt: 'Close-up of a mechanical suspension assembly with precision components.',
    imageCaption: 'MECHANICAL SYSTEM · DETAIL',
  },
  plans: {
    nav: 'Plans',
    eyebrow: 'PLANS & AVAILABILITY',
    title: 'A plan for every stage of your workflow.',
    description: 'Explore the preview, see what is in development, and learn what we are planning for teams.',
    image: '/images/cad-factory-engineer.jpg',
    imageAlt: 'An engineer inspecting equipment on a manufacturing floor.',
    imageCaption: 'ENGINEERING · IN PROGRESS',
  },
  integrations: {
    nav: 'Integrations',
    eyebrow: 'CAD INTEGRATIONS',
    title: 'Designed around the tools you use.',
    description: 'See how CAD-Agent fits into existing design work. The current desktop bridge focuses on SolidWorks.',
    image: '/images/cad-field-automation.jpg',
    imageAlt: 'An autonomous field machine demonstrating real-world engineering automation.',
    imageCaption: 'DESIGNED FOR THE REAL WORLD',
  },
}

function readSitePage() {
  if (typeof window === 'undefined') return 'home'
  const page = window.location.pathname.replace(/\/+$/, '').split('/').pop()
  return Object.prototype.hasOwnProperty.call(sitePageDetails, page) ? page : 'home'
}

const examples = [
  {
    label: 'Part design',
    prompt: 'Create a compact mounting bracket with four M8 holes.',
    response: 'I can help plan the bracket geometry and review the feature steps before they are applied.',
    feature: 'Mounting bracket',
  },
  {
    label: 'Model review',
    prompt: 'Check this assembly for repeated components and naming issues.',
    response: 'I found a clear review path: group repeated parts, then standardize the component names.',
    feature: 'Assembly review',
  },
  {
    label: 'Drawing prep',
    prompt: 'Prepare a drawing checklist for this machined housing.',
    response: 'Start with the three principal views, then call out the bore, datum faces, and critical tolerances.',
    feature: 'Drawing checklist',
  },
]

const promptSuggestions = [
  {
    icon: 'cube',
    title: 'Plan a new part',
    detail: 'Start with purpose, dimensions, and constraints.',
    prompt: 'Help me plan a [part name]. Ask about its purpose, key dimensions, material, and manufacturing constraints before suggesting a feature sequence. Do not apply CAD changes.',
  },
  {
    icon: 'layers',
    title: 'Review a model',
    detail: 'Describe the model and what you want to understand.',
    prompt: 'Help me review a [part or assembly]. Ask me to describe its structure, then identify feature intent, important relationships, and questions to verify. Do not assume you can inspect files.',
  },
  {
    icon: 'ruler',
    title: 'Prepare a drawing',
    detail: 'Outline views, datums, dimensions, and tolerances.',
    prompt: 'Help me plan a manufacturing drawing for [part]. Ask about the required views, datums, critical dimensions, and tolerances before suggesting a checklist.',
  },
  {
    icon: 'sparkles',
    title: 'Explore a design issue',
    detail: 'Work through a constraint or design question.',
    prompt: 'Help me reason through [design issue]. Ask for the model context, constraints, and expected behavior. Suggest checks and options without making changes.',
  },
]

const initialProjects = [
  { id: 'housing', name: 'Precision Housing', type: 'Part design', updated: 'Today', state: 'In progress', color: 'blue' },
  { id: 'bracket', name: 'Mounting Bracket', type: 'Part design', updated: 'Yesterday', state: 'Ready to review', color: 'mint' },
  { id: 'assembly', name: 'Drive Assembly', type: 'Assembly', updated: 'Nov 8', state: 'In progress', color: 'purple' },
]

const recentFiles = [
  { name: 'Precision_Housing.SLDPRT', project: 'Precision Housing', kind: 'SOLIDWORKS Part', updated: 'Today, 10:42 AM', size: '2.4 MB' },
  { name: 'Mounting_Bracket.SLDPRT', project: 'Mounting Bracket', kind: 'SOLIDWORKS Part', updated: 'Yesterday, 3:18 PM', size: '1.1 MB' },
  { name: 'Drive_Assembly.SLDASM', project: 'Drive Assembly', kind: 'SOLIDWORKS Assembly', updated: 'Nov 8, 11:06 AM', size: '8.7 MB' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    diagonal: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m18 6-12 12" /><path d="M6 6l12 12" /></>,
    cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.7 8-4.7M12 12.2V21" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    play: <path d="m9 6 10 6-10 6V6Z" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    folder: <><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1 1.9-1.6 2.8-2.2-.5a8 8 0 0 1-1.7 1l-.5 2.2h-3.2l-.5-2.2a8 8 0 0 1-1.7-1l-2.2.5-1.6-2.8 1.1-1.9a8 8 0 0 1 0-2l-1.1-1.9 1.6-2.8 2.2.5a8 8 0 0 1 1.7-1l.5-2.2h3.2l.5 2.2a8 8 0 0 1 1.7 1l2.2-.5 1.6 2.8-1.1 1.9a8 8 0 0 1 0 2Z" /></>,
    ruler: <><path d="m3 7 4-4 14 14-4 4L3 7Z" /><path d="m8 8 2-2m2 6 2-2m2 6 2-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5M9 13h7m-7 4h7" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    chevronDown: <path d="m7 10 5 5 5-5" />,
  }

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function Brand({ footer = false, onClick }) {
  return (
    <a className={`brand ${footer ? 'brand-footer' : ''}`} href="/" aria-label="CAD-Agent home" onClick={onClick}>
      <img src="/cad-agent-logo.svg" alt="" />
      <span>CAD-Agent<small>DESIGN WORKSPACE</small></span>
    </a>
  )
}

function CadArtwork({ feature }) {
  const artworkId = feature.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className="cad-artwork" aria-label={`CAD model preview: ${feature}`} role="img">
      <div className="artwork-topline"><span><i /> CAD workspace</span><span>PART PREVIEW <b>·</b> MM</span></div>
      <svg className="part-model" viewBox="0 0 640 390" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${artworkId}-part-face`} x1="227" y1="83" x2="412" y2="302" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C5E6FF" />
            <stop offset=".48" stopColor="#7A9CE2" />
            <stop offset="1" stopColor="#465A92" />
          </linearGradient>
          <linearGradient id={`${artworkId}-part-side`} x1="405" y1="150" x2="477" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#536A9E" />
            <stop offset="1" stopColor="#27324F" />
          </linearGradient>
          <linearGradient id={`${artworkId}-part-top`} x1="281" y1="79" x2="448" y2="178" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D3EEFF" />
            <stop offset="1" stopColor="#718DCF" />
          </linearGradient>
          <radialGradient id={`${artworkId}-part-glow`} cx="0" cy="0" r="1" gradientTransform="matrix(0 168 -237 0 345 180)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#84BFFF" stopOpacity=".2" />
            <stop offset="1" stopColor="#84BFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="344" cy="190" rx="237" ry="168" fill={`url(#${artworkId}-part-glow)`} />
        <path d="M147 290h335M176 316h283M201 342h228" stroke="#8EA9DD" strokeOpacity=".13" />
        <path d="M217 158 356 88l143 72-142 77-140-79Z" fill={`url(#${artworkId}-part-top)`} stroke="#D8EEFF" strokeOpacity=".65" />
        <path d="m217 158 140 79v132l-140-81V158Z" fill={`url(#${artworkId}-part-face)`} stroke="#CBE6FF" strokeOpacity=".48" />
        <path d="m357 237 142-77v130l-142 79V237Z" fill={`url(#${artworkId}-part-side)`} stroke="#AAC8FF" strokeOpacity=".45" />
        <path d="m258 158 98-50 100 50-100 54-98-54Z" fill="#263754" stroke="#D4EBFF" strokeOpacity=".8" />
        <path d="m285 158 71-36 72 36-72 39-71-39Z" fill="#111A2A" stroke="#A8D9FF" strokeOpacity=".75" />
        <path d="M357 237v129m-140-81 140 81 142-79" stroke="#E0F1FF" strokeOpacity=".35" />
        <path d="m259 255 54 31v42l-54-31v-42Zm32-4 38 22v42l-38-22v-42Z" stroke="#E1F2FF" strokeOpacity=".5" />
        <path d="m388 267 74-40m-74 60 74-40m-74 60 74-40" stroke="#B6D1FF" strokeOpacity=".5" />
        <path d="M165 145h47m-47 0v-22m349 149h29m-29 0v22" stroke="#A2B8F3" strokeOpacity=".55" strokeDasharray="3 5" />
        <circle cx="165" cy="145" r="3" fill="#B5D9FF" />
        <circle cx="514" cy="272" r="3" fill="#B5D9FF" />
      </svg>
      <div className="artwork-label label-left"><span>01</span> FEATURE TREE</div>
      <div className="artwork-label label-right"><span>6</span> FEATURES</div>
      <div className="artwork-bottomline"><span><i /> Ready for review</span><span>CAD-Agent preview</span></div>
    </div>
  )
}

function App() {
  const [sitePage, setSitePage] = useState(readSitePage)
  const [view, setView] = useState(() => (
    readSitePage() === 'home' && typeof window !== 'undefined' && window.localStorage.getItem(SESSION_STORAGE_KEY) ? 'dashboard' : 'home'
  ))
  const [dashboardTab, setDashboardTab] = useState('overview')
  const [projectSearch, setProjectSearch] = useState('')
  const [projects, setProjects] = useState(initialProjects)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mode, setMode] = useState('live')
  const [exampleIndex, setExampleIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [activeUser, setActiveUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const saved = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })
  const composerRef = useRef(null)
  const noticeTimer = useRef(null)
  const example = examples[exampleIndex]

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  useEffect(() => {
    document.title = sitePage === 'home'
      ? 'CAD-Agent — A smarter workspace for CAD'
      : `${sitePageDetails[sitePage].nav} — CAD-Agent`
  }, [sitePage])

  useEffect(() => {
    function syncSitePage() {
      setSitePage(readSitePage())
      setView('home')
      setMobileMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('popstate', syncSitePage)
    return () => window.removeEventListener('popstate', syncSitePage)
  }, [])

  useEffect(() => {
    if (view !== 'home' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const elements = [...document.querySelectorAll(
      '.page-intro, .page-card, .section-heading, .feature-panel, .demo-heading, .demo-card, .integration-content, .integration-item, .plan-card, .trust-copy, .trust-points article, .final-cta',
    )]
    const revealVisibleElements = () => {
      elements.forEach((element) => {
        const bounds = element.getBoundingClientRect()
        if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
          element.classList.add('is-visible')
        }
      })
    }

    elements.forEach((element, index) => {
      element.classList.add('motion-reveal')
      element.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`)
    })
    window.addEventListener('scroll', revealVisibleElements, { passive: true })
    window.addEventListener('resize', revealVisibleElements)
    revealVisibleElements()

    return () => {
      window.removeEventListener('scroll', revealVisibleElements)
      window.removeEventListener('resize', revealVisibleElements)
      elements.forEach((element) => {
        element.classList.remove('motion-reveal', 'is-visible')
        element.style.removeProperty('--reveal-delay')
      })
    }
  }, [sitePage, view])

  function readUsers() {
    if (typeof window === 'undefined') return []
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!saved) return []

    try {
      return JSON.parse(saved)
    } catch {
      return []
    }
  }

  function saveUsers(users) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users))
  }

  function showNotice(message) {
    setNotice(message)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 3500)
  }

  function closeMenu() {
    setMobileMenuOpen(false)
  }

  function navigateToPage(event, page) {
    if (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
    }

    const path = page === 'home' ? '/' : `/${page}`
    if (window.location.pathname !== path) {
      window.history.pushState({ sitePage: page }, '', path)
    }
    setSitePage(page)
    setView('home')
    closeMenu()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function enterDashboard() {
    window.history.replaceState({ sitePage: 'home' }, '', '/')
    setSitePage('home')
    setView('dashboard')
    setDashboardTab('overview')
    closeMenu()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openAuth(mode = 'signin') {
    setAuthMode(mode)
    setAuthError('')
    setAuthForm({ name: '', email: '', password: '' })
    setAuthOpen(true)
  }

  function closeAuth() {
    setAuthOpen(false)
    setAuthError('')
    setAuthForm({ name: '', email: '', password: '' })
  }

  function handleAuthField(event) {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  function handleAuthSubmit(event) {
    event.preventDefault()

    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password.trim()

    if (!email || !password || (authMode === 'signup' && !authForm.name.trim())) {
      setAuthError('Please complete all required fields.')
      return
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.')
      return
    }

    const users = readUsers()

    if (authMode === 'signup') {
      const alreadyExists = users.some((user) => user.email === email)
      if (alreadyExists) {
        setAuthError('This email is already registered. Sign in instead.')
        return
      }

      const newUser = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name: authForm.name.trim(),
        email,
        password,
      }
      const nextUsers = [...users, newUser]
      saveUsers(nextUsers)
      setActiveUser({ name: newUser.name, email: newUser.email })
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ name: newUser.name, email: newUser.email }))
      enterDashboard()
      closeAuth()
      showNotice('Account created successfully. Welcome to CAD-Agent.')
      return
    }

    const existingUser = users.find((user) => user.email === email && user.password === password)
    if (!existingUser) {
      setAuthError('Invalid email or password. Try again or create an account.')
      return
    }

    setActiveUser({ name: existingUser.name, email: existingUser.email })
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ name: existingUser.name, email: existingUser.email }))
    enterDashboard()
    closeAuth()
    showNotice(`Welcome back, ${existingUser.name}.`)
  }

  function handleLogout() {
    setActiveUser(null)
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    setView('home')
    showNotice('You have been signed out.')
  }

  function createProject(event) {
    event.preventDefault()
    const name = newProjectName.trim()
    if (!name) return

    const project = {
      id: `${Date.now()}`,
      name,
      type: 'CAD project',
      updated: 'Just now',
      state: 'New project',
      color: 'blue',
    }
    setProjects((current) => [project, ...current])
    setNewProjectName('')
    setProjectFormOpen(false)
    setDashboardTab('projects')
    showNotice(`${name} was added to your projects.`)
  }

  function saveProfile(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    if (!name || !email) {
      showNotice('Enter your name and email address to save your profile.')
      return
    }

    const users = readUsers()
    const updatedUsers = users.map((user) => (
      user.email === activeUser.email ? { ...user, name, email } : user
    ))
    saveUsers(updatedUsers)
    const updatedUser = { name, email }
    setActiveUser(updatedUser)
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser))
    showNotice('Your profile was updated.')
  }

  function openProject(project) {
    startNewChat(`Help me continue the CAD project "${project.name}". Ask what I want to work on next. Do not apply CAD changes.`)
  }

  function startNewChat(prompt = '') {
    if (!activeUser) {
      openAuth('signin')
      return
    }

    setDraft(prompt)
    setView('new-chat')
    closeMenu()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function returnToHome() {
    navigateToPage(null, 'home')
  }

  function submitPrompt(event) {
    event.preventDefault()
    if (draft.trim()) showNotice('This preview does not send or store your prompt. Your text remains on this page.')
  }

  return (
    <div className={`site-shell ${view === 'new-chat' ? 'chat-view' : ''}`} id="top">
      {view !== 'dashboard' && <header className="site-header">
        <div className="header-inner">
          <Brand onClick={(event) => navigateToPage(event, 'home')} />
          {view === 'home' && (
            <>
              <button className="mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
              </button>
              <nav className={`site-nav ${mobileMenuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
                {Object.entries(sitePageDetails).map(([page, details]) => (
                  <a key={page} className={sitePage === page ? 'active' : ''} href={`/${page}`} aria-current={sitePage === page ? 'page' : undefined} onClick={(event) => navigateToPage(event, page)}>{details.nav}</a>
                ))}
                <button type="button" className="nav-signin" onClick={() => openAuth('signin')}>
                  {activeUser ? 'Account' : 'Sign in'}
                </button>
                <a className="mobile-nav-cta" href="/plans" onClick={(event) => navigateToPage(event, 'plans')}>Get started <Icon name="arrow" size={15} /></a>
              </nav>
            </>
          )}
          <button className="header-cta" onClick={view === 'home' ? () => (activeUser ? startNewChat() : openAuth('signup')) : returnToHome}>
            {view === 'home' ? (activeUser ? 'Open workspace' : 'Create account') : 'Back to website'} <Icon name="arrow" size={15} />
          </button>
        </div>
      </header>}

      {view === 'dashboard' ? (
        <main className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <Brand />
            <span className="sidebar-caption">WORKSPACE</span>
            <nav className="dashboard-nav" aria-label="Dashboard navigation">
              <button type="button" className={dashboardTab === 'overview' ? 'active' : ''} onClick={() => setDashboardTab('overview')}><Icon name="home" size={17} /> Overview</button>
              <button type="button" className={dashboardTab === 'projects' ? 'active' : ''} onClick={() => setDashboardTab('projects')}><Icon name="folder" size={17} /> Projects <span>{projects.length}</span></button>
              <button type="button" className={dashboardTab === 'files' ? 'active' : ''} onClick={() => setDashboardTab('files')}><Icon name="clock" size={17} /> Recent files</button>
            </nav>
            <div className="sidebar-divider" />
            <span className="sidebar-caption">PREFERENCES</span>
            <nav className="dashboard-nav">
              <button type="button" className={dashboardTab === 'settings' ? 'active' : ''} onClick={() => setDashboardTab('settings')}><Icon name="settings" size={17} /> Account settings</button>
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-user">
                <span className="user-avatar">{activeUser?.name?.slice(0, 1).toUpperCase() || 'U'}</span>
                <span><strong>{activeUser?.name || 'CAD Designer'}</strong><small>{activeUser?.email}</small></span>
              </div>
              <button type="button" className="sidebar-logout" onClick={handleLogout}><Icon name="logout" size={16} /> Sign out</button>
            </div>
          </aside>

          <section className="dashboard-main">
            <div className="dashboard-topbar">
              <label className="dashboard-search">
                <Icon name="search" size={17} />
                <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search projects and files" aria-label="Search projects and files" />
                <kbd>Ctrl K</kbd>
              </label>
              <button type="button" className="dashboard-profile" onClick={() => setDashboardTab('settings')}>
                <span className="user-avatar">{activeUser?.name?.slice(0, 1).toUpperCase() || 'U'}</span>
                <span><strong>{activeUser?.name || 'CAD Designer'}</strong><small>Personal workspace</small></span>
                <Icon name="chevronDown" size={15} />
              </button>
            </div>

            {dashboardTab === 'overview' && (
              <div className="dashboard-content">
                <div className="dashboard-heading">
                  <div><span className="section-kicker">YOUR WORKSPACE</span><h1>Good to see you, {activeUser?.name?.split(' ')[0] || 'Designer'}.</h1><p>Pick up where you left off or start a new CAD project.</p></div>
                  <button type="button" className="button-primary" onClick={() => { setProjectFormOpen(true); setDashboardTab('projects') }}><Icon name="plus" size={16} /> New project</button>
                </div>

                <div className="dashboard-metrics">
                  <article><span className="metric-icon"><Icon name="folder" size={17} /></span><span className="metric-label">Total projects</span><strong>{projects.length}</strong><small>In your workspace</small></article>
                  <article><span className="metric-icon mint"><Icon name="clock" size={17} /></span><span className="metric-label">Recent files</span><strong>{recentFiles.length}</strong><small>Ready to review</small></article>
                  <article><span className="metric-icon purple"><Icon name="check" size={17} /></span><span className="metric-label">Workspace status</span><strong className="metric-status">Ready</strong><small>Local preview</small></article>
                </div>

                <div className="dashboard-section-heading"><div><h2>Recent projects</h2><p>Continue working on your latest designs.</p></div><button type="button" className="dashboard-text-button" onClick={() => setDashboardTab('projects')}>View all <Icon name="arrow" size={14} /></button></div>
                <div className="dashboard-project-grid">
                  {projects.slice(0, 3).map((project) => (
                    <button className="dashboard-project-card" type="button" key={project.id} onClick={() => openProject(project)}>
                      <span className={`project-thumbnail ${project.color}`}><Icon name="cube" size={27} /><i /><i /><i /></span>
                      <span className="project-card-body"><strong>{project.name}</strong><small>{project.type}</small><span><i /> {project.state}<small>{project.updated}</small></span></span>
                    </button>
                  ))}
                </div>

                <div className="dashboard-section-heading recent-files-heading"><div><h2>Recent files</h2><p>Your latest CAD documents.</p></div><button type="button" className="dashboard-text-button" onClick={() => setDashboardTab('files')}>Browse files <Icon name="arrow" size={14} /></button></div>
                <div className="dashboard-file-list">
                  {recentFiles.slice(0, 3).map((file) => (
                    <button type="button" className="dashboard-file-row" key={file.name} onClick={() => showNotice('This preview does not open or store CAD files.')}>
                      <span className="file-icon"><Icon name="file" size={17} /></span><span className="file-main"><strong>{file.name}</strong><small>{file.project}</small></span><span className="file-kind">{file.kind}</span><span className="file-updated">{file.updated}</span><Icon name="chevron" size={15} />
                    </button>
                  ))}
                </div>
                <p className="dashboard-disclaimer"><Icon name="lock" size={13} /> Sample projects and files are illustrative only. This website does not load or edit CAD files.</p>
              </div>
            )}

            {dashboardTab === 'projects' && (
              <div className="dashboard-content">
                <div className="dashboard-heading">
                  <div><span className="section-kicker">YOUR WORKSPACE</span><h1>Projects</h1><p>Organize your CAD designs and continue your workflow.</p></div>
                  <button type="button" className="button-primary" onClick={() => setProjectFormOpen((open) => !open)}><Icon name="plus" size={16} /> New project</button>
                </div>
                {projectFormOpen && (
                  <form className="new-project-form" onSubmit={createProject}>
                    <label htmlFor="project-name">Project name</label>
                    <input id="project-name" autoFocus value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="e.g. Gearbox redesign" />
                    <button type="submit" className="button-primary" disabled={!newProjectName.trim()}>Create project</button>
                    <button type="button" className="project-cancel" onClick={() => setProjectFormOpen(false)}>Cancel</button>
                  </form>
                )}
                <div className="dashboard-project-grid dashboard-project-grid-all">
                  {projects.filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase())).map((project) => (
                    <button className="dashboard-project-card" type="button" key={project.id} onClick={() => openProject(project)}>
                      <span className={`project-thumbnail ${project.color}`}><Icon name="cube" size={27} /><i /><i /><i /></span>
                      <span className="project-card-body"><strong>{project.name}</strong><small>{project.type}</small><span><i /> {project.state}<small>{project.updated}</small></span></span>
                    </button>
                  ))}
                </div>
                {projects.filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 && <p className="dashboard-empty">No projects match “{projectSearch}”.</p>}
              </div>
            )}

            {dashboardTab === 'files' && (
              <div className="dashboard-content">
                <div className="dashboard-heading"><div><span className="section-kicker">YOUR WORKSPACE</span><h1>Recent files</h1><p>Quick access to the CAD documents in your recent workflow.</p></div></div>
                <div className="dashboard-file-list dashboard-file-list-full">
                  {recentFiles.filter((file) => `${file.name} ${file.project}`.toLowerCase().includes(projectSearch.toLowerCase())).map((file) => (
                    <button type="button" className="dashboard-file-row" key={file.name} onClick={() => showNotice('This preview does not open or store CAD files.')}>
                      <span className="file-icon"><Icon name="file" size={17} /></span><span className="file-main"><strong>{file.name}</strong><small>{file.project}</small></span><span className="file-kind">{file.kind}</span><span className="file-updated">{file.updated}</span><span className="file-size">{file.size}</span><Icon name="chevron" size={15} />
                    </button>
                  ))}
                </div>
                {recentFiles.filter((file) => `${file.name} ${file.project}`.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 && <p className="dashboard-empty">No files match “{projectSearch}”.</p>}
                <p className="dashboard-disclaimer"><Icon name="lock" size={13} /> Files shown here are sample data and are not stored or opened by this preview.</p>
              </div>
            )}

            {dashboardTab === 'settings' && (
              <div className="dashboard-content">
                <div className="dashboard-heading"><div><span className="section-kicker">PREFERENCES</span><h1>Account settings</h1><p>Manage your profile details for this local preview.</p></div></div>
                <form className="settings-card" onSubmit={saveProfile}>
                  <div className="settings-card-heading"><span className="user-avatar large">{activeUser?.name?.slice(0, 1).toUpperCase() || 'U'}</span><div><h2>Profile information</h2><p>Update the name and email shown in your workspace.</p></div></div>
                  <label>Full name<input name="name" type="text" defaultValue={activeUser?.name || ''} autoComplete="name" /></label>
                  <label>Email address<input name="email" type="email" defaultValue={activeUser?.email || ''} autoComplete="email" /></label>
                  <div className="settings-save-row"><span><Icon name="lock" size={13} /> Saved in this browser only</span><button type="submit" className="button-primary">Save changes</button></div>
                </form>
                <div className="settings-notice"><strong>Local demo account</strong><p>This sign-in is only a browser preview. Do not use a real password or sensitive information. Production authentication requires a secure server.</p></div>
              </div>
            )}
          </section>
        </main>
      ) : view === 'home' ? <main>
        {sitePage !== 'home' && (
          <section className="page-intro" aria-labelledby="page-title">
            <div className="page-intro-copy">
              <span className="section-kicker"><span className="kicker-line" /> {sitePageDetails[sitePage].eyebrow}</span>
              <h1 id="page-title">{sitePageDetails[sitePage].title}</h1>
              <p>{sitePageDetails[sitePage].description}</p>
            </div>
            <figure className="page-intro-visual">
              <img src={sitePageDetails[sitePage].image} alt={sitePageDetails[sitePage].imageAlt} fetchPriority="high" />
              <figcaption>{sitePageDetails[sitePage].imageCaption}</figcaption>
            </figure>
          </section>
        )}

        {sitePage === 'home' && <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><span className="kicker-line" /> A smarter workspace for CAD</span>
              <h1 id="hero-title">Make room for<br />better <span>design.</span></h1>
              <p>Bring your CAD work and AI tools together. Explore designs, understand complex models, and move from idea to next step with confidence.</p>
              <div className="hero-actions">
                {activeUser ? (
                  <>
                    <button className="button-primary" onClick={() => startNewChat()}>Open workspace <Icon name="arrow" size={16} /></button>
                    <button className="button-quiet" type="button" onClick={handleLogout}><span className="play-icon"><Icon name="lock" size={13} /></span> Sign out</button>
                  </>
                ) : (
                  <>
                    <button className="button-primary" onClick={() => openAuth('signup')}>Create account <Icon name="arrow" size={16} /></button>
                    <button className="button-quiet" type="button" onClick={() => openAuth('signin')}><span className="play-icon"><Icon name="play" size={13} /></span> Sign in</button>
                  </>
                )}
              </div>
              <div className="hero-note"><Icon name="lock" size={14} /> {activeUser ? `Signed in as ${activeUser.name}` : 'Local-first design preview · No account required'}</div>
            </div>

            <div className="hero-visual">
              <div className="hero-photo-frame">
                <img className="hero-photo-image" src="/images/cad-factory-engineer.jpg" alt="Engineer inspecting industrial equipment on a manufacturing floor." fetchPriority="high" />
                <span className="hero-photo-tag"><i /> ENGINEERING · IN FOCUS</span>
                <span className="hero-photo-caption">Thoughtful design, ready for the real world.</span>
              </div>
              <div className="hero-cad-preview">
                <div className="hero-cad-preview-heading"><img src="/cad-agent-logo.svg" alt="" /><span><strong>CAD-Agent preview</strong><small>Model context · Ready to review</small></span><i /></div>
                <CadArtwork feature="precision housing" />
              </div>
              <div className="floating-card floating-card-top"><span className="floating-icon"><Icon name="sparkles" size={16} /></span><span><strong>Design context</strong><small>Stay focused on your model</small></span><i /></div>
              <div className="floating-card floating-card-bottom"><span className="check-mark"><Icon name="check" size={14} /></span><span><strong>Review before action</strong><small>Your work stays in your hands</small></span></div>
            </div>
          </div>
          <div className="software-strip">
            <span>CAD PLATFORMS DESIGNERS WORK WITH</span>
            <div>{software.map((item) => <span className="software-name" key={item}>{item}</span>)}</div>
          </div>
          <div className="hero-disclaimer">CAD-Agent is an independent product. Its current desktop bridge focuses on SolidWorks; other platform names are examples only.</div>
          {activeUser && (
            <div className="account-summary">
              <div className="account-summary-card">
                <div>
                  <span className="summary-label">SIGNED IN</span>
                  <strong>{activeUser.name}</strong>
                  <small>{activeUser.email}</small>
                </div>
                <button type="button" className="button-primary" onClick={() => startNewChat()}>Continue to workspace</button>
              </div>
            </div>
          )}
        </section>}

        {sitePage === 'home' && (
          <section className="section page-directory" aria-labelledby="page-directory-title">
            <div className="section-heading">
              <span className="section-kicker">EXPLORE CAD-AGENT</span>
              <h2 id="page-directory-title">Everything you need,<br /><span>one page at a time.</span></h2>
              <p>Choose an area to explore. Each section has its own focused page.</p>
            </div>
            <div className="page-card-grid">
              {Object.entries(sitePageDetails).map(([page, details]) => (
                <a className="page-card" href={`/${page}`} key={page} onClick={(event) => navigateToPage(event, page)}>
                  <span className="page-card-image">
                    <img src={details.image} alt="" loading="lazy" decoding="async" />
                    <span className="page-card-icon"><Icon name={{ product: 'layers', demo: 'play', plans: 'check', integrations: 'cube' }[page]} size={17} /></span>
                  </span>
                  <span><strong>{details.nav}</strong><small>{details.description}</small></span>
                  <Icon name="arrow" size={16} />
                </a>
              ))}
            </div>
          </section>
        )}

        {sitePage === 'product' && <section className="section feature-section" id="product">
          <div className="section-heading">
            <span className="section-kicker">WHAT YOU CAN DO</span>
            <h2>One workspace.<br /><span>More ways to move forward.</span></h2>
            <p>Keep the details of your design close while you think, review, and plan the work ahead.</p>
          </div>
          <div className="mode-tabs" role="tablist" aria-label="CAD-Agent workspace modes">
            <button role="tab" aria-selected={mode === 'live'} className={mode === 'live' ? 'selected' : ''} onClick={() => setMode('live')}><span className="tab-dot" /> Live workspace</button>
            <button role="tab" aria-selected={mode === 'background'} className={mode === 'background' ? 'selected' : ''} onClick={() => setMode('background')}><Icon name="sparkles" size={15} /> Background tasks</button>
          </div>
          <div className="feature-panel">
            <div className="feature-panel-copy">
              <span className="feature-number">{mode === 'live' ? '01 / LIVE' : '02 / BACKGROUND'}</span>
              <h3>{mode === 'live' ? 'Think through a design, together.' : 'Make space for the longer jobs.'}</h3>
              <p>{mode === 'live' ? 'Ask questions about a model, outline a feature plan, or explore the next design change in a focused workspace.' : 'Break a bigger CAD workflow into clear steps. Prepare your review while you stay in control of what happens next.'}</p>
              <ul>
                {(mode === 'live'
                  ? ['Keep model context close', 'Review suggested steps', 'Confirm changes before they happen']
                  : ['Organize multi-step work', 'Track a task from start to finish', 'Review results before using them']
                ).map((item) => <li key={item}><Icon name="check" size={15} />{item}</li>)}
              </ul>
              <a className="text-link" href="/demo" onClick={(event) => navigateToPage(event, 'demo')}>Explore the workspace <Icon name="arrow" size={15} /></a>
            </div>
            <div className="feature-panel-visual">
              <div className="mini-window">
                <div className="mini-window-bar"><span><i /><i /><i /></span><small>{mode === 'live' ? 'CAD-Agent · New workspace' : 'CAD-Agent · Task overview'}</small><span className="mini-status">LOCAL PREVIEW</span></div>
                <div className="mini-window-body">
                  <div className="mini-sidebar"><img src="/cad-agent-logo.svg" alt="" /><span className="mini-side-active"><Icon name="plus" size={14} /></span><span><Icon name="layers" size={14} /></span><span><Icon name="sparkles" size={14} /></span></div>
                  <div className="mini-chat">
                    <div className="mini-chat-heading">{mode === 'live' ? 'A new design conversation' : 'Your task checklist'}<small>{mode === 'live' ? 'CAD workspace' : '3 steps · ready to review'}</small></div>
                    <div className="chat-bubble user-bubble">{mode === 'live' ? 'Help me review the mounting points on this part.' : 'Prepare a review plan for the bracket drawing.'}</div>
                    <div className="chat-bubble assistant-bubble"><span className="assistant-mark"><Icon name="sparkles" size={13} /></span>{mode === 'live' ? 'Let’s check the hole spacing, edge clearance, and the intended mounting face.' : 'I’ve arranged the checks into a short list. Review each item before applying any changes.'}</div>
                    <div className="mini-input">Ask about your design <span>↑</span></div>
                  </div>
                </div>
              </div>
              <div className="visual-caption"><span><i /> Example interface</span><span>Actions require your review</span></div>
            </div>
          </div>
        </section>}

        {sitePage === 'demo' && <section className="section demo-section" id="demo">
          <div className="demo-heading">
            <div><span className="section-kicker">A CLOSER LOOK</span><h2>From a clear question<br />to a clearer next step.</h2></div>
            <p>See how CAD-Agent can help structure a CAD conversation. This interactive sample is a visual preview, not a live AI connection.</p>
          </div>
          <div className="demo-card">
            <div className="demo-picker" role="tablist" aria-label="Example CAD workflows">
              {examples.map((item, index) => <button key={item.label} role="tab" aria-selected={exampleIndex === index} className={exampleIndex === index ? 'active' : ''} onClick={() => setExampleIndex(index)}><span>0{index + 1}</span>{item.label}</button>)}
            </div>
            <div className="demo-conversation">
              <div className="demo-conversation-top"><span><img src="/cad-agent-logo.svg" alt="" /> CAD-Agent workspace</span><span className="demo-local-tag"><Icon name="lock" size={12} /> UI PREVIEW</span></div>
              <div className="demo-stage">
                <div className="demo-model"><CadArtwork feature={example.feature.toLowerCase()} /></div>
                <div className="demo-dialogue">
                  <div className="demo-message user-message">{example.prompt}</div>
                  <div className="demo-assistant-message"><span className="assistant-mark"><Icon name="sparkles" size={14} /></span><div><strong>CAD-Agent</strong><p>{example.response}</p><small><Icon name="check" size={13} /> Review the plan before applying</small></div></div>
                  <div className="demo-composer">Describe what you want to explore…<span><Icon name="plus" size={14} /></span></div>
                </div>
              </div>
              <div className="demo-footer"><span><i /> {example.feature}</span><span>Illustrative interface · No CAD commands are run</span></div>
            </div>
          </div>
        </section>}

        {sitePage === 'integrations' && <section className="integration-section" id="integrations">
          <div className="integration-content">
            <div><span className="section-kicker">DESIGNED AROUND CAD WORK</span><h2>Fits into the way<br />you already design.</h2></div>
            <div className="integration-copy"><p>The current CAD-Agent desktop bridge focuses on SolidWorks. Other platform names below are examples of tools designers use—not active integrations in this website preview.</p><a className="text-link" href="/demo" onClick={(event) => navigateToPage(event, 'demo')}>See what’s in preview <Icon name="arrow" size={15} /></a></div>
          </div>
          <div className="integration-list">{software.map((item, index) => <div className="integration-item" key={item}><span className={`integration-symbol symbol-${index}`}><Icon name={['cube', 'layers', 'ruler', 'sparkles', 'file', 'diagonal'][index]} size={19} /></span><span>{item}</span><span className="integration-arrow"><Icon name="diagonal" size={14} /></span></div>)}</div>
          <p className="integration-footnote"><Icon name="lock" size={13} /> This website is a local UI preview and is not connected to any CAD software.</p>
        </section>}

        {sitePage === 'plans' && <section className="section plans-section" id="plans">
          <div className="plans-heading">
            <span className="section-kicker">PLANS & AVAILABILITY</span>
            <h2>Designed to grow<br /><span>with your workflow.</span></h2>
            <p>We’re shaping CAD-Agent for individuals and teams. Plan details will be shared as the product develops.</p>
          </div>
          <div className="plan-cards">
            <article className="plan-card">
              <span className="plan-label">01 · PERSONAL</span><h3>For exploring</h3><p>A place to try the CAD-Agent experience and discover what fits your work.</p>
              <div className="plan-status">Preview <span>Local UI</span></div>
              <ul><li><Icon name="check" size={15} /> CAD workspace concept</li><li><Icon name="check" size={15} /> Example workflows</li><li><Icon name="check" size={15} /> No sign-in in this preview</li></ul>
              <a className="plan-link" href="/demo" onClick={(event) => navigateToPage(event, 'demo')}>View the experience <Icon name="arrow" size={15} /></a>
            </article>
            <article className="plan-card plan-card-featured">
              <span className="plan-label">02 · PROFESSIONAL <span className="plan-badge">IN DEVELOPMENT</span></span><h3>For daily design work</h3><p>A focused assistant for the models, reviews, and repetitive tasks in your day.</p>
              <div className="plan-status">Coming soon <span>Details to come</span></div>
              <ul><li><Icon name="check" size={15} /> AI provider options</li><li><Icon name="check" size={15} /> Local CAD workflow</li><li><Icon name="check" size={15} /> Review before action</li></ul>
              <button className="plan-link" onClick={() => showNotice('Plan details are not available in this local UI preview.')}>Plan details <Icon name="arrow" size={15} /></button>
            </article>
            <article className="plan-card">
              <span className="plan-label">03 · TEAMS</span><h3>For shared workflows</h3><p>Explore how a consistent CAD workflow can support collaboration across a team.</p>
              <div className="plan-status">In planning <span>Stay tuned</span></div>
              <ul><li><Icon name="check" size={15} /> Team workflow concepts</li><li><Icon name="check" size={15} /> Shared review practices</li><li><Icon name="check" size={15} /> No commitment required</li></ul>
              <a className="plan-link" href="/" onClick={(event) => navigateToPage(event, 'home')}>Explore CAD-Agent <Icon name="arrow" size={15} /></a>
            </article>
          </div>
          <p className="plan-footnote">Plan names and features shown here are for illustration. This preview does not accept payments or sign-ups.</p>
        </section>}

        {sitePage === 'product' && <section className="trust-section">
          <div className="trust-copy"><span className="section-kicker">BUILT AROUND YOUR PROCESS</span><h2>Your model.<br /><span>Your decisions.</span></h2><p>CAD-Agent is designed to keep you in control. Explore ideas, inspect suggested steps, and decide what belongs in your CAD workflow.</p><a className="button-outline" href="#get-started">Explore the preview <Icon name="arrow" size={15} /></a></div>
          <div className="trust-points">
            <article><span className="trust-icon"><Icon name="lock" size={19} /></span><div><h3>Local-first by design</h3><p>This website preview does not send prompts, files, or model data to an AI service.</p></div></article>
            <article><span className="trust-icon"><Icon name="check" size={19} /></span><div><h3>Review stays with you</h3><p>CAD actions should be clear, inspectable, and confirmed by the person doing the work.</p></div></article>
            <article><span className="trust-icon"><Icon name="layers" size={19} /></span><div><h3>Made for real workflows</h3><p>Bring design context, model review, and the next step into one focused space.</p></div></article>
          </div>
        </section>}

        {sitePage !== 'home' && <section className="final-cta" id="get-started">
          <div className="cta-orbit orbit-one" /><div className="cta-orbit orbit-two" />
          <div className="cta-content"><span className="section-kicker">YOUR NEXT DESIGN STARTS HERE</span><h2>Let’s make your CAD workflow<br /><span>a little clearer.</span></h2><p>Take a look around the CAD-Agent preview and imagine what you could build next.</p><button className="button-primary" onClick={() => startNewChat()}>Create a new chat <Icon name="arrow" size={16} /></button></div>
          <div className="cta-mark"><img src="/cad-agent-logo.svg" alt="" /></div>
        </section>}
      </main> : (
        <main className="new-chat-page">
          <section className="new-chat-content" aria-labelledby="new-chat-title">
            <button className="back-link" onClick={returnToHome}><Icon name="chevron" size={15} /> Back to CAD-Agent</button>
            <span className="section-kicker"><span className="chat-status-dot" /> NEW CONVERSATION · LOCAL PREVIEW</span>
            <h1 id="new-chat-title">What are you<br /><span>working on?</span></h1>
            <p className="new-chat-description">Choose a starting point or write your own prompt. You can edit any suggestion before using it.</p>
            <div className="prompt-suggestion-grid" aria-label="Suggested CAD prompts">
              {promptSuggestions.map((item) => (
                <button className="prompt-suggestion" key={item.title} onClick={() => { setDraft(item.prompt); composerRef.current?.focus() }}>
                  <span className={`prompt-icon ${item.icon}`}><Icon name={item.icon} size={17} /></span>
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <Icon name="chevron" size={15} />
                </button>
              ))}
            </div>
            <form className="new-chat-composer" onSubmit={submitPrompt}>
              <label className="sr-only" htmlFor="new-chat-prompt">Write a prompt for your new CAD chat</label>
              <textarea
                id="new-chat-prompt"
                ref={composerRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Describe what you want to design, understand, or plan…"
                rows={4}
              />
              <div className="new-chat-composer-footer">
                <span><Icon name="lock" size={13} /> Prompt stays in this page</span>
                <button className="button-primary" type="submit" disabled={!draft.trim()}>Start chat <Icon name="arrow" size={15} /></button>
              </div>
            </form>
            <p className="new-chat-disclaimer">Local UI preview · AI, file uploads, and CAD connections are not enabled. Submitting will not send or save your prompt.</p>
          </section>
        </main>
      )}

      {view === 'home' && <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Brand footer onClick={(event) => navigateToPage(event, 'home')} /><p>A thoughtful workspace for your next CAD idea.</p><span className="footer-preview"><Icon name="lock" size={13} /> Local UI preview</span></div>
          <div className="footer-column"><strong>Explore</strong><a href="/product" onClick={(event) => navigateToPage(event, 'product')}>Product</a><a href="/demo" onClick={(event) => navigateToPage(event, 'demo')}>Demo</a><a href="/plans" onClick={(event) => navigateToPage(event, 'plans')}>Plans</a></div>
          <div className="footer-column"><strong>Workspace</strong><a href="/integrations" onClick={(event) => navigateToPage(event, 'integrations')}>Integrations</a><a href="/plans" onClick={(event) => navigateToPage(event, 'plans')}>Get started</a><a href="/" onClick={(event) => navigateToPage(event, 'home')}>Back to top</a></div>
          <div className="footer-note"><span className="section-kicker">A NOTE ABOUT THIS SITE</span><p>This is a visual website preview. AI connections, file uploads, sign-in, and live CAD control are not enabled.</p></div>
        </div>
        <div className="footer-bottom"><span>© CAD-Agent</span><span>Independent product · CAD platform names belong to their respective owners</span></div>
      </footer>}
      {authOpen && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="auth-panel">
            <button type="button" className="auth-close" onClick={closeAuth} aria-label="Close sign-in panel"><Icon name="close" size={14} /></button>
            <div className="auth-header">
              <img src="/cad-agent-logo.svg" alt="" />
              <div>
                <span className="section-kicker">CAD-Agent</span>
                <h2 id="auth-title">{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              </div>
            </div>
            <div className="auth-switch" role="tablist" aria-label="Sign in options">
              <button type="button" className={authMode === 'signin' ? 'selected' : ''} onClick={() => { setAuthMode('signin'); setAuthError('') }}>Sign in</button>
              <button type="button" className={authMode === 'signup' ? 'selected' : ''} onClick={() => { setAuthMode('signup'); setAuthError('') }}>Create account</button>
            </div>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <label>
                  <span>Full name</span>
                  <input name="name" type="text" value={authForm.name} onChange={handleAuthField} placeholder="Your name" autoComplete="name" />
                </label>
              )}
              <label>
                <span>Email address</span>
                <input name="email" type="email" value={authForm.email} onChange={handleAuthField} placeholder="name@company.com" autoComplete="email" />
              </label>
              <label>
                <span>Password</span>
                <input name="password" type="password" value={authForm.password} onChange={handleAuthField} placeholder="At least 6 characters" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} />
              </label>
              {authError && <p className="auth-error">{authError}</p>}
              <button type="submit" className="button-primary auth-submit">
                {authMode === 'signin' ? 'Sign in' : 'Create account'} <Icon name="arrow" size={15} />
              </button>
            </form>
            <p className="auth-footnote">This demo uses local browser storage for sign in and account creation.</p>
          </div>
        </div>
      )}
      {notice && <div className="site-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={14} /></button></div>}
    </div>
  )
}

export default App
