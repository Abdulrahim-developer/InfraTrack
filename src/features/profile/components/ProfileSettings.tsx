
import { useState, useSyncExternalStore, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

import type { AppRole } from '#/features/navigation/navigation.config'
import { updateProfile } from '#/features/profile/server/update-profile'
import { changePassword } from '#/features/profile/server/change-password'
import {
  getServerThemeSnapshot,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
} from '#/features/theme/theme'

type ProfileTab = 'profile' | 'password' | 'preferences'
type ThemePreference = 'system' | 'light' | 'dark'

interface ProfileSettingsProps {
  user: {
    fullName: string
    email: string
    role: AppRole
    accountStatus: string
    createdAt: Date | string
  }
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [fullName, setFullName] = useState(user.fullName)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const currentThemeMode = useSyncExternalStore(
    subscribeTheme,
    getThemeMode,
    getServerThemeSnapshot,
  )

  const [themeDraft, setThemeDraft] = useState<{
    base: ThemeMode
    value: ThemePreference
  } | null>(null)

  const theme: ThemePreference =
    themeDraft?.base === currentThemeMode
      ? themeDraft.value
      : currentThemeMode === 'auto'
        ? 'system'
        : currentThemeMode

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  function showMessage(value: string, type: 'success' | 'error' = 'success') {
    setMessage(value)
    setMessageType(type)
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const trimmedName = fullName.trim()

    if (!trimmedName || trimmedName.length > 120) {
      showMessage('Full name must be between 1 and 120 characters.', 'error')
      return
    }

    try {
      setIsSavingProfile(true)

      const result = await updateProfile({
        data: { fullName: trimmedName },
      })

      setFullName(result.fullName)
      showMessage('Your profile has been updated successfully.')
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Unable to update your profile.',
        'error',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (newPassword.length < 8) {
      showMessage('Your new password must contain at least 8 characters.', 'error')
      return
    }

    if (newPassword.length > 128) {
      showMessage('Your new password cannot exceed 128 characters.', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('The new password and confirmation do not match.', 'error')
      return
    }

    try {
      setIsChangingPassword(true)

      await changePassword({
        data: { currentPassword, newPassword },
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      showMessage('Your password has been changed successfully.')
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Unable to change your password.',
        'error',
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  function handlePreferencesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setThemeMode(theme === 'system' ? 'auto' : theme)
    setThemeDraft(null)

    showMessage('Your appearance preference has been applied successfully.')
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: UserRound },
    { id: 'password' as const, label: 'Change Password', icon: LockKeyhole },
    { id: 'preferences' as const, label: 'Preferences', icon: Settings },
  ]

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const memberSince = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(user.createdAt))

  const isActive = user.accountStatus === 'ACTIVE'

  return (
    <main className="min-w-0 space-y-6">
      <section>
        <p className="text-sm text-slate-500 dark:text-slate-400">Home / My Profile</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and manage your account information, password and preferences.
        </p>
      </section>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const selected = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setMessage('')
              }}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                selected
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon size={19} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            messageType === 'error'
              ? 'border-red-100 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
              : 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
          }`}
        >
          <Info size={18} className="mt-0.5 shrink-0" />
          {message}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
          <form
            onSubmit={handleProfileSubmit}
            className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          >
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <UserRound size={21} />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  maxLength={120}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </span>
                <input
                  readOnly
                  value={user.email}
                  className="h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </span>
                <div className="flex min-h-11 items-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Users size={16} />
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Status
                </span>
                <div className="flex min-h-11 items-center">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        isActive ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {user.accountStatus.replaceAll('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setFullName(user.fullName)
                  setMessage('')
                }}
                disabled={isSavingProfile}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {isSavingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
                <Info size={20} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Profile Overview
                </h2>
              </div>

              <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-700">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white">
                  {initials || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {user.role}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-slate-400">Email</dt>
                    <dd className="break-all font-medium text-slate-700 dark:text-slate-300">
                      {user.email}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-400">Role</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-300">
                      {user.role}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-400">Member Since</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-300">
                      {memberSince}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Account Security
                </h2>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/40">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={20} />
                  <p className="font-semibold">Account protected</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                  Your account is protected by secure password hashing and authenticated
                  sessions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('password')
                  setMessage('')
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
              >
                <LockKeyhole size={17} />
                Change Password
              </button>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <LockKeyhole size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Change Password
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Update your account password.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </span>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((visible) => !visible)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </span>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((visible) => !visible)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="text-xs text-slate-400">Use 8 to 128 characters.</span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockKeyhole size={17} />
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'preferences' && (
        <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Settings size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Preferences
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Configure your preferred application experience.
              </p>
            </div>
          </div>

          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Appearance
              </span>
              <select
                value={theme}
                onChange={(event) =>
                  setThemeDraft({
                    base: currentThemeMode,
                    value: event.target.value as ThemePreference,
                  })
                }
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="system">Use system preference</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Your appearance preference is applied across the application.
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
            >
              <Save size={17} />
              Save Preferences
            </button>
          </form>
        </section>
      )}
    </main>
  )
}
