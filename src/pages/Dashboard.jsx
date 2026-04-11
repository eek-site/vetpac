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

const CACHE_KEY = 'vp_dashboard_data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Pill({ children, color = 'slate' }) {
  const colors = {
    green: 'bg-green-100 text-green-800', amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800', teal: 'bg-teal-100 text-teal-800',
    slate: 'bg-slate-100 text-slate-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>{children}</span>
}

function StatusBadge({ status }) {
  if (status === 'paid' || status === 'complete')
    return <span className="inline-flex items-center gap-1 text-green-200 text-xs font-medium bg-green-800/40 px-2 py-0.5 rounded-full"><CheckCircle size={11} />Paid</span>
  if (status === 'pending')
    return <span className="inline-flex items-center gap-1 text-amber-200 text-xs font-medium bg-amber-800/40 px-2 py-0.5 rounded-full"><Clock size={11} />Pending</span>
  return null
}

function googleCalUrl(title, isoDate, desc) {
  const d = new Date(isoDate)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const next = new Date(d); next.setDate(next.getDate() + 1)
  return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${fmt(d)}/${fmt(next)}&details=${encodeURIComponent(desc)}`
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true, action }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center bg-slate-50">
        <button onClick={() => setOpen(v => !v)} className="flex-1 flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left">
          {Icon && <Icon size={14} className="text-slate-400" />}
          {title}
          <span className="ml-auto">{open ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}</span>
        </button>
        {action && <div className="pr-3 shrink-0">{action}</div>}
      </div>
      {open && <div className="px-4 py-4 bg-white space-y-3">{children}</div>}
    </div>
  )
}

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
      <div className="flex items-center gap-1.5 text-amber-700 font-medium"><AlertCircle size={13} />{label}</div>
      {desc && <p className="text-slate-600 pl-5">{desc}</p>}
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

function Field({ label, children }) {
  return <div className="space-y-1"><label className="text-xs font-medium text-slate-500">{label}</label>{children}</div>
}

function EditActions({ onCancel, saving, err }) {
  return (
    <div className="pt-2 space-y-2">
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-sm text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Edit forms — proper React components so useState is legal ────────────────

function DogProfileForm({ data, onSave, onCancel, saving, err }) {
  const [d, set] = useState({ ...data })
  const upd = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ dogProfile: d }) }} className="space-y-3">
      <Field label="Name"><input className={inputCls} value={d.name || ''} onChange={upd('name')} /></Field>
      <Field label="Breed"><input className={inputCls} value={d.breed || ''} onChange={upd('breed')} placeholder="e.g. Labrador" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sex">
          <select className={inputCls} value={d.sex || ''} onChange={upd('sex')}>
            <option value="">Unknown</option><option value="male">Male</option><option value="female">Female</option>
          </select>
        </Field>
        <Field label="Desexed">
          <select className={inputCls} value={d.desexed || ''} onChange={upd('desexed')}>
            <option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        </Field>
      </div>
      <Field label="Date of birth"><input type="date" className={inputCls} value={d.dob || ''} onChange={upd('dob')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight (kg)"><input type="number" step="0.1" className={inputCls} value={d.weight_kg || ''} onChange={upd('weight_kg')} /></Field>
        <Field label="Colour"><input className={inputCls} value={d.colour || ''} onChange={upd('colour')} /></Field>
      </div>
      <Field label="Microchip number"><input className={inputCls} value={d.microchip_no || ''} onChange={upd('microchip_no')} /></Field>
      <EditActions onCancel={onCancel} saving={saving} err={err} />
    </form>
  )
}

function OwnerForm({ data, onSave, onCancel, saving, err }) {
  const [d, set] = useState({ ...data })
  const upd = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ownerDetails: d }) }} className="space-y-3">
      <Field label="Full name"><input className={inputCls} value={d.full_name || ''} onChange={upd('full_name')} /></Field>
      <Field label="Mobile"><input type="tel" className={inputCls} value={d.mobile || ''} onChange={upd('mobile')} /></Field>
      <Field label="Address line 1"><input className={inputCls} value={d.address_line1 || ''} onChange={upd('address_line1')} /></Field>
      <Field label="Address line 2"><input className={inputCls} value={d.address_line2 || ''} onChange={upd('address_line2')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City"><input className={inputCls} value={d.city || ''} onChange={upd('city')} /></Field>
        <Field label="Postcode"><input className={inputCls} value={d.postcode || ''} onChange={upd('postcode')} /></Field>
      </div>
      <Field label="Region"><input className={inputCls} value={d.region || ''} onChange={upd('region')} /></Field>
      <EditActions onCancel={onCancel} saving={saving} err={err} />
    </form>
  )
}

function HealthForm({ data, onSave, onCancel, saving, err }) {
  const [d, set] = useState({ ...data })
  const upd = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  const YN = ({ k, label, descKey }) => (
    <div className="space-y-1">
      <Field label={label}>
        <select className={inputCls} value={d[k] || 'no'} onChange={upd(k)}>
          <option value="no">No</option><option value="yes">Yes</option>
        </select>
      </Field>
      {d[k] === 'yes' && descKey && <input className={inputCls} placeholder="Please describe…" value={d[descKey] || ''} onChange={upd(descKey)} />}
    </div>
  )
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ healthHistory: d }) }} className="space-y-3">
      <Field label="Activity level">
        <select className={inputCls} value={d.activity_level || ''} onChange={upd('activity_level')}>
          <option value="">Select…</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option>
        </select>
      </Field>
      <YN k="currently_ill" label="Currently ill?" descKey="illness_description" />
      <YN k="known_allergies" label="Known allergies?" descKey="allergy_description" />
      <YN k="current_medications" label="On medications?" descKey="medication_list" />
      <YN k="health_conditions" label="Known health conditions?" descKey="condition_description" />
      <YN k="prior_vaccine_reaction" label="Prior vaccine reaction?" descKey="reaction_description" />
      <YN k="pregnant_or_nursing" label="Pregnant or nursing?" />
      <EditActions onCancel={onCancel} saving={saving} err={err} />
    </form>
  )
}

function LifestyleForm({ data, onSave, onCancel, saving, err }) {
  const [d, set] = useState({ ...data })
  const upd = (k) => (e) => set(p => ({ ...p, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ lifestyle: d }) }} className="space-y-3">
      <Field label="Region"><input className={inputCls} value={d.region || ''} onChange={upd('region')} /></Field>
      <Field label="Living environment">
        <select className={inputCls} value={d.living_environment || ''} onChange={upd('living_environment')}>
          <option value="">Select…</option><option value="rural">Rural</option><option value="suburban">Suburban</option><option value="urban">Urban</option>
        </select>
      </Field>
      {[{ k: 'dog_parks_boarding', l: 'Dog parks / boarding?' }, { k: 'waterway_access', l: 'Access to waterways?' }, { k: 'livestock_contact', l: 'Contact with livestock?' }].map(({ k, l }) => (
        <Field key={k} label={l}>
          <select className={inputCls} value={d[k] || 'no'} onChange={upd(k)}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </Field>
      ))}
      <EditActions onCancel={onCancel} saving={saving} err={err} />
    </form>
  )
}

// ─── Editable section wrapper ──────────────────────────────────────────────────

function EditableSection({ title, icon, defaultOpen = true, view, FormComponent, formData, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const handleSave = async (payload) => {
    setSaving(true); setErr(null)
    try { await onSave(payload); setEditing(false) }
    catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Section title={title} icon={icon} defaultOpen={defaultOpen}
      action={!editing && (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 transition-colors px-1 py-1">
          <Pencil size={12} /> Edit
        </button>
      )}
    >
      {editing
        ? <FormComponent data={formData} onSave={handleSave} onCancel={() => { setEditing(false); setErr(null) }} saving={saving} err={err} />
        : view
      }
    </Section>
  )
}

// ─── Progress tracker ──────────────────────────────────────────────────────────

function ProgressTracker({ dog }) {
  const isPaid = dog.order?.status === 'paid' || dog.order?.status === 'complete'
  const isDispatched = dog.order?.status === 'dispatched' || dog.order?.status === 'complete'
  const steps = [
    { label: 'Assessment', done: true, sub: dog.consultationDate },
    { label: 'Plan & payment', done: isPaid, sub: isPaid ? dog.order?.date : 'Awaiting payment' },
    { label: 'Dispatched', done: isDispatched, sub: isDispatched ? 'En route' : 'Awaiting dispatch' },
    { label: 'Programme', done: false, sub: 'Vaccination in progress' },
  ]
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-start">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-teal-600 text-white' : i > 0 && steps[i-1].done ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step.done ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <p className="text-xs font-medium text-slate-700 text-center mt-1 leading-tight px-1">{step.label}</p>
              <p className="text-[10px] text-slate-400 text-center leading-tight mt-0.5 px-1">{step.sub}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mt-3.5 mx-0.5 shrink-0 ${step.done ? 'bg-teal-300' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── What to expect ───────────────────────────────────────────────────────────

function WhatToExpect({ deliveryMethod }) {
  if (!deliveryMethod) return null
  const isAssist = deliveryMethod === 'vetpac_assist'
  const steps = isAssist ? [
    "We'll contact you to schedule your first appointment at a time that suits you.",
    'Your vaccinator arrives with everything needed — vaccines, cold-chain kit, and paperwork.',
    'Each dose takes around 15–20 minutes. Your dog stays comfortable at home.',
    "We'll schedule each follow-up and send a reminder before every appointment.",
    'You receive a signed vaccination record after each dose.',
  ] : [
    'Your vaccines arrive in a certified cold-chain pack with a temperature strip — intact strip means safe to use.',
    'Store in the fridge immediately at 2–8°C. Do not freeze.',
    'Read the included VetPac Administration Guide carefully before the first dose.',
    'Administer each dose on the schedule shown below. The guide walks you through every step.',
    'Any concerns before, during, or after a dose — use the chat button.',
  ]
  return (
    <Section title="What to expect" icon={Package} defaultOpen>
      <div className="flex items-start gap-2.5 mb-3">
        {isAssist ? <Home size={15} className="text-teal-600 mt-0.5 shrink-0" /> : <Package size={15} className="text-slate-500 mt-0.5 shrink-0" />}
        <div>
          <p className="text-sm font-medium text-slate-700">{isAssist ? 'VetPac Assist — In-home vaccinator' : 'Self-administer at home'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{isAssist ? 'A trained VetPac assistant comes to your home for each dose.' : 'Your vaccines are shipped in a temperature-certified cold-chain kit.'}</p>
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${isAssist ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </Section>
  )
}

// ─── Dog card ──────────────────────────────────────────────────────────────────

function DogCard({ dog: initial, sessionToken, accessToken, onUpdate }) {
  const [dog, setDog] = useState(initial)
  const { profile: p, owner: o, health: h, lifestyle: l, order, schedule = [] } = dog

  const hasHealthFlags = [h.known_allergies, h.current_medications, h.health_conditions, h.prior_vaccine_reaction, h.currently_ill].some(v => v && v !== 'no')
  const hasLifestyleRisk = [l.dog_parks_boarding, l.waterway_access, l.livestock_contact].some(v => v && v !== 'no')

  const save = useCallback(async (payload) => {
    const res = await fetch('/api/update-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sessionToken, ...payload }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Save failed')
    // Merge the update into local state so the display reflects the change immediately
    const key = Object.keys(payload).find(k => k !== 'sessionToken')
    const sectionMap = { dogProfile: 'profile', ownerDetails: 'owner', healthHistory: 'health', lifestyle: 'lifestyle' }
    const section = sectionMap[key]
    if (section) {
      const updated = { ...dog, [section]: { ...dog[section], ...payload[key] } }
      setDog(updated)
      onUpdate(dog.id, updated)
    }
  }, [dog, sessionToken, accessToken, onUpdate])

  const deliveryLabel = order?.deliveryMethod === 'vetpac_assist' ? 'VetPac Assist — in-home vaccinator'
    : order?.deliveryMethod === 'self_administer' ? 'Self-administer at home' : null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3c2e] to-[#2d5a42] px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <PawPrint size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight">{p.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {p.breed && <span className="text-white/70 text-sm">{p.breed}</span>}
            {p.ageLabel && <span className="text-white/60 text-xs">· {p.ageLabel}</span>}
          </div>
        </div>
        {order?.status && <StatusBadge status={order.status} />}
      </div>

      <ProgressTracker dog={dog} />

      <div className="px-4 pb-4 space-y-3">

        <EditableSection title="Dog profile" icon={PawPrint}
          formData={p} FormComponent={DogProfileForm} onSave={save}
          view={
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
        />

        <EditableSection title="Owner details" icon={User}
          formData={o} FormComponent={OwnerForm} onSave={save}
          view={
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
        />

        <EditableSection title="Health assessment" icon={Heart} defaultOpen={hasHealthFlags}
          formData={h} FormComponent={HealthForm} onSave={save}
          view={
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
        />

        <EditableSection title="Lifestyle & environment" icon={Leaf} defaultOpen={hasLifestyleRisk}
          formData={l} FormComponent={LifestyleForm} onSave={save}
          view={
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
        />

        {/* Vaccination order — read only */}
        {order ? (
          <Section title="Vaccination order" icon={Syringe}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{order.date}</span>
              {deliveryLabel && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  {order.deliveryMethod === 'vetpac_assist' ? <Home size={13} className="text-teal-600" /> : <Package size={13} className="text-slate-500" />}
                  {deliveryLabel}
                </div>
              )}
            </div>
            <div className="space-y-1 pt-1">
              {(order.vaccines || []).map((v, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-700">
                  <span>{v.name}</span><span className="text-slate-500">${Number(v.price).toFixed(2)}</span>
                </div>
              ))}
              {order.hasFreight && <div className="flex justify-between text-sm text-slate-600"><span className="flex items-center gap-1"><Truck size={12} />Cold-chain freight</span><span>${Number(order.freightTotal).toFixed(2)}</span></div>}
              {order.hasAssist && <div className="flex justify-between text-sm text-slate-600"><span className="flex items-center gap-1"><Home size={12} />VetPac Assist</span><span>${Number(order.assistTotal).toFixed(2)}</span></div>}
              {order.warrantySelected && <div className="flex justify-between text-sm text-teal-700 font-medium"><span className="flex items-center gap-1"><Shield size={12} />Warranty</span><span>${Number(order.warrantyTotal || 0).toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-100">
                <span>Total paid</span><span>${Number(order.total).toFixed(2)} NZD</span>
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
            <p className="text-sm text-slate-500 mb-2">No order placed yet.</p>
            <Link to="/plan"><Button size="sm">View my plan <ArrowRight size={14} /></Button></Link>
          </Section>
        )}

        {order?.deliveryMethod && <WhatToExpect deliveryMethod={order.deliveryMethod} />}

        {/* Dose schedule with calendar links */}
        {schedule.length > 0 && (
          <Section title="Dose schedule" icon={CalendarDays}>
            <div className="space-y-3">
              {schedule.map((dose, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${dose.status === 'due' ? 'bg-amber-400' : dose.status === 'upcoming' ? 'bg-blue-400' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{dose.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">{dose.date}</span>
                        <a href={googleCalUrl(`${p.name} — ${dose.label}`, dose.isoDate, `VetPac vaccination: ${dose.desc}`)} target="_blank" rel="noreferrer" title="Add to Google Calendar" className="text-slate-400 hover:text-teal-600 transition-colors">
                          <CalendarPlus size={14} />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{dose.desc}</p>
                    {dose.status === 'due' && <Pill color="amber">Due now</Pill>}
                    {dose.status === 'upcoming' && <Pill color="blue">Within 30 days</Pill>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-1">Indicative schedule based on NZ vaccination protocols and your dog's date of birth.</p>
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
              <p className="text-xs text-slate-400">Warranty covers vaccine failure, adverse reactions, and illness during the vaccination window.</p>
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
  const orderedDogs = dogs.filter(d => d.order?.status === 'paid')
  const warrantiedDogs = dogs.filter(d => d.order?.warrantySelected)
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Your account</h3>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Mail size={16} className="text-slate-400 shrink-0" /><span>{session?.user?.email}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { count: dogs.length, label: `Dog${dogs.length !== 1 ? 's' : ''} registered` },
            { count: orderedDogs.length, label: `Order${orderedDogs.length !== 1 ? 's' : ''} placed` },
            { count: warrantiedDogs.length, label: `Warrant${warrantiedDogs.length !== 1 ? 'ies' : 'y'} active` },
          ].map(({ count, label }) => (
            <button key={label} onClick={onSwitchToDogs} className="text-center p-3 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl transition-colors">
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
      <button onClick={() => supabase.auth.signOut()} className="w-full text-sm text-slate-500 hover:text-red-600 transition-colors py-2">Sign out</button>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

const TABS = [{ id: 'dogs', label: 'My Dogs', icon: PawPrint }, { id: 'account', label: 'Account', icon: Settings }]

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dogs')
  const [dogs, setDogs] = useState(() => {
    // Load from sessionStorage immediately so there's no blank flash on return visits
    try { const c = sessionStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setAuthLoading(false) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    // Don't show spinner if we already have cached data — just silently refresh
    if (!dogs.length) setFetching(true)
    fetch('/api/dashboard-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({}),
    })
      .then(r => { if (r.status === 401) { supabase.auth.signOut(); return null } return r.json() })
      .then(d => {
        if (d?.dogs) {
          setDogs(d.dogs)
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(d.dogs)) } catch {}
        }
      })
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [session?.access_token])

  const handleDogUpdate = useCallback((id, updated) => {
    setDogs(prev => {
      const next = prev.map(d => d.id === id ? updated : d)
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>

  if (!session) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center space-y-4">
          <PawPrint size={40} className="text-teal-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">Sign in to your dashboard</h1>
          <p className="text-sm text-slate-500">We'll send you a magic link — no password needed.</p>
          <MagicLinkForm />
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">{session.user.email}</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 px-3 rounded-lg transition-all ${activeTab === t.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>

        {activeTab === 'dogs' && (
          <div className="space-y-6">
            {fetching && !dogs.length ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-teal-600" size={28} /></div>
            ) : dogs.length > 0 ? (
              <>
                {dogs.map(dog => (
                  <DogCard key={dog.id} dog={dog} sessionToken={dog.sessionToken} accessToken={session.access_token} onUpdate={handleDogUpdate} />
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
        {activeTab === 'account' && <AccountTab session={session} dogs={dogs} onSwitchToDogs={() => setActiveTab('dogs')} />}
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}

// ─── Magic link sign-in ───────────────────────────────────────────────────────

function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/send-dashboard-magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to send link')
      setSent(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  if (sent) return <div className="text-center space-y-2"><CheckCircle size={32} className="text-teal-500 mx-auto" /><p className="font-semibold text-slate-800">Check your email</p><p className="text-sm text-slate-500">Sent to <strong>{email}</strong></p></div>
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : 'Send magic link'}</Button>
    </form>
  )
}
