import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Shared behaviour for modal surfaces: Escape to close, focus trap, body scroll lock,
// and focus returned to the trigger on close. `busy` blocks closing while a request runs.
function useModal(panelRef, onClose, busy) {
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  useLayoutEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      const target = panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE)
      target?.focus()
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.stopPropagation()
        onCloseRef.current()
      }
      if (event.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [panelRef])

  return () => {
    if (!busyRef.current) onCloseRef.current()
  }
}

export function Dialog({ title, description, icon: Icon, tone = 'default', onClose, busy = false, children, footer }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const requestClose = useModal(panelRef, onClose, busy)
  const iconTone = tone === 'danger' ? 'bg-amber-50 text-amber-600 ring-amber-100' : 'bg-blue-50 text-blue-600 ring-blue-100'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="overlay-fade absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={requestClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="dialog-enter relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 sm:max-w-[480px] sm:rounded-2xl"
      >
        <div className="flex items-start gap-4 px-6 pb-2 pt-6">
          {Icon && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${iconTone}`}>
              <Icon size={19} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            className="-mr-2 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ label, onClose, children, footer, header }) {
  const panelRef = useRef(null)
  const requestClose = useModal(panelRef, onClose, false)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="overlay-fade absolute inset-0 bg-slate-950/30" onClick={requestClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="drawer-enter relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={requestClose}
            className="-mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>}
      </aside>
    </div>
  )
}
