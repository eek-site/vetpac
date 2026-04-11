import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, ArrowRight, CheckCircle, AlertTriangle,
  Clock, Shield, Star, Home as HomeIcon, Syringe, Activity,
} from 'lucide-react'
import SEO from '../components/SEO'
import { logSiteEvent } from '../lib/logSiteEvent'
import { openChat } from '../lib/openChat'
import Button from '../components/ui/Button'

const GUIDE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Puppy Vaccination Guide New Zealand — C3, C5, Schedules & Costs',
  description: 'Complete guide to puppy vaccinations in New Zealand. Covers C3 vs C5, recommended schedules, costs, Kennel Cough, Leptospirosis, and how VetPac delivers vet-authorised vaccines to your home.',
  author: { '@type': 'Organization', name: 'VetPac', url: 'https://vetpac.nz' },
  publisher: { '@type': 'Organization', name: 'VetPac', url: 'https://vetpac.nz' },
  datePublished: '2026-04-01',
  dateModified: '2026-04-11',
  mainEntityOfPage: 'https://vetpac.nz/guide',
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'When should I get my puppy vaccinated in NZ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puppies in New Zealand should receive their first C3 vaccination at 6–8 weeks, a C5 booster at 10–12 weeks, and a final C5 at 14–16 weeks. An optional Leptospirosis course starts at 12 weeks.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between C3 and C5 for puppies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'C3 covers the three core diseases: Distemper, Hepatitis, and Parvovirus. C5 adds Parainfluenza and Bordetella (Kennel Cough). Most puppies receive C3 as their first dose and C5 for subsequent doses and annual boosters.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do puppy vaccinations cost in New Zealand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Clinic vaccinations in NZ typically cost $90–$160 per visit including a consult fee. VetPac charges $49 for the initial consultation and $89 per vaccine, with vaccines cold-chain delivered to your home. A full 3-dose puppy course with VetPac costs approximately $624 including delivery.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I vaccinate my puppy at home in New Zealand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. VetPac provides vet-authorised at-home puppy vaccination across all of New Zealand. A NZ-registered veterinarian designs your puppy\'s programme, and vaccines are cold-chain delivered directly to your home. You can administer them yourself with full support, or book a VetPac technician to do it for you.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does my puppy need the Leptospirosis vaccine in NZ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Leptospirosis is recommended for puppies with exposure to farms, rivers, lakes, or wildlife. It requires two doses 2–4 weeks apart starting at 12 weeks, then annual boosters. Your VetPac assessment will determine if it\'s right for your puppy based on lifestyle.',
      },
    },
  ],
}

function useIntersection(ref, threshold = 0.1) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, threshold])
  return visible
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const visible = useIntersection(ref)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group">
        <span className="font-semibold text-textPrimary text-sm group-hover:text-primary transition-colors">{q}</span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center">
          {open ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-textMuted" />}
        </span>
      </button>
      {open && <div className="pb-5 -mt-1 text-sm text-textSecondary leading-relaxed">{a}</div>}
    </div>
  )
}

const SECTIONS = [
  { id: 'schedule',    label: 'Vaccination schedule' },
  { id: 'c3-vs-c5',   label: 'C3 vs C5 explained' },
  { id: 'lepto',      label: 'Leptospirosis' },
  { id: 'kennel-cough', label: 'Kennel Cough' },
  { id: 'parvo',      label: 'Parvovirus' },
  { id: 'cost',       label: 'Costs in NZ' },
  { id: 'at-home',    label: 'At-home vaccination' },
  { id: 'side-effects', label: 'Side effects' },
  { id: 'after',      label: 'After vaccination' },
  { id: 'faq',        label: 'FAQs' },
]

