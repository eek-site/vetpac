import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Star, ChevronDown, ChevronUp,
  CheckCircle, Package, ClipboardList, Shield, Home as HomeIcon,
} from 'lucide-react'
import Button from '../components/ui/Button'
import SEO from '../components/SEO'
import { FAQ_ITEMS } from '../lib/constants'

function useIntersection(ref, threshold = 0.12) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
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
    text: 'Done before my morning coffee was cold. Milo was completely calm the whole time — I could not believe how relaxed he was.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1562176566-e9afd27531d4?w=120&h=120&fit=crop&q=80',
    dogName: 'Milo', breed: 'Golden Retriever puppy',
  },
  {
    name: 'Tom K.', location: 'Wellington',
    text: 'Our older puppy used to shake before we even got through the clinic door. I was not going to put Biscuit through that. He was perfectly calm. Done in ten minutes.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1606685226667-506592361467?w=120&h=120&fit=crop&q=80',
    dogName: 'Biscuit', breed: 'Labrador puppy',
  },
  {
    name: 'Rachel B.', location: 'Christchurch',
    text: 'The technician was at my door at 9am, done by 9:08. Luna slept through the whole thing. I honestly could not believe how easy it was.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1760448904758-3a88fd0073b9?w=120&h=120&fit=crop&q=80',
    dogName: 'Luna', breed: 'Golden Retriever puppy',
  },
]

const galleryPhotos = [
  { src: 'https://images.unsplash.com/photo-1562176566-e9afd27531d4?w=600&h=500&fit=crop&q=80', alt: 'Cute puppy' },
  { src: 'https://images.unsplash.com/photo-1760615303598-d9d2252be741?w=600&h=500&fit=crop&q=80', alt: 'Golden retriever puppy at home' },
  { src: 'https://images.unsplash.com/photo-1606685226667-506592361467?w=600&h=500&fit=crop&q=80', alt: 'Yellow labrador puppy' },
  { src: 'https://images.unsplash.com/photo-1760448904758-3a88fd0073b9?w=600&h=500&fit=crop&q=80', alt: 'Golden retriever puppy looking up' },
  { src: 'https://images.unsplash.com/photo-1768224278476-ba8142c86501?w=600&h=500&fit=crop&q=80', alt: 'Fluffy Maltipoo puppy' },
]

function useSeasonalStatus() {
  // NZ seasons: Spring Sep–Nov (peak puppy), Summer Dec–Feb, Autumn Mar–May (boosters), Winter Jun–Aug (quieter)
  const month = new Date().getMonth() + 1 // 1–12
  if (month >= 9 && month <= 11) return { label: 'Spring · Peak puppy season', sub: 'Our busiest time of year in NZ', dot: 'bg-amber-400' }
  if (month === 12 || month <= 2) return { label: 'Summer · High demand', sub: 'Popular time to start a programme', dot: 'bg-amber-400' }
  if (month >= 3 && month <= 5) return { label: 'Autumn · Booster season', sub: 'Annual programmes in full swing', dot: 'bg-amber-400' }
  return { label: 'Winter · Quieter period', sub: 'Faster start times available now', dot: 'bg-green-500' }
}

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@type': 'Service',
      name: 'At-Home Puppy Vaccination — New Zealand',
      provider: { '@type': 'Organization', name: 'VetPac', url: 'https://vetpac.nz' },
      description: 'VetPac delivers vet-authorised puppy vaccinations at home across all regions of New Zealand. C3 and C5 core vaccines plus Kennel Cough and Leptospirosis where indicated. Cold-chain certified. Administered by trained technicians or self-administered with full vet support.',
      areaServed: { '@type': 'Country', name: 'New Zealand' },
      serviceType: 'Puppy Vaccination',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'VetPac Puppy Vaccination Plans',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'Initial Consultation & Vaccine Plan',
            priceCurrency: 'NZD',
            price: '49',
            description: 'Full health intake, video assessment, personalised vaccine programme designed by a NZ-registered vet.',
          },
          {
            '@type': 'Offer',
            name: 'C3 Vaccine — Distemper, Hepatitis, Parvovirus',
            priceCurrency: 'NZD',
            price: '89',
            description: 'Core first dose for puppies 6–8 weeks. Covers Canine Distemper Virus, Infectious Canine Hepatitis, and Parvovirus.',
          },
          {
            '@type': 'Offer',
            name: 'C5 Vaccine — Full Core Protection',
            priceCurrency: 'NZD',
            price: '89',
            description: 'Full core protection: Distemper, Hepatitis, Parvovirus, Parainfluenza, and Kennel Cough. Standard from 10 weeks and for annual boosters.',
          },
        ],
      },
    },
  ],
}

