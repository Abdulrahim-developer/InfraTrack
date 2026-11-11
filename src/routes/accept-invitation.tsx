import { useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { validateUserInvitation } from '#/features/users/server/validate-user-invitation'
import { acceptUserInvitation } from '#/features/users/server/accept-user-invitation'

export const Route = createFileRoute('/accept-invitation')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkInvitation() {
      if (!token) {
        setError('Invitation token is missing.')
        setLoading(false)
        return
      }

      try {
        const result = await validateUserInvitation({
          data: { token },
        })

        if (cancelled) return

        if (!result.valid) {
          setError(result.message)
          return
        }

        setEmail(result.email)
        setRole(result.role)
        setValid(true)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to validate invitation.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void checkInvitation()

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Invitation token is missing.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await acceptUserInvitation({
        data: {
          token,
          fullName,
          password,
          confirmPassword,
        },
      })

      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
            I
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {success ? 'Invitation Accepted!' : 'Create Your Account'}
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {success
              ? 'Your InfraTrack account has been created successfully.'
              : 'Complete your account setup to join InfraTrack.'}
          </p>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Validating your invitation...
          </p>
        ) : success ? (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
              Your account is ready. You can now sign in using your email and password.
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Sign In
            </button>
          </div>
        ) : !valid ? (
          <div className="space-y-5">
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {error || 'This invitation cannot be used.'}
            </p>

            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-950/30">
              <p className="text-slate-500 dark:text-slate-400">Invitation email</p>
              <p className="mt-1 break-all font-medium text-slate-900 dark:text-white">
                {email}
              </p>

              <p className="mt-3 text-slate-500 dark:text-slate-400">Assigned role</p>
              <p className="mt-1 font-medium text-slate-900 dark:text-white">{role}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Full Name
              </label>
              <input
                required
                type="text"
                maxLength={120}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                New Password
              </label>
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirm Password
              </label>
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating Account...' : 'Accept Invitation'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Secure account setup for authorized InfraTrack users.
        </p>
      </section>
    </main>
  )
}
