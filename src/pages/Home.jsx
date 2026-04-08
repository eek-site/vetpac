import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Shield, Truck, Star, ChevronDown, ChevronUp,
  CheckCircle, Clock, Phone, BadgeCheck, Thermometer, Video,
  ClipboardList, Package, Syringe, Bot,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { FAQ_ITEMS, CONSULTATION_FEE, VACCINE_PRODUCTS, FREIGHT } from '../lib/constants'

function useIntersection(ref, threshold = 0.12) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return visible
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const visible = useIntersection(ref)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  const lines = a.split('\n').filter(Boolean)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-textPrimary group-hover:text-primary transition-colors">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center transition-colors group-hover:border-primary group-hover:bg-primary/5">
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
            : <ChevronDown className="w-3.5 h-3.5 text-textMuted" />
          }
        </span>
      </button>
      {open && (
        <div className="pb-6 space-y-3 -mt-1">
          {lines.map((line, i) => (
            <p key={i} className="text-textSecondary text-sm leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

const testimonials = [
  {
    name: 'Sarah M.', location: 'Auckland',
    text: 'The VOI arrived in my inbox within two hours and the vaccines were on my doorstep the next morning. Milo barely noticed. Honestly couldn\'t have been smoother.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&h=120&fit=crop&q=80',
    dogName: 'Milo',
    breed: 'Golden Retriever',
  },
  {
    name: 'Tom K.', location: 'Wellington',
    text: 'Three vet trips avoided. Biscuit is terrified of the clinic — she was shaking before we even got in the door last time. This was night and day. Calm dog, done in ten minutes.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&h=120&fit=crop&q=80',
    dogName: 'Biscuit',
    breed: 'Labrador mix',
  },
  {
    name: 'Rachel B.', location: 'Christchurch',
    text: 'I added VetPac Assist because I was nervous about the injection. The technician was at my door at 9am, done by 9:08am. Luna slept through the whole thing.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=120&h=120&fit=crop&q=80',
    dogName: 'Luna',
    breed: 'Border Collie',
  },
]

const galleryPhotos = [
  { src: 'https://images.unsplash.com/photo-1760970902153-8d4d8535bb0a?w=600&h=500&fit=crop&q=80', alt: 'Puppy in golden sunset' },
  { src: 'https://images.unsplash.com/photo-1760448983438-f891ddf09eef?w=600&h=500&fit=crop&q=80', alt: 'Golden retriever puppy' },
  { src: 'https://images.unsplash.com/photo-1755962179802-734c1cc178ac?w=600&h=500&fit=crop&q=80', alt: 'Puppy peeking over box' },
  { src: 'https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=600&h=500&fit=crop&q=80', alt: 'Golden retriever portrait' },
  { src: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&h=500&fit=crop&q=80', alt: 'Puppy outdoors' },
]

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-bg pt-20 pb-0 flex flex-col relative overflow-hidden">
        <div className="max-w-content mx-auto px-4 sm:px-6 w-full flex-1 flex items-center py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 lg:gap-12 items-center w-full">

            {/* Copy */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 border border-primary/15">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                NZ's first at-home pet vaccination service
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl xl:text-[3.5rem] text-textPrimary mb-6 leading-[1.08]">
                Your puppy gets a vet.<br />
                <span className="text-primary">Your sofa gets the visit.</span>
              </h1>

              <p className="text-lg text-textSecondary leading-relaxed mb-8 max-w-[480px]">
                NZ-registered vets issue every vaccine plan. The same vaccines your local clinic uses — cold-chain delivered to your door. No appointment. No waiting room. No stressed puppy.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/intake">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Start your puppy's health plan
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    See how it works
                  </Button>
                </a>
              </div>

              {/* Trust row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: BadgeCheck, label: 'VCNZ-registered vets', sub: 'Every order reviewed' },
                  { icon: Thermometer, label: '2–8°C cold chain', sub: 'Temperature guaranteed' },
                  { icon: Shield, label: 'VOI issued per order', sub: 'Legally authorised' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 bg-white rounded-card px-3.5 py-3 border border-border shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-textPrimary leading-tight">{label}</p>
                      <p className="text-xs text-textMuted leading-tight">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="relative rounded-card-lg overflow-hidden shadow-card-hover" style={{ aspectRatio: '4/5' }}>
                <img
                  src="https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=900&h=1200&fit=crop&q=85"
                  alt="Golden retriever puppy portrait"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Floating card — order ready */}
                <div className="absolute bottom-5 left-4 right-4">
                  <div className="bg-white rounded-card shadow-card-hover p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textPrimary truncate">Bella's C5 vaccine — dose 2</p>
                      <p className="text-xs text-green-600 font-medium">Vet-approved · Dispatched today</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Floating badge — top left */}
                <div className="absolute top-4 left-4">
                  <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    Vet-reviewed within 4 hrs
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── EDITORIAL PULL QUOTE ─────────────────────────────────────────────── */}
      <section className="bg-primary py-20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <Reveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-white leading-snug font-medium">
              "The same vaccines your vet uses. The same clinical oversight you'd expect.
              <span className="text-accent"> Just without the waiting room."</span>
            </p>
            <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
              {[
                'ACVM Act 1997 compliant',
                'VCNZ-registered vets only',
                'MPI-approved vaccine suppliers',
              ].map(badge => (
                <div key={badge} className="flex items-center gap-2 text-white/70 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── WHY AT HOME? ─────────────────────────────────────────────────────── */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">The VetPac difference</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">
                Home isn't just easier. It's better.
              </h2>
              <p className="text-textSecondary max-w-xl mx-auto">
                This isn't a compromise on care. It's a better approach — for your puppy, and for you.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Unvaccinated puppies shouldn\'t share waiting rooms.',
                body: 'A vet clinic is where sick animals go. An unvaccinated puppy sitting in that waiting room is exposed to the exact pathogens they haven\'t yet been protected against. VetPac vaccines arrive before your puppy ever needs to set foot in a clinic.',
                color: 'text-primary/8',
              },
              {
                num: '02',
                title: 'Cortisol suppresses immune response.',
                body: 'Stress measurably alters how a dog\'s immune system processes a vaccine. A puppy vaccinated at home — calm, in familiar surroundings, with their owner present — has a better physiological response than one vaccinated in a state of panic.',
                color: 'text-accent/10',
              },
              {
                num: '03',
                title: 'Three appointments is three afternoons.',
                body: 'A full puppy course requires 3 vet visits, 3 bookings, 3 waits, 3 trips. With VetPac, you complete one 10-minute intake once. The vet reviews it. The vaccines arrive. That\'s the whole process.',
                color: 'text-primary/8',
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="relative bg-white rounded-card-lg p-8 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">
                  <div className={`absolute -top-4 -right-2 font-display font-bold text-9xl leading-none select-none ${card.color}`}>
                    {card.num}
                  </div>
                  <div className="relative">
                    <h3 className="font-semibold text-textPrimary text-lg mb-4 leading-snug">{card.title}</h3>
                    <p className="text-textSecondary text-sm leading-relaxed">{card.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Simple process</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">From intake to injection in 24 hours</h2>
              <p className="text-textSecondary max-w-xl mx-auto">One form. One fee. Your vet's plan in your inbox the same day.</p>
            </div>
          </Reveal>

          <div className="relative">
            {/* Connecting line desktop */}
            <div className="hidden md:block absolute top-[38px] left-[10%] right-[10%] h-px bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { icon: Bot, label: 'Complete your intake', desc: 'Answer questions about your puppy\'s health, history, and lifestyle. Takes around 10 minutes.' },
                { icon: Video, label: 'Record a short video', desc: 'A 90-second clip of your puppy walking and their face. No special setup needed.' },
                { icon: ClipboardList, label: 'Vet reviews everything', desc: 'A NZ-registered vet reviews your intake and video and issues your Veterinary Operating Instruction.' },
                { icon: Truck, label: 'Vaccines arrive at your door', desc: 'Cold-chain couriered to your address. Temperature indicator strip confirms the cold chain was maintained.' },
                { icon: Syringe, label: 'Administer at home', desc: 'Follow the step-by-step video guide. Subcutaneous injection at the scruff. Takes under 2 minutes.' },
              ].map((step, i) => {
                const Icon = step.icon
                return (
                  <Reveal key={i} delay={i * 80}>
                    <div className="flex flex-col items-center text-center relative">
                      <div className="w-[76px] h-[76px] rounded-full bg-white border-2 border-border flex items-center justify-center mb-4 z-10 shadow-sm">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-3 -mt-1 z-10 shadow">
                        {i + 1}
                      </div>
                      <h3 className="font-semibold text-textPrimary text-sm mb-2">{step.label}</h3>
                      <p className="text-textMuted text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>

          <Reveal>
            <div className="mt-14 bg-accent/8 rounded-card-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-accent/20">
              <div>
                <p className="font-semibold text-textPrimary">Would you rather we do the injection for you?</p>
                <p className="text-textSecondary text-sm mt-0.5">Add VetPac Assist — a trained technician comes to your home. Auckland only.</p>
              </div>
              <Link to="/intake" className="flex-shrink-0">
                <Button variant="accent">Add VetPac Assist +$59</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PUPPY VIDEO REEL ─────────────────────────────────────────────────── */}
      <section className="bg-bg py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Happy at home</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">This is what it looks like</h2>
              <p className="text-textSecondary max-w-lg mx-auto">Protected puppies. Relaxed owners. No clinic car park required.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-corgi-puppy-playing-with-a-toy-with-its-owner-45873-large.mp4',
                poster: 'https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=600&h=450&fit=crop&q=80',
                caption: 'Protected & playful',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-young-girl-playing-with-a-puppy-6178-large.mp4',
                poster: 'https://images.unsplash.com/photo-1760448983438-f891ddf09eef?w=600&h=450&fit=crop&q=80',
                caption: 'At ease at home',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-little-dog-running-in-snow-in-slow-motion-25225-large.mp4',
                poster: 'https://images.unsplash.com/photo-1760970902153-8d4d8535bb0a?w=600&h=450&fit=crop&q=80',
                caption: 'Healthy for life',
              },
            ].map((vid, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="group relative rounded-card-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 bg-black" style={{ aspectRatio: '4/3' }}>
                  <video
                    autoPlay muted loop playsInline poster={vid.poster}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700"
                  >
                    <source src={vid.src} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <p className="absolute bottom-4 left-4 text-white font-semibold text-sm">{vid.caption}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Transparent pricing</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">
                Two simple steps. No surprises.
              </h2>
              <p className="text-textSecondary max-w-xl mx-auto">
                Pay for the consultation first. Once the vet has assessed your dog, you see exactly what vaccines are needed and confirm before anything ships.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Stage 1 */}
            <Reveal>
              <div className="bg-white rounded-card-lg border-2 border-primary p-8 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-textPrimary">Consultation & Vet Review</p>
                    <p className="text-xs text-textMuted">Paid upfront. Fixed fee.</p>
                  </div>
                  <span className="ml-auto font-mono font-bold text-2xl text-primary">$75</span>
                </div>
                <ul className="space-y-2.5 mb-5">
                  {CONSULTATION_FEE.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-textSecondary">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-primary font-medium bg-primary/5 rounded-card px-3 py-2">
                  Refunded in full if your vet recommends an in-person clinic visit.
                </p>
              </div>
            </Reveal>

            {/* Stage 2 */}
            <Reveal delay={100}>
              <div className="bg-bg rounded-card-lg border-2 border-border p-8 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-accent text-white font-bold text-sm flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-textPrimary">Your Vaccine Plan</p>
                    <p className="text-xs text-textMuted">Itemised after the vet's assessment.</p>
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { label: 'C3 vaccine (first dose)', price: VACCINE_PRODUCTS.C3.price },
                    { label: 'C5 vaccine (per dose)', price: VACCINE_PRODUCTS.C5.price },
                    { label: 'Leptospirosis (if recommended)', price: VACCINE_PRODUCTS.LEPTO.price },
                    { label: 'Kennel Cough (if recommended)', price: VACCINE_PRODUCTS.KENNEL_COUGH.price },
                    { label: 'Cold-chain freight (per shipment)', price: FREIGHT.pricePerShipment },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0">
                      <span className="text-textSecondary">{row.label}</span>
                      <span className="font-mono font-semibold text-textPrimary">NZD ${row.price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-textMuted">
                  You see the full itemised plan before confirming. Only the vaccines your dog actually needs are included.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Simple comparison note */}
          <Reveal>
            <div className="bg-primary/5 rounded-card-lg p-5 border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-textSecondary text-sm">
                <strong className="text-textPrimary">A typical 3-dose puppy course with VetPac costs around NZD $343</strong> — consultation, all three vaccines, and cold-chain freight included.
                A NZ vet clinic charges around $140 per visit (consult + vaccine), so three visits = $420+.
              </p>
              <Link to="/intake" className="flex-shrink-0">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SAFETY & COMPLIANCE ──────────────────────────────────────────────── */}
      <section className="bg-primary py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-4">Legal framework</p>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-6 leading-tight">
                  Vet-authorised.<br />Every single order.
                </h2>
                <p className="text-primary-light leading-relaxed mb-8">
                  VetPac operates under the <strong className="text-white">Veterinary Operating Instruction (VOI) framework</strong> — the same legal mechanism NZ farmers have used for decades to vaccinate their own livestock and working dogs without a vet being physically present.
                </p>
                <p className="text-primary-light leading-relaxed mb-8">
                  A VOI is issued under <strong className="text-white">section 44G of the ACVM Act 1997</strong> by a NZ-registered vet. It authorises you, by name, to purchase and administer specific vaccines to your specific animal. This is not a grey area — it is an established, well-understood provision of NZ veterinary law.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: BadgeCheck, text: 'VCNZ Annual Practising Certificate' },
                    { icon: ClipboardList, text: 'VOI issued per order, kept 7 years' },
                    { icon: Thermometer, text: 'Pharmaceutical cold-chain only' },
                    { icon: Shield, text: 'Adverse events reported to MPI' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 bg-white/10 rounded-card px-4 py-3 border border-white/10">
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-white/90 text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-card-lg p-7 border border-white/10 backdrop-blur-sm">
                  <p className="text-white font-semibold mb-3">Your VOI document includes:</p>
                  <ul className="space-y-2.5">
                    {[
                      'Your full name and date of birth',
                      "Your dog's name, breed, weight, age, and sex",
                      'Specific vaccines authorised — product name, dose, route, site',
                      'Administration schedule with exact dates',
                      "Issuing vet's name and VCNZ registration number",
                      'Valid from/until dates (max 12 months)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/85">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/10 rounded-card p-4 border border-white/10 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white text-sm">0800 VETPAC — 24/7 Emergency Line</p>
                    <p className="text-primary-light text-xs mt-0.5">On-call vet technician for any post-administration concerns. Every order includes this number on the packaging and in your confirmation email.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">From NZ dog owners</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">
                Rated 4.9 / 5
              </h2>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-warning fill-warning" />)}
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white rounded-card-lg shadow-card p-8 flex flex-col h-full border border-border/60">
                  <div className="flex items-center gap-4 mb-5">
                    <img
                      src={t.dogPhoto}
                      alt={t.dogName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-border flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-textPrimary text-sm">{t.name}</p>
                      <p className="text-textMuted text-xs">{t.location}</p>
                      <p className="text-textMuted text-xs">{t.dogName} · {t.breed}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />)}
                  </div>
                  <p className="text-textSecondary text-sm leading-relaxed italic flex-grow">"{t.text}"</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ──────────────────────────────────────────────────────── */}
      <section className="py-6 bg-bg overflow-hidden">
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 px-4 sm:px-6 max-w-content mx-auto">
          {galleryPhotos.map((photo, i) => (
            <div key={i} className="flex-shrink-0 w-52 h-40 rounded-card overflow-hidden shadow-card">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Questions answered</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary">Everything you need to know</h2>
            </div>
          </Reveal>
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1760970902153-8d4d8535bb0a?w=1600&h=700&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/85" />
        </div>
        <div className="relative max-w-content mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-5 leading-tight">
              Your puppy's health plan is<br />10 minutes away.
            </h2>
            <p className="text-primary-light text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Vet review in hours. Cold-chain delivery the next day. No waiting room, no stressed puppy, no three-trip programme.
            </p>
            <Link to="/intake">
              <Button variant="accent" size="xl" className="shadow-lg">
                Start your dog's health plan
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-primary-light/70 text-sm mt-5">No payment until your vet plan is confirmed.</p>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