export default function Home() {
  const season = useSeasonalStatus()
  return (
    <div className="overflow-x-hidden">
      <SEO
        title="NZ's At-Home Puppy Vaccination Service"
        description="VetPac delivers vet-authorised puppy vaccinations at home across New Zealand. C3, C5, Kennel Cough and Leptospirosis — cold-chain delivered, stress-free, on your schedule. From NZD $49."
        path="/"
        schema={HOME_SCHEMA}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-bg pt-20 pb-0 flex flex-col relative overflow-hidden">
        <div className="max-w-content mx-auto px-4 sm:px-6 w-full flex-1 flex items-center py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 lg:gap-12 items-center w-full">

            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 border border-primary/15">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                The premium at-home puppy vaccination service
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl xl:text-[3.5rem] text-textPrimary mb-6 leading-[1.08]">
                Your puppy, vaccinated<br />
                <span className="text-primary">in the comfort of home.</span>
              </h1>

              <p className="text-lg text-textSecondary leading-relaxed mb-8 max-w-[480px]">
                The easiest, safest way to get your new puppy vaccinated — calm, relaxed, at home, completely on your schedule.
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
                {['Calm, stress-free experience', 'Available outside clinic hours', 'Your schedule, not ours', 'NZ-wide'].map(tag => (
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
                      <p className="text-sm font-semibold text-textPrimary truncate">Bella · Auckland</p>
                      <p className="text-xs text-green-600 font-medium">Vaccinated at home today</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4">
                  <div className="bg-white/96 backdrop-blur-sm rounded-card shadow-card-hover px-3 py-2 flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${season.dot}`} />
                    <div>
                      <p className="text-xs font-bold text-textPrimary leading-none mb-0.5">{season.label}</p>
                      <p className="text-[10px] text-textMuted leading-none">{season.sub}</p>
                    </div>
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
              <span className="text-accent"> Your puppy stays calm. The job gets done."</span>
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
                accent: 'bg-primary',
                title: 'A calm puppy is a healthy puppy.',
                body: 'Research shows that stress hormones actively affect how well a vaccine works. A puppy vaccinated at home — in familiar surroundings, with you beside them — is physiologically calmer and responds better. The waiting room is the worst possible place to be vaccinated.',
              },
              {
                num: '02',
                accent: 'bg-accent',
                title: 'At a time that works for both of you.',
                body: 'Puppies are not always at their best at 9am on a Tuesday. Neither are their owners. We work around your schedule — evenings, weekends, whenever your puppy is settled and you have time.',
              },
              {
                num: '03',
                accent: 'bg-primary',
                title: 'No clinics. No car trips. No stress.',
                body: 'The car trip alone is enough to spike a puppy\'s anxiety before the appointment even starts. At home, they are already where they feel safest. The whole experience is quieter, calmer, and kinder.',
              },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white rounded-card-lg border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-full flex flex-col overflow-hidden">
                  <div className={`h-1 w-full ${card.accent}`} />
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                        {card.num}
                      </span>
                      <h3 className="font-semibold text-textPrimary text-lg leading-snug">{card.title}</h3>
                    </div>
                    <p className="text-textSecondary text-sm leading-relaxed">{card.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL COST OF THE CLINIC ──────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">The full picture</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">
                The real cost of doing it the old way.
              </h2>
              <p className="text-textSecondary max-w-2xl mx-auto leading-relaxed">
                Most people only count the appointment fee. A standard clinic visit costs far more — in time, money, and risk that most owners never think about until it is too late.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              {
                stat: '1.5–2 hrs',
                label: 'Lost per visit',
                body: 'Driving, parking, waiting, and the appointment itself. Most clinics close at 5pm — meaning you are fitting this around work, every single time.',
                statColor: 'text-accent',
                bg: 'border-accent/25 bg-accent/5',
              },
              {
                stat: 'NZD $80+',
                label: 'In hidden overhead',
                body: 'Parking, petrol, and the time cost of travelling add up to NZD $60–90 per visit before you have even seen the vet. Across a 3-dose puppy course, that is over NZD $240 in overhead alone.',
                statColor: 'text-primary',
                bg: 'border-primary/25 bg-primary/5',
              },
              {
                stat: 'NZD $1,000+',
                label: 'If something goes wrong',
                body: 'Vet waiting rooms are documented high-risk environments for partially-vaccinated puppies. Parvovirus survives on surfaces for months. In New Zealand, treatment starts at $1,000 — and the survival rate is not guaranteed.',
                statColor: 'text-red-600',
                bg: 'border-red-200 bg-red-50',
              },
              {
                stat: '↓ Immune response',
                label: 'Stress affects the vaccine itself',
                body: 'A puppy\'s cortisol spikes sharply during car trips and in unfamiliar environments. Elevated stress hormones suppress immune function — meaning a vaccine given in a busy clinic may be less effective than one given calmly at home.',
                statColor: 'text-textPrimary',
                bg: 'border-border bg-bg',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`rounded-card-lg p-6 border h-full flex flex-col ${item.bg}`}>
                  <p className={`font-display font-bold text-2xl mb-1 leading-none ${item.statColor}`}>{item.stat}</p>
                  <p className="font-semibold text-textPrimary text-sm mb-3">{item.label}</p>
                  <p className="text-textMuted text-xs leading-relaxed flex-1">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="bg-primary rounded-card-lg p-7 text-center">
              <p className="text-white font-display text-xl sm:text-2xl font-medium leading-snug mb-5 max-w-2xl mx-auto">
                "With parvo treatment bills exceeding NZD $1,000 and outcomes that are not guaranteed, the question is not whether to vaccinate — it is where."
              </p>
              <Link to="/intake">
                <Button variant="accent" size="md" className="shadow-md">
                  Start your puppy's health plan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">How it works</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">Everything done at home.</h2>
              <p className="text-textSecondary max-w-xl mx-auto">On your schedule, in your space, at a time that suits you and your puppy.</p>
            </div>
          </Reveal>

          <div className="relative">
            <div className="hidden md:block absolute top-[38px] left-[10%] right-[10%] h-px bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { icon: ArrowRight, label: 'Get started', desc: 'Click below to begin your puppy\'s health plan. Already on the journey? Pick up right where you left off.' },
                { icon: ClipboardList, label: 'We design your plan', desc: 'A personalised vaccination plan tailored to your puppy\'s age, breed, history, and lifestyle.' },
                { icon: HomeIcon, label: 'Vaccinated at home', desc: 'At a time that works for both of you — including evenings and weekends. Your puppy never leaves home.' },
                { icon: Shield, label: 'Quick post-vaccine check', desc: 'The usual 30-minute observation window. We are available if you need us, around the clock.' },
                { icon: Star, label: 'Happy, healthy puppy', desc: 'That\'s it. Your puppy is protected and never had to step foot in a clinic.' },
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
        </div>
      </section>

      {/* ── VIDEO REEL ───────────────────────────────────────────────────────── */}
      <section className="bg-bg py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Happy at home</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">This is what it looks like</h2>
              <p className="text-textSecondary max-w-lg mx-auto">Calm puppies. Happy owners. No car park required.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-corgi-puppy-playing-with-a-toy-with-its-owner-45873-large.mp4',
                poster: 'https://images.unsplash.com/photo-1562176566-e9afd27531d4?w=600&h=450&fit=crop&q=80',
                caption: 'Protected & playful',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-young-girl-playing-with-a-puppy-6178-large.mp4',
                poster: 'https://images.unsplash.com/photo-1760448904758-3a88fd0073b9?w=600&h=450&fit=crop&q=80',
                caption: 'At ease at home',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-little-puppy-running-in-snow-in-slow-motion-25225-large.mp4',
                poster: 'https://images.unsplash.com/photo-1768224278476-ba8142c86501?w=600&h=450&fit=crop&q=80',
                caption: 'Happy and healthy',
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


      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">From NZ puppy owners</p>
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
            <div className="max-w-3xl mx-auto text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Questions</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">Everything you need to know</h2>
              <p className="text-textSecondary">
                Everything you need to feel confident before you get started.
              </p>
            </div>
          </Reveal>
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
            <Reveal>
              <div className="mt-10 p-6 bg-primary/5 rounded-card-lg border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-textPrimary text-sm mb-0.5">Ready to get started?</p>
                  <p className="text-textMuted text-xs">Begin your puppy's health plan. Takes about 10 minutes.</p>
                </div>
                <Link to="/intake" className="flex-shrink-0">
                  <Button size="sm" className="whitespace-nowrap">
                    Start health plan <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Reveal>
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
              Your puppy, vaccinated<br />at home. On your terms.
            </h2>
            <p className="text-primary-light text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Calm. Safe. At a time that suits you and your puppy.
            </p>
            <Link to="/intake">
              <Button variant="accent" size="xl" className="shadow-lg">
                Get started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-white/60">
              Already started?{' '}
              <Link to="/plan" className="text-white font-semibold underline underline-offset-2 hover:text-white/90">
                Return to your plan →
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
