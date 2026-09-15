import { hasClientId } from '../lib/googleAuth'

type Props = {
  onSignIn: () => void
  error?: string | null
  pending?: boolean
}

export default function SignIn({ onSignIn, error, pending }: Props) {
  return (
    <div className="sign-in">
      <div className="sign-in__card">
        <h1>Your planner</h1>
        <p>Connect Google Calendar and Google Tasks to pull in your schedule and priorities.</p>
        {!hasClientId() && (
          <p className="sign-in__warning">
            No Google client ID configured yet. Add <code>VITE_GOOGLE_CLIENT_ID</code> to{' '}
            <code>.env.local</code> — see the README for setup steps.
          </p>
        )}
        <button type="button" onClick={onSignIn} disabled={pending || !hasClientId()}>
          {pending ? 'Connecting…' : 'Connect Google'}
        </button>
        {error && <p className="sign-in__error">{error}</p>}
      </div>
    </div>
  )
}
