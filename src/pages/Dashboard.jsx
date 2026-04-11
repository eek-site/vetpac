import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SupportChat from '../components/SupportChat'
import {
  PawPrint, Settings, CheckCircle, Clock, AlertCircle, Loader2, Mail,
  ExternalLink, Heart, Leaf, CalendarDays, User, Syringe, Shield,
  BadgeCheck, ArrowRight, Pencil, X, Save, Package, Home, Truck,
  ChevronDown, ChevronRight, CalendarPlus,
} from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Pill({ children, color = 'green' }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-100 text-teal-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>
      {children}
    </span>
  )
}

function StatusDot({ status }) {
  if (status === 'paid' || status === 'complete')
    return <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><CheckCircle size={12} />Paid</span>
  if (status === 'pending')
    return <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium"><Clock size={12} />Pending</span>
  return null
}

function googleCalUrl(title, isoDate, desc) {
  const d = new Date(isoDate)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const next = new Date(d); next.setDate(next.getDate() + 1)
  return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${fmt(d)}/${fmt(next)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent('VetPac — vetpac.nz')}`
}

// ─── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true, action }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center bg-slate-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
        >
          {Icon && <Icon size={14} className="text-slate-400" />}
          {title}
          <span className="ml-auto">
            {open ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
          </span>
        </button>
        {action && <div className="pr-3">{action}</div>}
      </div>
      {open && <div className="px-4 py-4 bg-white space-y-3">{children}</div>}
    </div>
  )
}

// ─── Display row ──────────────────────────────────────────────────────────────

function Row({ label, value }) {
  if (value === null || value === undefined || value === '' || value === 'unknown') return null
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{String(value)}</span>
    </div>
  )
}

function FlagRow({ label, value, desc }) {
  if (!value || value === 'no') return null
  return (
    <div className="text-sm space-y-0.5">
      <div className="flex items-center gap-1.5 text-amber-700 font-medium">
        <AlertCircle size={13} />{label}
      </div>
      {desc && <p className="text-slate-600 pl-5">{desc}</p>}
    </div>
  )
}

// ─── Editable section — section-level edit mode ───────────────────────────────

function EditableSection({ title, icon, defaultOpen = true, displayContent, editContent, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const handleSave = async (draft) => {
    setSaving(true); setErr(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section
      title={title}
      icon={icon}
      defaultOpen={defaultOpen}
      action={
        !editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 transition-colors px-1 py-1"
          >
            <Pencil size={12} /> Edit
          </button>
        ) : null
      }
    >
      {editing
        ? editContent({ onSave: handleSave, onCancel: () => { setEditing(false); setErr(null) }, saving, err })
        : displayContent}
    </Section>
  )
}

// ─── Edit form helpers ─────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'
const selectCls = inputCls

function EditActions({ onCancel, saving, err }) {
  return (
    <div className="pt-2 space-y-2">
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Progress tracker ──────────────────────────────────────────────────────────

function ProgressTracker({ dog }) {
  const hasOrder = !!dog.order
  const isPaid = dog.order?.status === 'paid' || dog.order?.status === 'complete'
  const isDispatched = dog.order?.status === 'dispatched' || dog.order?.status === 'complete'

  const steps = [
    { label: 'Assessment', done: true, desc: `Completed ${dog.consultationDate}` },
    { label: 'Plan & payment', done: isPaid, desc: isPaid ? `Paid ${dog.order?.date || ''}` : 'Awaiting payment' },
    { label: 'Dispatched', done: isDispatched, desc: isDispatched ? 'Vaccines sent' : 'Awaiting dispatch' },
    { label: 'Programme active', done: false, desc: 'Vaccination in progress' },
  ]

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-start gap-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const isCurrent = !step.done && (i === 0 || steps[i - 1]?.done)
          return (
            <div key={i} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${step.done ? 'bg-teal-600 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {step.done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <p className="text-xs font-medium text-slate-700 text-center mt-1 leading-tight">{step.label}</p>
                <p className="text-[10px] text-slate-400 text-center leading-tight mt-0.5">{step.desc}</p>
              </div>
              {!isLast && (
                <div className={`h-0.5 flex-1 mt-3.5 mx-1 ${steps[i + 1]?.done || step.done ? 'bg-teal-300' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── What to expect section ────────────────────────────────────────────────────

function WhatToExpect({ deliveryMethod }) {
  if (!deliveryMethod) return null
  const isAssist = deliveryMethod === 'vetpac_assist'
  return (
    <Section title="What to expect" icon={Package} defaultOpen={true}>
      {isAssist ? (
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <Home size={15} className="text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">VetPac Assist — In-home vaccinator</p>
              <p className="text-slate-500 text-xs mt-0.5">A trained VetPac assistant comes to your home for each dose.</p>
            </div>
          </div>
          <ol className="space-y-2 pl-1">
            {[
              'We'll contact you to schedule your first appointment at a time that suits you.',
              'Your vaccinator arrives with everything needed — vaccines, cold-chain kit, and paperwork.',
              'Each dose takes around 15–20 minutes. Your dog stays comfortable at home.',
              'We'll schedule each follow-up dose and send a reminder before every appointment.',
              'You receive a signed vaccination record after each dose.',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <Package size={15} className="text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Self-administer at home</p>
              <p className="text-slate-500 text-xs mt-0.5">Your vaccines are shipped to you in a temperature-certified cold-chain kit.</p>
            </div>
          </div>
          <ol className="space-y-2 pl-1">
            {[
              'Your vaccines arrive in a certified cold-chain pack with a temperature strip — if the strip is intact your vaccines are safe to use.',
              'Store in the fridge immediately at 2–8°C. Do not freeze.',
              'Read the included VetPac Administration Guide carefully before the first dose.',
              'Administer each dose on the schedule shown below. The guide walks you through every step.',
              'If you have any concerns before, during, or after a dose, use the chat button — we're here.',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Section>
  )
}

// ─── Dog card ──────────────────────────────────────────────────────────────────

function DogCard({ dog: initialDog, sessionToken, accessToken }) {
  const [dog, setDog] = useState(initialDog)
  const p = dog.profile
  const o = dog.owner
  const h = dog.health
  const l = dog.lifestyle
  const order = dog.order
  const schedule = dog.schedule || []

  const hasHealthFlags = [
    h.known_allergies, h.current_medications, h.health_conditions,
    h.prior_vaccine_reaction, h.currently_ill,
  ].some((v) => v && v !== 'no')

  const hasLifestyleRisk = [l.dog_parks_boarding, l.waterway_access, l.livestock_contact].some((v) => v && v !== 'no')

  // Save helper — calls /api/update-intake and merges result into local state
  const save = useCallback(async (section, data) => {
    const res = await fetch('/api/update-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sessionToken, ...data }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Save failed')
    // Optimistically merge the change into local state
    setDog((d) => ({ ...d, [section]: { ...d[section], ...Object.values(data)[0] } }))
  }, [sessionToken, accessToken])

  const deliveryLabel = order?.deliveryMethod === 'vetpac_assist'
    ? 'VetPac Assist — in-home vaccinator'
    : order?.deliveryMethod === 'self_administer'
    ? 'Self-administer at home'
    : null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3c2e] to-[#2d5a42] px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <PawPrint size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight">{p.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {p.breed && <span className="text-white/70 text-sm">{p.breed}</span>}
            {p.ageLabel && <span className="text-white/60 text-xs">· {p.ageLabel}</span>}
          </div>
        </div>
        {order?.status && <StatusDot status={order.status} />}
      </div>

      {/* Progress tracker */}
      <ProgressTracker dog={dog} />

      <div className="px-4 pb-4 space-y-3">

        {/* Dog profile — editable */}
        <EditableSection
          title="Dog profile"
          icon={PawPrint}
          displayContent={
            <div className="space-y-2">
              <Row label="Breed" value={p.breed} />
              <Row label="Sex" value={p.sex} />
              <Row label="Date of birth" value={p.dob ? new Date(p.dob).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <Row label="Age" value={p.ageLabel} />
              <Row label="Weight" value={p.weight_kg ? `${p.weight_kg} kg` : null} />
              <Row label="Colour" value={p.colour} />
              <Row label="Desexed" value={p.desexed} />
              <Row label="Microchip" value={p.microchip_no} />
            </div>
          }
          editContent={({ onSave, onCancel, saving, err }) => {
            const [draft, setDraft] = useState({ ...p })
            const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
            return (
              <form onSubmit={(e) => { e.preventDefault(); onSave({ dogProfile: draft }) }} className="space-y-3">
                <Field label="Name"><input className={inputCls} value={draft.name || ''} onChange={set('name')} /></Field>
                <Field label="Breed"><input className={inputCls} value={draft.breed || ''} onChange={set('breed')} placeholder="e.g. Labrador" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Sex">
                    <select className={selectCls} value={draft.sex || ''} onChange={set('sex')}>
                      <option value="">Unknown</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Field>
                  <Field label="Desexed">
                    <select className={selectCls} value={draft.desexed || ''} onChange={set('desexed')}>
                      <option value="unknown">Unknown</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </Field>
                </div>
                <Field label="Date of birth"><input type="date" className={inputCls} value={draft.dob || ''} onChange={set('dob')} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Weight (kg)"><input type="number" step="0.1" className={inputCls} value={draft.weight_kg || ''} onChange={set('weight_kg')} /></Field>
                  <Field label="Colour"><input className={inputCls} value={draft.colour || ''} onChange={set('colour')} /></Field>
                </div>
                <Field label="Microchip number"><input className={inputCls} value={draft.microchip_no || ''} onChange={set('microchip_no')} /></Field>
                <EditActions onCancel={onCancel} saving={saving} err={err} />
              </form>
            )
          }}
          onSave={(data) => save('profile', data)}
        />

        {/* Owner details — editable */}
        <EditableSection
          title="Owner details"
          icon={User}
          displayContent={
            <div className="space-y-2">
              <Row label="Name" value={o.full_name} />
              <Row label="Email" value={o.email} />
              <Row label="Phone" value={o.mobile} />
              {o.address_line1 && (
                <div className="text-sm">
                  <span className="text-slate-500 block mb-0.5">Address</span>
                  <span className="text-slate-800">{[o.address_line1, o.address_line2, o.city, o.postcode, o.region].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          }
          editContent={({ onSave, onCancel, saving, err }) => {
            const [draft, setDraft] = useState({ ...o })
            const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
            return (
              <form onSubmit={(e) => { e.preventDefault(); onSave({ ownerDetails: draft }) }} className="space-y-3">
                <Field label="Full name"><input className={inputCls} value={draft.full_name || ''} onChange={set('full_name')} /></Field>
                <Field label="Mobile"><input type="tel" className={inputCls} value={draft.mobile || ''} onChange={set('mobile')} /></Field>
                <Field label="Address line 1"><input className={inputCls} value={draft.address_line1 || ''} onChange={set('address_line1')} /></Field>
                <Field label="Address line 2"><input className={inputCls} value={draft.address_line2 || ''} onChange={set('address_line2')} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City"><input className={inputCls} value={draft.city || ''} onChange={set('city')} /></Field>
                  <Field label="Postcode"><input className={inputCls} value={draft.postcode || ''} onChange={set('postcode')} /></Field>
                </div>
                <Field label="Region"><input className={inputCls} value={draft.region || ''} onChange={set('region')} /></Field>
                <EditActions onCancel={onCancel} saving={saving} err={err} />
              </form>
            )
          }}
          onSave={(data) => save('owner', data)}
        />

        {/* Health — editable */}
        <EditableSection
          title="Health assessment"
          icon={Heart}
          defaultOpen={hasHealthFlags}
          displayContent={
            <div className="space-y-2">
              <Row label="Activity level" value={h.activity_level} />
              {hasHealthFlags ? (
                <div className="space-y-2 pt-1">
                  <FlagRow label="Currently ill" value={h.currently_ill} desc={h.illness_description} />
                  <FlagRow label="Known allergies" value={h.known_allergies} desc={h.allergy_description} />
                  <FlagRow label="Current medications" value={h.current_medications} desc={h.medication_list} />
                  <FlagRow label="Health conditions" value={h.health_conditions} desc={h.condition_description} />
                  <FlagRow label="Prior vaccine reaction" value={h.prior_vaccine_reaction} desc={h.reaction_description} />
                  <FlagRow label="Pregnant / nursing" value={h.pregnant_or_nursing} />
                </div>
              ) : (
                <p className="text-sm text-green-700 flex items-center gap-1.5"><CheckCircle size={13} />No health concerns noted</p>
              )}
            </div>
          }
          editContent={({ onSave, onCancel, saving, err }) => {
            const [draft, setDraft] = useState({ ...h })
            const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
            const yn = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
            const YNField = ({ k, label, descKey }) => (
              <div className="space-y-1">
                <Field label={label}>
                  <select className={selectCls} value={draft[k] || 'no'} onChange={yn(k)}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
                {draft[k] === 'yes' && descKey && (
                  <input className={inputCls} placeholder="Please describe…" value={draft[descKey] || ''} onChange={set(descKey)} />
                )}
              </div>
            )
            return (
              <form onSubmit={(e) => { e.preventDefault(); onSave({ healthHistory: draft }) }} className="space-y-3">
                <Field label="Activity level">
                  <select className={selectCls} value={draft.activity_level || ''} onChange={set('activity_level')}>
                    <option value="">Select…</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </Field>
                <YNField k="currently_ill" label="Currently ill?" descKey="illness_description" />
                <YNField k="known_allergies" label="Known allergies?" descKey="allergy_description" />
                <YNField k="current_medications" label="On medications?" descKey="medication_list" />
                <YNField k="health_conditions" label="Known health conditions?" descKey="condition_description" />
                <YNField k="prior_vaccine_reaction" label="Prior vaccine reaction?" descKey="reaction_description" />
                <YNField k="pregnant_or_nursing" label="Pregnant or nursing?" />
                <EditActions onCancel={onCancel} saving={saving} err={err} />
              </form>
            )
          }}
          onSave={(data) => save('health', data)}
        />

        {/* Lifestyle — editable */}
        <EditableSection
          title="Lifestyle & environment"
          icon={Leaf}
          defaultOpen={hasLifestyleRisk}
          displayContent={
            <div className="space-y-2">
              <Row label="Region" value={l.region} />
              <Row label="Living environment" value={l.living_environment} />
              {hasLifestyleRisk ? (
                <div className="space-y-1 pt-1">
                  <FlagRow label="Dog parks / boarding" value={l.dog_parks_boarding} />
                  <FlagRow label="Waterway access" value={l.waterway_access} />
                  <FlagRow label="Livestock contact" value={l.livestock_contact} />
                </div>
              ) : (
                <p className="text-sm text-slate-500 flex items-center gap-1.5"><CheckCircle size={13} className="text-green-600" />Low environmental risk</p>
              )}
            </div>
          }
          editContent={({ onSave, onCancel, saving, err }) => {
            const [draft, setDraft] = useState({ ...l })
            const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
            return (
              <form onSubmit={(e) => { e.preventDefault(); onSave({ lifestyle: draft }) }} className="space-y-3">
                <Field label="Region"><input className={inputCls} value={draft.region || ''} onChange={set('region')} /></Field>
                <Field label="Living environment">
                  <select className={selectCls} value={draft.living_environment || ''} onChange={set('living_environment')}>
                    <option value="">Select…</option>
                    <option value="rural">Rural</option>
                    <option value="suburban">Suburban</option>
                    <option value="urban">Urban</option>
                  </select>
                </Field>
                {[
                  { k: 'dog_parks_boarding', label: 'Dog parks / boarding?' },
                  { k: 'waterway_access', label: 'Access to waterways?' },
                  { k: 'livestock_contact', label: 'Contact with livestock?' },
                ].map(({ k, label }) => (
                  <Field key={k} label={label}>
                    <select className={selectCls} value={draft[k] || 'no'} onChange={set(k)}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </Field>
                ))}
                <EditActions onCancel={onCancel} saving={saving} err={err} />
              </form>
            )
          }}
          onSave={(data) => save('lifestyle', data)}
        />

        {/* Vaccination order */}
        {order ? (
          <Section title="Vaccination order" icon={Syringe}>
            <div className="flex items-center justify-between">
              <StatusDot status={order.status} />
              <span className="text-sm text-slate-500">{order.date}</span>
            </div>
            {deliveryLabel && (
              <div className="flex items-center gap-2 text-sm text-slate-700 font-medium pt-1">
                {order.deliveryMethod === 'vetpac_assist' ? <Home size={14} className="text-teal-600" /> : <Package size={14} className="text-slate-500" />}
                {deliveryLabel}
              </div>
            )}
            <div className="space-y-1 pt-2">
              {order.vaccines.map((v, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-700">
                  <span>{v.name}</span>
                  <span className="text-slate-500">${Number(v.price).toFixed(2)}</span>
                </div>
              ))}
              {order.hasFreight && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Truck size={12} />Cold-chain freight</span>
                  <span>${Number(order.freightTotal).toFixed(2)}</span>
                </div>
              )}
              {order.hasAssist && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Home size={12} />VetPac Assist</span>
                  <span>${Number(order.assistTotal).toFixed(2)}</span>
                </div>
              )}
              {order.warrantySelected && (
                <div className="flex justify-between text-sm text-teal-700 font-medium">
                  <span className="flex items-center gap-1"><Shield size={12} />Warranty</span>
                  <span>${Number(order.warrantyTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-100">
                <span>Total paid</span>
                <span>${Number(order.total).toFixed(2)} NZD</span>
              </div>
            </div>
            {order.receiptUrl && (
              <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline pt-1">
                <ExternalLink size={13} />View receipt
              </a>
            )}
          </Section>
        ) : (
          <Section title="Vaccination order" icon={Syringe} defaultOpen={false}>
            <p className="text-sm text-slate-500">No order placed yet.</p>
            <Link to="/plan"><Button size="sm" className="mt-2">View my plan <ArrowRight size={14} /></Button></Link>
          </Section>
        )}

        {/* What to expect */}
        {order?.deliveryMethod && <WhatToExpect deliveryMethod={order.deliveryMethod} />}

        {/* Dose schedule with calendar links */}
        {schedule.length > 0 && (
          <Section title="Dose schedule" icon={CalendarDays}>
            <div className="space-y-3">
              {schedule.map((dose, i) => {
                const calTitle = `${p.name} — ${dose.label}`
                const calDesc = `VetPac vaccination programme. ${dose.desc}`
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                      dose.status === 'due' ? 'bg-amber-400' :
                      dose.status === 'upcoming' ? 'bg-blue-400' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{dose.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">{dose.date}</span>
                          <a
                            href={googleCalUrl(calTitle, dose.isoDate, calDesc)}
                            target="_blank"
                            rel="noreferrer"
                            title="Add to Google Calendar"
                            className="text-slate-400 hover:text-teal-600 transition-colors"
                          >
                            <CalendarPlus size={14} />
                          </a>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{dose.desc}</p>
                      {dose.status === 'due' && <Pill color="amber">Due now</Pill>}
                      {dose.status === 'upcoming' && <Pill color="blue">Within 30 days</Pill>}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-1">
              Schedule is based on NZ vaccination protocols and your dog's date of birth. Consult the enclosed VetPac guide for exact timing.
            </p>
          </Section>
        )}

        {/* Warranty */}
        <Section title="Warranty" icon={Shield} defaultOpen={order?.warrantySelected}>
          {order?.warrantySelected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">VetPac Programme Warranty active</span>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Covers vaccine failure or adverse reactions</p>
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Covers illness contracted during the vaccination window</p>
                <p className="flex items-start gap-2"><CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />Valid for the duration of your puppy's programme</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                To make a claim, use the chat button with your order reference and a summary of the issue.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">No warranty on this order.</p>
              <p className="text-xs text-slate-400">Warranty covers vaccine failure, adverse reactions, and illness during the vaccination window. It can be added when placing a new order.</p>
              <Link to="/plan"><Button size="sm" variant="outline">Add warranty <ArrowRight size={14} /></Button></Link>
            </div>
          )}
        </Section>

      </div>
    </div>
  )
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab({ session, dogs, onSwitchToDogs }) {
  const email = session?.user?.email
  const orderedDogs = dogs.filter((d) => d.order?.status === 'paid')
  const warrantiedDogs = dogs.filter((d) => d.order?.warrantySelected)

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Your account</h3>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Mail size={16} className="text-slate-400 shrink-0" />
          <span>{email}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { count: dogs.length, label: `Dog${dogs.length !== 1 ? 's' : ''} registered` },
            { count: orderedDogs.length, label: `Order${orderedDogs.length !== 1 ? 's' : ''} placed` },
            { count: warrantiedDogs.length, label: `Warrant${warrantiedDogs.length !== 1 ? 'ies' : 'y'} active` },
          ].map(({ count, label }) => (
            <button
              key={label}
              onClick={onSwitchToDogs}
              className="text-center p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-colors"
            >
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 space-y-2">
        <p className="font-semibold text-slate-700">Need help?</p>
        <p>Use the chat button to get in touch — we respond as quickly as possible.</p>
        <p className="text-xs text-slate-400">For veterinary emergencies, contact your local vet immediately.</p>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full text-sm text-slate-500 hover:text-red-600 transition-colors py-2"
      >
        Sign out
      </button>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

const tabs = [
  { id: 'dogs', label: 'My Dogs', icon: PawPrint },
  { id: 'account', label: 'Account', icon: Settings },
]

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dogs')
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    let cancelled = false
    setDataLoading(true)
    fetch('/api/dashboard-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({}),
    })
      .then((r) => {
        if (r.status === 401) { supabase.auth.signOut(); return null }
        return r.json()
      })
      .then((d) => { if (!cancelled && d) setData(d) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [session])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center space-y-4">
            <PawPrint size={40} className="text-teal-600 mx-auto" />
            <h1 className="text-xl font-bold text-slate-800">Sign in to your dashboard</h1>
            <p className="text-sm text-slate-500">We'll email you a magic link — no password needed.</p>
            <MagicLinkForm />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const dogs = data?.dogs || []

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">{session.user.email}</p>
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                  activeTab === t.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon size={15} />{t.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'dogs' && (
          <div className="space-y-6">
            {dataLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-teal-600" size={28} />
              </div>
            ) : dogs.length > 0 ? (
              <>
                {dogs.map((dog) => (
                  <DogCard
                    key={dog.id}
                    dog={dog}
                    sessionToken={dog.sessionToken}
                    accessToken={session.access_token}
                  />
                ))}
                <Link to="/intake" className="block">
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-400 hover:bg-teal-50 transition-colors">
                    <PawPrint size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Add another dog</p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                <PawPrint size={36} className="text-slate-300 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-700">No records yet</p>
                  <p className="text-sm text-slate-500 mt-1">Complete the intake form to get your puppy's programme.</p>
                </div>
                <Link to="/intake"><Button>Start intake form <ArrowRight size={14} /></Button></Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <AccountTab session={session} dogs={dogs} onSwitchToDogs={() => setActiveTab('dogs')} />
        )}
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}

// ─── Magic link sign-in form ───────────────────────────────────────────────────

function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/send-dashboard-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to send link')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="text-center space-y-2">
      <CheckCircle size={32} className="text-teal-500 mx-auto" />
      <p className="font-semibold text-slate-800">Check your email</p>
      <p className="text-sm text-slate-500">We sent a magic link to <strong>{email}</strong></p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send magic link'}
      </Button>
    </form>
  )
}
