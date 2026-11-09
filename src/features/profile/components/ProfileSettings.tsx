import { useState, useSyncExternalStore, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
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
  role: AppRole
}

const mockProfile = {
  name: 'Abdul Rahim',
  email: 'rahim@example.test',
  department: 'IT Infrastructure',
  contact: '+91 98765 43210',
  memberSince: '04 Nov 2026',
}

export default function ProfileSettings({ role }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [fullName, setFullName] = useState(mockProfile.name)
  const [department, setDepartment] = useState(mockProfile.department)
  const [contact, setContact] = useState(mockProfile.contact)
  const [timeZone, setTimeZone] = useState('Asia/Kolkata')

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
  const [message, setMessage] = useState('')

  function showMessage(value: string) {
    setMessage(value)
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    showMessage('Profile changes saved in this preview.')
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword.length < 8) {
      showMessage('Your new password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('The new password and confirmation do not match.')
      return
    }

    showMessage('Password form validated. Password changes are not connected yet.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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
          className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
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
                  value={mockProfile.email}
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
                    {role}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Status
                </span>
                <div className="flex min-h-11 items-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 sm:col-span-2" />

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Department
                </span>
                <input
                  value={department}
                  maxLength={120}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contact Number
                </span>
                <input
                  value={contact}
                  maxLength={30}
                  onChange={(event) => setContact(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
              </label>
            </div>

            <div className="mt-5 max-w-sm">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time Zone
                </span>
                <select
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Asia/Kolkata">GMT+05:30 India Standard Time</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai">GMT+04:00 Gulf Standard Time</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New York</option>
                </select>
              </label>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setFullName(mockProfile.name)
                  setDepartment(mockProfile.department)
                  setContact(mockProfile.contact)
                  setTimeZone('Asia/Kolkata')
                  setMessage('')
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
              >
                <Save size={17} />
                Update Profile
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
                    {role}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-slate-400">Email</dt>
                    <dd className="break-all font-medium text-slate-700 dark:text-slate-300">
                      {mockProfile.email}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-400">Role</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-300">
                      {role}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-400">Member Since</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-300">
                      {mockProfile.memberSince}
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
                  <p className="font-semibold">Security information</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                  Password and account security controls will be connected when
                  authentication is implemented.
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
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              />
              <span className="text-xs text-slate-400">Use at least 8 characters.</span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
            >
              <LockKeyhole size={17} />
              Update Password
            </button>
          </form>

          <p className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Preview only: password validation is demonstrated here. No actual password is
            changed or stored.
          </p>
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

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Time Zone
              </span>
              <select
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="Asia/Kolkata">GMT+05:30 India Standard Time</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">GMT+04:00 Gulf Standard Time</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New York</option>
              </select>
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
