import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Home as HomeIcon, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { cx } from '../../lib/cx'
import { useHomes } from '../../hooks/useHomes'
import type { HomeRecord } from '../../services/homesService'

/**
 * Sidebar home switcher: lists homes, switches active instantly, rename and
 * delete inline, create new. Floating "glass" panel consistent with the nav.
 */
export function HomeSwitcher() {
  const { homes, activeHomeId, loading, switchHome, renameHome, deleteHome } = useHomes()
  const [open, setOpen] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [editing, setEditing] = useState<HomeRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
        setMenuFor(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const active = homes.find((home) => home.id === activeHomeId) ?? null

  if (loading) {
    return (
      <div className="mx-1 h-12 animate-pulse rounded-xl bg-surface-muted" aria-hidden />
    )
  }

  return (
    <div ref={ref} className="relative mx-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cx(
          'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
          'border-border-base bg-surface-card/70 hover:border-border-strong hover:bg-surface-hover',
          open && 'border-brand ring-2 ring-ring/20',
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <HomeIcon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-strong">
            {active?.name ?? 'No home selected'}
          </span>
          <span className="block truncate text-xs text-text-muted">
            {active ? active.profile.home.locationLabel ?? 'Unnamed location' : 'Complete home setup'}
          </span>
        </span>
        <MoreVertical className="size-4 shrink-0 text-text-faint" aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-border-base bg-surface-card/95 shadow-card-hover backdrop-blur-xl"
        >
          <p className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">
            My Homes
          </p>
          {homes.length === 0 && (
            <p className="px-4 py-3 text-xs text-text-muted">
              No homes yet — finish home setup to create your first one.
            </p>
          )}
          <ul className="max-h-64 overflow-y-auto pb-1.5">
            {homes.map((home) => {
              const isActive = home.id === activeHomeId
              if (editing?.id === home.id) {
                return (
                  <li key={home.id} className="px-3 py-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && editName.trim()) {
                          void renameHome(home.id, editName.trim()).then(() => {
                            setEditing(null)
                          })
                        }
                        if (event.key === 'Escape') setEditing(null)
                      }}
                      onBlur={() => {
                        if (editName.trim() && editName.trim() !== editing.name) {
                          void renameHome(home.id, editName.trim())
                        }
                        setEditing(null)
                      }}
                      className="w-full rounded-lg border border-brand bg-surface-card px-2.5 py-1.5 text-sm text-text-strong outline-none ring-2 ring-ring/20"
                    />
                  </li>
                )
              }
              return (
                <li
                  key={home.id}
                  role="option"
                  aria-selected={isActive}
                  className="group relative flex items-center"
                  onMouseLeave={() => setMenuFor(null)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!isActive) void switchHome(home.id)
                      setOpen(false)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cx('block truncate text-sm font-medium', isActive ? 'text-brand' : 'text-text-strong')}>
                        {home.name}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {home.profile.home.locationLabel ?? 'Unnamed location'}
                      </span>
                    </span>
                    {isActive && <Check className="size-4 shrink-0 text-brand" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Options for ${home.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setMenuFor(menuFor === home.id ? null : home.id)
                      setConfirmDelete(null)
                    }}
                    className="mr-2 rounded-md p-1.5 text-text-faint opacity-0 transition-opacity hover:bg-surface-muted hover:text-text-strong focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </button>
                  {menuFor === home.id && (
                    <div className="absolute right-2 top-9 z-50 w-36 overflow-hidden rounded-xl border border-border-base bg-surface-card shadow-card-hover">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(home)
                          setEditName(home.name)
                          setMenuFor(null)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-text-body transition-colors hover:bg-surface-hover"
                      >
                        <Pencil className="size-3.5" aria-hidden /> Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(home.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-surface-hover"
                      >
                        <Trash2 className="size-3.5" aria-hidden /> Delete
                      </button>
                    </div>
                  )}
                  {confirmDelete === home.id && (
                    <div className="absolute inset-x-2 top-9 z-50 rounded-xl border border-border-base bg-surface-card p-3 shadow-card-hover">
                      <p className="text-xs leading-relaxed text-text-body">
                        Delete "{home.name}" and its saved plan progress?
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void deleteHome(home.id)
                            setConfirmDelete(null)
                            setMenuFor(null)
                          }}
                          className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 rounded-lg border border-border-base px-2 py-1.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-hover"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="border-t border-border-base p-2">
            <Link
              to="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand-softer"
            >
              <Plus className="size-4" aria-hidden />
              Add another home
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
