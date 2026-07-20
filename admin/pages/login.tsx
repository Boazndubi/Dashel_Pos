"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import styles from "@/styles/Login.module.css"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.replace("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginShell}>
      {/* Left signature illustration panel */}
      <div className={styles.loginVisual} aria-hidden="true">
        <div className={styles.brandMark}>
          Dashel<span>POS</span>
        </div>
        <div className={styles.brandSub}>System Administration</div>

        <div className={styles.heroWrap}>
          <svg viewBox="0 0 440 500" width="100%" role="img">
            <defs>
              <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0ad72" />
                <stop offset="100%" stopColor="#a9713c" />
              </linearGradient>
            </defs>

            {/* ground shadow */}
            <ellipse cx="220" cy="463" rx="122" ry="12" fill="rgba(0,0,0,0.4)" />

            {/* stand */}
            <rect x="200" y="398" width="40" height="55" rx="6" fill="#3a2f20" />

            {/* terminal body */}
            <rect
              x="95" y="130" width="250" height="270" rx="28"
              fill="#241d16" stroke="#c48a4e" strokeOpacity="0.45" strokeWidth="2"
            />

            {/* speaker slot */}
            <rect x="195" y="144" width="50" height="6" rx="3" fill="#3a2f20" />

            {/* screen */}
            <rect
              x="120" y="170" width="200" height="140" rx="16"
              fill="#2e2417" stroke="rgba(196,138,78,0.25)"
            />

            {/* checkmark, draws in on load */}
            <path
              className={styles.checkPath}
              d="M155 235 L185 265 L245 205"
              fill="none" stroke="#7fae8e" strokeWidth="9"
              strokeLinecap="round" strokeLinejoin="round"
              pathLength="100"
            />
            <text
              className={styles.approvedText}
              x="220" y="293" textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace" fontSize="13"
              fill="#a89e8c" letterSpacing="3"
            >
              APPROVED
            </text>

            {/* keypad dots */}
            <circle cx="180" cy="345" r="6" fill="rgba(196,138,78,0.35)" />
            <circle cx="220" cy="345" r="6" fill="rgba(196,138,78,0.35)" />
            <circle cx="260" cy="345" r="6" fill="rgba(196,138,78,0.35)" />

            {/* printer slot */}
            <rect x="110" y="126" width="90" height="10" rx="3" fill="#150f0a" />

            {/* receipt curling out, rises in on load */}
            <g className={styles.receiptGroup}>
              <g transform="rotate(-5 155 90)">
                <path
                  d="M112,126 L112,58 L122,66 L131,52 L140,64 L149,52 L158,64 L167,52 L176,64 L185,52 L194,64 L198,58 L198,126 Z"
                  fill="#f2ecdd" stroke="#d9cdb2" strokeWidth="1"
                />
                <line x1="122" y1="80" x2="188" y2="80" stroke="#857a63" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
                <line x1="122" y1="93" x2="188" y2="93" stroke="#857a63" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
                <line x1="122" y1="106" x2="178" y2="106" stroke="#857a63" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
              </g>
            </g>

            {/* tapping card + NFC waves */}
            <g transform="translate(300,92) rotate(14)">
              <rect x="-40" y="-25" width="80" height="52" rx="8" fill="url(#cardGrad)" />
              <rect x="-32" y="-14" width="18" height="13" rx="3" fill="rgba(255,255,255,0.55)" />
              <rect x="-32" y="10" width="60" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
            </g>
            <g transform="rotate(-45 266 146)">
              <circle className={styles.arcOuter} cx="266" cy="146" r="34" fill="none" stroke="#c48a4e" strokeWidth="3" pathLength="100" strokeDasharray="28 72" strokeLinecap="round" />
              <circle className={styles.arcMid} cx="266" cy="146" r="24" fill="none" stroke="#c48a4e" strokeWidth="3" pathLength="100" strokeDasharray="28 72" strokeLinecap="round" />
              <circle className={styles.arcInner} cx="266" cy="146" r="14" fill="none" stroke="#c48a4e" strokeWidth="3" pathLength="100" strokeDasharray="28 72" strokeLinecap="round" />
            </g>

            {/* coins */}
            <g transform="translate(150,453)">
              <circle r="12" fill="#c48a4e" />
              <circle r="8" fill="none" stroke="#8a5f30" strokeWidth="1.5" />
            </g>
            <g transform="translate(170,461)">
              <circle r="9" fill="#a9713c" />
              <circle r="6" fill="none" stroke="#6f5327" strokeWidth="1.2" />
            </g>
          </svg>
        </div>

        <p className={styles.visualCaption}>
          <strong>One dashboard</strong> for every till — sales, stock, orders
          and reports, synced in real time.
        </p>
      </div>

      {/* Right login form panel */}
      <div className={styles.loginFormPanel}>
        <div className={styles.loginFormCard}>
          <div className={styles.formHeading}>Welcome back</div>
          <p className={styles.formSub}>Sign in to the Dashel POS admin console.</p>

          {error && (
            <div role="alert" className={`${styles.errorBox} px-4 py-3 rounded-lg mb-4 text-sm`}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className={styles.fieldLabel}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={styles.fieldInput}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className={styles.fieldLabel} style={{ marginBottom: 0 }}>
                  Password
                </label>
                <a href="/forgot-password" className={`${styles.forgotLink} text-xs`}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={styles.fieldInput}
                  style={{ paddingRight: "2.75rem" }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={`${styles.eyeToggle} absolute right-3 top-1/2 -translate-y-1/2`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading && <span className={`${styles.spinner} animate-spin`} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}