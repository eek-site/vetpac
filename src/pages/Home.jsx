import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Star, ChevronDown, ChevronUp,
  CheckCircle, Package, Syringe, Bot, Truck, Video,
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
    text: 'Done before my morning coffee was cold. Milo was calm the whole time — totally different to dragging him to the clinic.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&h=120&fit=crop&q=80',
    dogName: 'Milo', breed: 'Golden Retriever',
  },
  {
    name: 'Tom K.', location: 'Wellington',
    text: 'Biscuit shook the entire drive to the vet, every single time. This was just... easy. Box arrived, ten minutes, done.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&h=120&fit=crop&q=80',
    dogName: 'Biscuit', breed: 'Labrador mix',
  },
  {
    name: 'Rachel B.', location: 'Christchurch',
    text: 'I added the home visit option. The technician was at my door at 9am, done by 9:08. Luna slept through the whole thing.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=120&h=120&fit=crop&q=80',
    dogName: 'Luna', breed: 'Border Collie',
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

            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 border border-primary/15">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                NZ's first at-home pet vaccination service
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl xl:text-[3.5rem] text-textPrimary mb-6 leading-[1.08]">
                Your puppy's vaccines,<br />
                <span className="text-primary">at home. Today.</span>
              </h1>

              <p className="text-lg text-textSecondary leading-relaxed mb-8 max-w-[480px]">
                Fill in a 10-minute form. Your dog's vaccine plan is confirmed. The vaccines arrive cold-chain couriered to your door — you give them at home, on your schedule.
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

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {['No appointment needed', 'Delivered to your door', 'No waiting room', 'NZ-wide delivery'].map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-sm text-textSecondary">
                    <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="relative rounded-card-lg overflow-hidden shadow-card-hover" style={{ aspectRatio: '4/5' }}>
                <img
                  src="https://images.unsplash.com/photo-1599692392256-2d084495fe15?w=900&h=1200&fit=crop&q=85"
                  alt="Golden retriever puppy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-4 right-4">
                  <div className="bg-white rounded-card shadow-card-hover p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textPrimary truncate">Bella's vaccines — dose 2</p>
                      <p className="text-xs text-green-600 font-medium">Approved · Dispatched today</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4">
                  <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    Confirmed within 4 hrs
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ───────────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <Reveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-white leading-snug font-medium">
              "No appointment. No car trip. No waiting room.
              <span className="text-accent"> Your dog stays calm. The job gets done."</span>
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── WHY AT HOME? ─────────────────────────────────────────────────────── */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Why at home</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">
                Home isn't a compromise. It's better.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Your puppy stays calm.',
                body: 'A dog vaccinated in a familiar environment with their owner present is a relaxed dog. No car. No strange smells. No other anxious animals in the waiting room. Just home.',
                color: 'text-primary/8',
              },
              {
                num: '02',
                title: 'No appointments. Ever.',
                body: 'You fill in one form. Your plan is confirmed. The vaccines ship. Every dose arrives at the right time — you don\'t book anything, chase anything, or wait for anything.',
                color: 'text-accent/10',
              },
              {
                num: '03',
                title: 'Three trips become one form.',
                body: 'A full puppy course normally means 3 separate clinic visits. With VetPac you do the intake once and your doses arrive on schedule. Your afternoons stay yours.',
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
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">How it works</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">Done in 24 hours.</h2>
              <p className="text-textSecondary max-w-xl mx-auto">One form. Vaccines confirmed. Box at your door.</p>
            </div>
          </Reveal>

          <div className="relative">
            <div className="hidden md:block absolute top-[38px] left-[10%] right-[10%] h-px bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { icon: Bot, label: 'Tell us about your dog', desc: 'Answer a few questions about your dog\'s history and lifestyle. Takes about 10 minutes.' },
                { icon: Video, label: 'Record a quick video', desc: 'A short clip of your dog walking and their face. No special setup needed.' },
                { icon: CheckCircle, label: 'Plan confirmed', desc: 'Your personalised vaccine plan is reviewed and confirmed. You\'ll hear back within 4 hours.' },
                { icon: Truck, label: 'Vaccines delivered', desc: 'Cold-chain couriered to your door with a temperature indicator strip. Usually next day.' },
                { icon: Syringe, label: 'Give at home', desc: 'Follow the step-by-step guide included in the box. Under 2 minutes. Or add our home visit.' },
              ].map((step, i) => {
                const Icon = step.icon
                return (
                  <Reveal key={i} delay={i * 80}>
                    <div className="flex flex-col items-center text-center">
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
                <Button variant="accent">Add VetPac Assist</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── VIDEO REEL ───────────────────────────────────────────────────────── */}
      <section className="bg-bg py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Happy at home</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">This is what it looks like</h2>
              <p className="text-textSecondary max-w-lg mx-auto">Calm dogs. Happy owners. No car park required.</p>
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
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">
                Simple. Transparent. No surprises.
              </h2>
              <p className="text-textSecondary max-w-xl mx-auto">
                You pay for the initial consultation first. Once your plan is confirmed you see exactly what vaccines are included — and you confirm before anything ships.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Reveal>
              <div className="bg-white rounded-card-lg border-2 border-primary p-8 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-textPrimary">Initial Consultation</p>
                    <p className="text-xs text-textMuted">Paid upfront. Fixed fee.</p>
                  </div>
                  <span className="ml-auto font-mono font-bold text-2xl text-primary">${CONSULTATION_FEE.price}</span>
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
                  Refunded in full if we recommend an in-person visit for your dog.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="bg-bg rounded-card-lg border-2 border-border p-8 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-accent text-white font-bold text-sm flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-textPrimary">Your Vaccine Plan</p>
                    <p className="text-xs text-textMuted">Confirmed after the consultation.</p>
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { label: 'C3 vaccine (first dose)', price: VACCINE_PRODUCTS.C3.price },
                    { label: 'C5 vaccine (per dose)', price: VACCINE_PRODUCTS.C5.price },
                    { label: 'Leptospirosis (if needed)', price: VACCINE_PRODUCTS.LEPTO.price },
                    { label: 'Kennel Cough (if needed)', price: VACCINE_PRODUCTS.KENNEL_COUGH.price },
                    { label: 'Delivery (per shipment)', price: FREIGHT.pricePerShipment },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0">
                      <span className="text-textSecondary">{row.label}</span>
                      <span className="font-mono font-semibold text-textPrimary">NZD ${row.price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-textMuted">
                  You see the full breakdown before confirming. Only what your dog actually needs is included.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="bg-primary/5 rounded-card-lg p-5 border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-textSecondary text-sm">
                <strong className="text-textPrimary">You see the full breakdown before confirming.</strong> No payment is taken for vaccines until your plan is set and you've approved it.
              </p>
              <Link to="/intake" className="flex-shrink-0">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">From NZ dog owners</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">Rated 4.9 / 5</h2>
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
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Questions</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary">Common questions</h2>
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
              Your puppy's vaccines,<br />sorted from your sofa.
            </h2>
            <p className="text-primary-light text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Fill in the form. Plan confirmed. Box arrives. Done.
            </p>
            <Link to="/intake">
              <Button variant="accent" size="xl" className="shadow-lg">
                Get started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-primary-light/70 text-sm mt-5">No payment until your plan is confirmed.</p>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