export default function GuidePage() {
  useEffect(() => {
    logSiteEvent('guide_page_view')
  }, [])

  return (
    <>
      <SEO
        title="Puppy Vaccination Guide NZ — C3, C5, Schedules & Costs"
        description="Everything you need to know about puppy vaccinations in New Zealand. C3 vs C5, recommended schedules, what Kennel Cough and Leptospirosis vaccines do, costs, and how at-home vaccination works."
        path="/guide"
        schema={[GUIDE_SCHEMA, FAQ_SCHEMA]}
      />

      {/* Hero */}
      <div className="bg-primary pt-24 pb-16">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <p className="text-white/60 text-sm mb-3">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Puppy Vaccination Guide</span>
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 max-w-3xl leading-tight">
            The Complete NZ Puppy Vaccination Guide
          </h1>
          <p className="text-white/80 text-lg max-w-2xl leading-relaxed mb-8">
            C3 vs C5, recommended schedules, Kennel Cough, Leptospirosis, costs, and why more NZ families are choosing at-home vaccination over the clinic waiting room.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/intake">
              <Button className="bg-white text-primary hover:bg-white/90">
                Start your puppy's plan <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <button onClick={() => openChat()} className="text-white/90 hover:text-white text-sm font-semibold flex items-center gap-1.5 transition-colors">
              Ask a question →
            </button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="bg-bg min-h-screen">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 flex gap-12 items-start">

          {/* Sticky sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24">
            <p className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">On this page</p>
            <nav className="space-y-1">
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  onClick={() => logSiteEvent('guide_section_view', { section: s.id })}
                  className="block text-sm text-textSecondary hover:text-primary hover:font-medium transition-colors py-0.5">
                  {s.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 p-4 bg-white rounded-xl border border-border">
              <p className="text-xs font-semibold text-textPrimary mb-2">Ready to get started?</p>
              <p className="text-xs text-textMuted mb-3">Get your puppy's personalised plan in minutes.</p>
              <Link to="/intake" className="block text-center text-xs font-bold text-white bg-primary rounded-lg py-2 hover:bg-primary/90 transition-colors">
                Start now →
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-16">

            {/* ── SCHEDULE ──────────────────────────────────────────── */}
            <section id="schedule">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Puppy Vaccination Schedule — New Zealand</h2>
                <p className="text-textMuted text-sm mb-6">Recommended by the New Zealand Veterinary Association (NZVA)</p>
                <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-white text-left">
                        <th className="px-4 py-3 font-semibold rounded-tl-xl">Age</th>
                        <th className="px-4 py-3 font-semibold">Vaccine</th>
                        <th className="px-4 py-3 font-semibold rounded-tr-xl">What it covers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {[
                        { age: '6–8 weeks',  vaccine: 'C3',          covers: 'Distemper · Hepatitis · Parvovirus' },
                        { age: '10–12 weeks', vaccine: 'C5',         covers: 'Distemper · Hepatitis · Parvovirus · Parainfluenza · Kennel Cough' },
                        { age: '12–14 weeks', vaccine: 'Leptospirosis dose 1', covers: 'Leptospira serovars (lifestyle-dependent)' },
                        { age: '14–16 weeks', vaccine: 'C5 + Lepto dose 2', covers: 'Full core protection + Leptospirosis booster' },
                        { age: '12 months',  vaccine: 'C5 booster',  covers: 'Annual core booster — maintains full immunity' },
                        { age: 'Every year', vaccine: 'C5 (± Lepto)', covers: 'Annual booster programme' },
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-bg/50'}>
                          <td className="px-4 py-3 font-medium text-textPrimary whitespace-nowrap">{row.age}</td>
                          <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">{row.vaccine}</td>
                          <td className="px-4 py-3 text-textSecondary">{row.covers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-textMuted mt-3">Exact timing is personalised for each puppy by your VetPac veterinarian based on age, breed, and prior vaccination history.</p>
              </Reveal>
            </section>

            {/* ── C3 vs C5 ─────────────────────────────────────────── */}
            <section id="c3-vs-c5">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">C3 vs C5 — What's the Difference?</h2>
                <p className="text-textSecondary leading-relaxed mb-6">
                  The numbers refer to the number of diseases the vaccine protects against. Both are classified as <strong>core vaccines</strong> in New Zealand — meaning every puppy should receive them regardless of lifestyle.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">C3</span>
                      <span className="font-semibold text-textPrimary">3 diseases</span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-textSecondary">
                      {['Canine Distemper Virus', 'Canine Hepatitis (Adenovirus)', 'Canine Parvovirus'].map(d => (
                        <li key={d} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />{d}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-textMuted mt-3">Typically given at 6–8 weeks as the first puppy dose.</p>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-primary p-5 relative">
                    <div className="absolute -top-2.5 left-4 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">Standard from 10 weeks</div>
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">C5</span>
                      <span className="font-semibold text-textPrimary">5 diseases</span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-textSecondary">
                      {['Canine Distemper Virus', 'Canine Hepatitis (Adenovirus)', 'Canine Parvovirus', 'Parainfluenza Virus', 'Kennel Cough (Bordetella)'].map(d => (
                        <li key={d} className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />{d}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-textMuted mt-3">Used for doses 2 &amp; 3, annual boosters, and any dog boarding or going to daycare.</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <strong>Important:</strong> Parvovirus is extremely resilient — it can survive in soil for years and is transmitted on shoes, hands, and surfaces. Puppies are highly vulnerable before their vaccine course is complete. Keep your puppy away from public areas until 2 weeks after their final dose.
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── LEPTOSPIROSIS ────────────────────────────────────── */}
            <section id="lepto">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">Leptospirosis — Do NZ Puppies Need It?</h2>
                <p className="text-textSecondary leading-relaxed mb-4">
                  Leptospirosis is a bacterial disease spread through the urine of infected animals — most commonly rats, possums, and cattle. In New Zealand, it poses a genuine risk for dogs with outdoor or rural exposure, and it is also transmissible to humans.
                </p>
                <p className="text-textSecondary leading-relaxed mb-4">
                  The Leptospirosis vaccine is classified as a <em>non-core</em> vaccine in NZ, meaning it is recommended based on your puppy's lifestyle, not universally. Your VetPac assessment asks specifically about farm access, waterways, and wildlife — and your vet will include it in your programme if warranted.
                </p>
                <div className="bg-white rounded-xl border border-border p-5 mb-4">
                  <p className="font-semibold text-textPrimary mb-3 text-sm">Leptospirosis is recommended if your puppy:</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-textSecondary">
                    {[
                      'Lives on or visits a farm',
                      'Swims in rivers, lakes, or streams',
                      'Has contact with livestock or wildlife',
                      'Lives in a rural area with high rodent activity',
                      'Is in contact with other dogs with rural exposure',
                      'Has exposure to standing or slow-moving water',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-textSecondary text-sm leading-relaxed">
                  The vaccination requires two doses 2–4 weeks apart starting at 12 weeks of age, followed by annual boosters. VetPac includes Leptospirosis in your programme automatically if your intake responses indicate lifestyle risk.
                </p>
              </Reveal>
            </section>

            {/* ── KENNEL COUGH ─────────────────────────────────────── */}
            <section id="kennel-cough">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">Kennel Cough — What Is It and Does My Puppy Need the Vaccine?</h2>
                <p className="text-textSecondary leading-relaxed mb-4">
                  Kennel Cough (Infectious Tracheobronchitis) is a highly contagious respiratory infection that spreads rapidly wherever dogs are in close contact — boarding kennels, dog parks, grooming salons, and vet waiting rooms. In most adult dogs it resolves on its own, but it can be severe in young puppies.
                </p>
                <p className="text-textSecondary leading-relaxed mb-4">
                  The C5 vaccine includes protection against the two primary Kennel Cough pathogens: <em>Bordetella bronchiseptica</em> and <em>Parainfluenza virus</em>. Most boarding facilities and doggy day care centres require proof of C5 vaccination before they will accept your dog.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { icon: Activity, title: 'Symptoms', body: 'Harsh honking cough, gagging, nasal discharge, sometimes lethargy. Usually mild in adults but can progress in puppies.' },
                    { icon: Clock, title: 'Duration', body: '1–3 weeks in mild cases. Can progress to pneumonia in young, elderly, or immunocompromised dogs.' },
                    { icon: Shield, title: 'Prevention', body: 'C5 vaccination provides strong protection against the most common strains. Annual boosters required to maintain immunity.' },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="bg-white rounded-xl border border-border p-4">
                      <Icon className="w-5 h-5 text-primary mb-2" />
                      <p className="font-semibold text-textPrimary text-sm mb-1.5">{title}</p>
                      <p className="text-xs text-textSecondary leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
                <p className="text-textSecondary text-sm leading-relaxed">
                  The C5 vaccine is included in VetPac's standard puppy programme from the second dose onwards. If you specifically need Kennel Cough-only boosters between programmes, VetPac can arrange that too.
                </p>
              </Reveal>
            </section>

            {/* ── PARVOVIRUS ───────────────────────────────────────── */}
            <section id="parvo">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">Parvovirus — The Disease Every Puppy Owner Needs to Know About</h2>
                <p className="text-textSecondary leading-relaxed mb-4">
                  Canine Parvovirus (CPV) is one of the most serious threats facing unvaccinated puppies in New Zealand. It attacks the gastrointestinal system and immune cells, causing severe vomiting, bloody diarrhoea, and dehydration. Without intensive veterinary care, it is often fatal.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-900">
                    <strong>Parvovirus is endemic in New Zealand.</strong> The virus survives in soil and on surfaces for up to 12 months. Your puppy can be exposed through contaminated ground in a park, on a footpath, or even from shoes tracked indoors — before they've ever met another dog.
                  </div>
                </div>
                <p className="text-textSecondary leading-relaxed mb-4">
                  The good news: Parvovirus is entirely vaccine-preventable. The C3 and C5 vaccines include a highly effective Parvovirus component. However, full immunity only develops 7–14 days after completing the three-dose puppy course. Keep unvaccinated or partially vaccinated puppies away from high-risk environments.
                </p>
                <p className="text-textSecondary leading-relaxed text-sm">
                  This is one reason why a clinic waiting room — full of sick or potentially sick dogs — carries a higher exposure risk than your own home. At-home vaccination eliminates that waiting room exposure entirely.
                </p>
              </Reveal>
            </section>

            {/* ── COST ─────────────────────────────────────────────── */}
            <section id="cost">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">How Much Do Puppy Vaccinations Cost in New Zealand?</h2>
                <p className="text-textSecondary leading-relaxed mb-6">
                  The cost of puppy vaccinations in NZ varies significantly by provider. Clinic fees typically include a consultation charge (even if brief), plus the vaccine itself. Here's how VetPac compares to a standard clinic visit:
                </p>
                <div className="overflow-x-auto rounded-xl border border-border shadow-sm mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left border-b border-border">
                        <th className="px-4 py-3 font-semibold text-textPrimary">Item</th>
                        <th className="px-4 py-3 font-semibold text-textMuted text-center">Typical NZ clinic</th>
                        <th className="px-4 py-3 font-semibold text-primary text-center">VetPac</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {[
                        { item: 'Initial consultation / intake', clinic: '$60–$90', vetpac: '$49' },
                        { item: 'C3 vaccine (dose 1)', clinic: '$50–$80', vetpac: '$89 + cold-chain delivery' },
                        { item: 'C5 vaccine (dose 2)', clinic: '$60–$90', vetpac: '$89 + cold-chain delivery' },
                        { item: 'C5 vaccine (dose 3)', clinic: '$60–$90', vetpac: '$89 + cold-chain delivery' },
                        { item: 'Travel / time cost (yours)', clinic: '3× clinic trips', vetpac: 'None — delivered to you' },
                        { item: 'Waiting room disease exposure', clinic: 'Yes', vetpac: 'None' },
                        { item: 'Programme warranty available', clinic: 'No', vetpac: 'Yes — $225 covers adverse reactions' },
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-bg/40'}>
                          <td className="px-4 py-3 text-textPrimary">{row.item}</td>
                          <td className="px-4 py-3 text-textMuted text-center">{row.clinic}</td>
                          <td className="px-4 py-3 text-primary font-medium text-center">{row.vetpac}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-textSecondary text-sm leading-relaxed">
                  A full 3-dose VetPac puppy programme (consultation + 3 vaccines + 3 cold-chain deliveries) costs approximately <strong>$624</strong>. This includes vet-reviewed intake, personalised plan, digital health record, vaccination certificate, and around-the-clock support.
                </p>
              </Reveal>
            </section>

            {/* ── AT-HOME ──────────────────────────────────────────── */}
            <section id="at-home">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">At-Home Puppy Vaccination — How VetPac Works</h2>
                <p className="text-textSecondary leading-relaxed mb-6">
                  At-home vaccination isn't a shortcut — it's a clinically safer approach for many puppies. A NZ-registered veterinarian personally reviews and signs off every VetPac programme before a single vaccine is dispatched.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    {
                      num: '1',
                      title: 'AI-assisted health intake',
                      body: 'Our intelligent intake asks the right questions — breed, age, lifestyle, prior vaccinations, health history — and builds a preliminary programme. Reviewed and authorised by a NZ-registered vet.',
                    },
                    {
                      num: '2',
                      title: 'Cold-chain delivery to your door',
                      body: 'Vaccines are pharmaceutical-grade, single-use, and shipped in temperature-controlled cold-chain packaging maintaining 2–8°C throughout transit. A temperature indicator strip confirms the cold chain was maintained on arrival.',
                    },
                    {
                      num: '3',
                      title: 'You administer, or we send a technician',
                      body: 'Self-administration is straightforward with our step-by-step guidance and 24/7 support chat. Prefer someone to do it for you? Book a VetPac technician (VetPac Assist) for a home visit.',
                    },
                    {
                      num: '4',
                      title: 'Signed certificate, digital record',
                      body: 'Every dose is logged. Your vaccination certificate is accepted by boarding facilities, groomers, and vets across New Zealand. Your puppy\'s full health record lives in your VetPac dashboard.',
                    },
                  ].map(step => (
                    <div key={step.num} className="flex gap-4 bg-white rounded-xl border border-border p-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{step.num}</div>
                      <div>
                        <p className="font-semibold text-textPrimary text-sm mb-1">{step.title}</p>
                        <p className="text-xs text-textSecondary leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <HomeIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-textPrimary text-sm mb-1.5">Why home is often safer than a waiting room</p>
                      <p className="text-xs text-textSecondary leading-relaxed">
                        Clinic waiting rooms bring together sick dogs, stressed animals, and potentially unvaccinated pets. For a puppy whose immune system is still developing, that environment carries real risk — particularly for Parvovirus, Kennel Cough, and Distemper. Your home has none of those pathogens. Vaccinating at home means your puppy's immune response builds in the cleanest possible environment.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* ── SIDE EFFECTS ─────────────────────────────────────── */}
            <section id="side-effects">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">Puppy Vaccination Side Effects — What to Expect</h2>
                <p className="text-textSecondary leading-relaxed mb-4">
                  Most puppies sail through vaccination with no reaction at all. Mild responses are normal and a sign the immune system is working. Serious reactions are rare — and your puppy is in their own home throughout, with support available 24/7.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-700" />
                      <p className="font-semibold text-green-900 text-sm">Normal (no action needed)</p>
                    </div>
                    <ul className="text-xs text-green-900 space-y-1.5">
                      {[
                        'Mild lethargy for 12–24 hours',
                        'Small, firm lump at injection site (resolves in 1–2 weeks)',
                        'Reduced appetite for 24 hours',
                        'Mild tenderness at injection site',
                      ].map(i => <li key={i} className="flex gap-1.5"><span>·</span>{i}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-700" />
                      <p className="font-semibold text-red-900 text-sm">Contact us immediately if</p>
                    </div>
                    <ul className="text-xs text-red-900 space-y-1.5">
                      {[
                        'Facial swelling, hives, or pale gums',
                        'Vomiting or diarrhoea within 1 hour',
                        'Difficulty breathing or collapse',
                        'Extreme lethargy or inability to stand',
                      ].map(i => <li key={i} className="flex gap-1.5"><span>·</span>{i}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="text-textSecondary text-sm leading-relaxed">
                  Anaphylactic reactions occur in fewer than 0.065% of vaccine doses. VetPac's pre-vaccination checklist and 30-minute observation window are included in every programme. Our support team is available around the clock to triage any concerns.
                </p>
              </Reveal>
            </section>

            {/* ── AFTER ────────────────────────────────────────────── */}
            <section id="after">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-4">After Vaccination — What Your Puppy Can and Can't Do</h2>
                <p className="text-textSecondary leading-relaxed mb-4">
                  Immunity builds gradually after vaccination — it takes 7–14 days after the final dose for full protection to develop. Here's a practical guide to the rules by stage:
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    {
                      stage: 'After dose 1 (C3)',
                      allowed: ['Carry your puppy outdoors briefly for socialisation (don\'t let them walk on grass in public areas)', 'Meet healthy, fully vaccinated adult dogs in your own home or garden', 'Puppy classes in clean, indoor, pre-screened environments'],
                      avoid: ['Unvaccinated dogs', 'Dog parks, footpaths, or any area other dogs visit', 'Pet shops or vet waiting rooms'],
                    },
                    {
                      stage: 'After dose 2 (C5 — 10–12 weeks)',
                      allowed: ['Supervised play with vaccinated dogs', 'Short, low-risk outdoor exposure on clean surfaces', 'Puppy socialisation classes (check vaccination requirements)'],
                      avoid: ['High-traffic dog areas', 'Boarding kennels until 2 weeks after final dose'],
                    },
                    {
                      stage: '2 weeks after dose 3 (fully protected)',
                      allowed: ['Dog parks, beaches, footpaths — all the normal puppy life', 'Boarding kennels (C5 certificate provided by VetPac)', 'Puppy classes, daycare, grooming'],
                      avoid: ['Letting the annual booster lapse — immunity fades without it'],
                    },
                  ].map(s => (
                    <div key={s.stage} className="bg-white rounded-xl border border-border p-4">
                      <p className="font-semibold text-textPrimary text-sm mb-3">{s.stage}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1.5">✓ OK to do</p>
                          <ul className="space-y-1">{s.allowed.map(a => <li key={a} className="text-xs text-textSecondary flex gap-1.5"><span className="text-green-500">·</span>{a}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1.5">✗ Avoid</p>
                          <ul className="space-y-1">{s.avoid.map(a => <li key={a} className="text-xs text-textSecondary flex gap-1.5"><span className="text-red-400">·</span>{a}</li>)}</ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* ── FAQS ─────────────────────────────────────────────── */}
            <section id="faq">
              <Reveal>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-6">Frequently Asked Questions</h2>
                <div className="bg-white rounded-xl border border-border divide-y divide-border px-4">
                  {[
                    { q: 'When should my puppy get their first vaccination in NZ?', a: 'The first vaccine (C3) is given at 6–8 weeks of age. This is typically done by the breeder before the puppy leaves for their new home. If it hasn\'t been done, start as soon as possible — your VetPac vet will design the programme around your puppy\'s actual age and history.' },
                    { q: 'What if my puppy already had some vaccinations from the breeder?', a: 'That\'s common. Your VetPac intake asks specifically about prior vaccinations — product used, dose number, and date. Your vet will continue the programme from wherever your puppy left off, so there\'s no unnecessary repeating and no gaps.' },
                    { q: 'Can I take my puppy to the park before they\'re fully vaccinated?', a: 'Not to areas where unvaccinated dogs may have been — so no dog parks, footpaths in public areas, or shared grass. You can safely carry your puppy for social exposure, or let them socialise with fully vaccinated dogs in clean private environments.' },
                    { q: 'What if I miss a vaccination?', a: 'It depends on the gap. A short delay (1–2 weeks) is usually fine — continue the programme as planned. A longer gap may require restarting depending on the age and products involved. Chat with us and your VetPac vet will advise.' },
                    { q: 'Do puppies really need annual boosters?', a: 'Yes. Vaccine immunity for most core diseases fades after 1–3 years depending on the product. Annual C5 boosters are required to maintain full protection. Most boarding facilities also require current vaccination certificates — VetPac provides these for every dose.' },
                    { q: 'Is VetPac available in my area?', a: 'VetPac covers all regions of New Zealand, including rural addresses. Cold-chain delivery reaches every part of the country. If you have a question about your specific location, chat with us and we\'ll confirm.' },
                    { q: 'Does the VetPac vaccination certificate get accepted by boarding kennels?', a: 'Yes. Your signed VetPac certificate records the vaccine product, batch number, date, and authorising veterinarian. It meets the requirements of boarding facilities, doggy day care, groomers, and vets across New Zealand.' },
                    { q: 'What is VetPac Assist?', a: 'VetPac Assist is our home visit service. A trained VetPac technician comes to your home and administers the vaccine for you. Available nationwide, usually same-day or next-day. Costs $229 per visit in addition to the vaccine.' },
                    { q: 'How is VetPac different from The Vet Clinic, Auckland Pet Hospital, or Vets North?', a: 'Traditional clinics require you to bring your puppy to them — with all the stress and waiting room exposure that entails. VetPac brings the vaccination to you. Your puppy stays in a calm, familiar environment, a NZ vet authorises the programme, and cold-chain delivery ensures the vaccine integrity is maintained. For many families it\'s more convenient and clinically no different in outcome.' },
                    { q: 'What is the VetPac Programme Warranty?', a: 'For $225 (one-time), the VetPac Warranty covers vaccine failure and adverse reactions for the duration of your puppy\'s programme — up to $5,000. It\'s backed by an actuarial model based on published veterinary literature. See the full terms on our Warranty page.' },
                  ].map((item, i) => <FAQ key={i} q={item.q} a={item.a} />)}
                </div>
              </Reveal>
            </section>

            {/* ── BOTTOM CTA ───────────────────────────────────────── */}
            <Reveal>
              <div className="bg-primary rounded-2xl p-8 text-center">
                <Syringe className="w-8 h-8 text-white/70 mx-auto mb-3" />
                <h2 className="font-display font-bold text-2xl text-white mb-2">Ready to protect your puppy?</h2>
                <p className="text-white/80 mb-6 max-w-lg mx-auto">
                  Start your puppy's personalised vaccination plan. Takes 5 minutes — your VetPac vet reviews and authorises before anything is dispatched.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/intake">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      Start health plan <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <button onClick={() => openChat()}
                    className="text-white/90 hover:text-white text-sm font-semibold transition-colors">
                    Ask a question first →
                  </button>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </div>
    </>
  )
}
