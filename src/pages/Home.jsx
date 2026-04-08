import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Shield, Truck, Star, ChevronDown, ChevronUp,
  Bot, Video, FileText, Package, Syringe, CheckCircle,
  DollarSign, Clock, AlertCircle, Phone, Lock, Thermometer,
  ClipboardList, UserCheck, BadgeCheck
} from 'lucide-react'
import Button from '../components/ui/Button'
import { FAQ_ITEMS, CONSULTATION_FEE, VACCINE_PRODUCTS, FREIGHT, PRICING_EXAMPLES } from '../lib/constants'

function useIntersection(ref, options = {}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.15, ...options })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return visible
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const visible = useIntersection(ref)
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function PricingCard({ product, recommended }) {
  return (
    <div className={`relative bg-white rounded-card-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 p-8 flex flex-col
      ${recommended ? 'border-2 border-accent ring-4 ring-accent/10' : 'border-2 border-border'}`}>
      {recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-display font-semibold text-xl text-textPrimary mb-1">{product.name}</h3>
        <p className="text-textMuted text-sm">{product.description}</p>
      </div>
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-mono font-bold text-4xl text-accent">NZD ${product.price}</span>
        </div>
        {product.savings && (
          <p className="text-sm text-success font-semibold mt-1">Save ${product.savings} vs individual doses</p>
        )}
      </div>
      <ul className="space-y-3 mb-8 flex-grow">
        {product.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-textSecondary">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
      <Link to="/intake">
        <Button variant={recommended ? 'accent' : 'secondary'} fullWidth size="lg">
          {recommended ? 'Start Your Course →' : 'Order Now'}
        </Button>
      </Link>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-semibold text-textPrimary">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-textMuted flex-shrink-0" />}
      </button>
      {open && (
        <div className="pb-5 text-textSecondary text-sm leading-relaxed -mt-2">{a}</div>
      )}
    </div>
  )
}

const steps = [
  { icon: Bot, label: 'Tell us about your dog', desc: 'Complete our 5-minute AI health intake. Answer questions about your dog\'s health, history, and lifestyle.', color: 'bg-blue-50 text-blue-600' },
  { icon: Video, label: 'Record a quick video', desc: 'Show us your dog walking and their face. Our AI reviews it — and so does a real NZ vet.', color: 'bg-purple-50 text-purple-600' },
  { icon: FileText, label: 'Vet issues your plan', desc: 'A NZ-registered vet reviews everything and issues a Veterinary Operating Instruction authorising your vaccine programme.', color: 'bg-primary/10 text-primary' },
  { icon: Package, label: 'Vaccines arrive at your door', desc: 'Your vaccines are cold-chain couriered directly to you with full administration instructions and a training video.', color: 'bg-accent/10 text-accent-dark' },
  { icon: Syringe, label: 'You administer at home', desc: 'Follow the simple step-by-step guide. It takes 2 minutes. Your dog stays comfortable in familiar surroundings.', color: 'bg-success/10 text-green-700' },
]

const testimonials = [
  {
    name: 'Sarah M.', location: 'Auckland',
    text: 'I was nervous about doing it myself but the instructions were so clear. Milo didn\'t even flinch — the whole thing took less time than the car ride to the vet used to!',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&h=120&fit=crop&q=80',
    dogName: 'Milo',
  },
  {
    name: 'Tom K.', location: 'Wellington',
    text: 'Saved me $120 vs the vet. Same vaccines, delivered to my door. The vet reviewed everything within a couple of hours. Really impressed.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120&h=120&fit=crop&q=80',
    dogName: 'Biscuit',
  },
  {
    name: 'Rachel B.', location: 'Christchurch',
    text: 'Added the Assist option — the technician was at my door the next morning. Total stress-free experience. My anxious dog did so much better at home.',
    stars: 5,
    dogPhoto: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=120&h=120&fit=crop&q=80',
    dogName: 'Luna',
  },
]

const galleryPhotos = [
  { src: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&h=500&fit=crop&q=80', alt: 'Happy dog at home' },
  { src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=500&fit=crop&q=80', alt: 'Dogs playing' },
  { src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=500&fit=crop&q=80', alt: 'Calm dog indoors' },
  { src: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=500&fit=crop&q=80', alt: 'Dog portrait' },
  { src: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&h=500&fit=crop&q=80', alt: 'Relaxed dog' },
]

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="min-h-screen bg-bg pt-24 pb-16 flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%231B4332\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-content mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                NZ's first at-home pet vaccination platform
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl xl:text-6xl text-textPrimary leading-tight mb-6">
                Your dog's vaccines.<br />
                <span className="text-primary">Delivered to your door.</span>
              </h1>
              <p className="text-lg text-textSecondary leading-relaxed mb-6 max-w-lg">
                AI-guided consultation. Vet-authorised plan. Cold-chain delivery. No clinic visit needed.
              </p>
              <div className="mb-8 flex items-baseline gap-3 flex-wrap">
                <div>
                  <span className="font-mono font-bold text-2xl text-accent">NZD $45</span>
                  <span className="text-textMuted text-sm ml-1.5">consultation</span>
                </div>
                <span className="text-textMuted text-sm">+</span>
                <div>
                  <span className="font-mono font-bold text-xl text-textPrimary">vaccines + freight</span>
                  <span className="text-textMuted text-sm ml-1.5">itemised after your consult</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/intake">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Your Dog's Health Plan <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    See how it works ↓
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-textSecondary">
                {[
                  { icon: Shield, text: 'Vet-authorised' },
                  { icon: Truck, text: 'Cold-chain delivery' },
                  { icon: CheckCircle, text: 'NZ-registered vets' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 relative">
              <div className="relative rounded-card-lg overflow-hidden aspect-[4/5] shadow-card-hover bg-primary/10">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1000&fit=crop&q=80"
                  className="w-full h-full object-cover"
                >
                  <source
                    src="https://assets.mixkit.co/videos/preview/mixkit-man-with-his-dog-watching-the-sunset-on-the-horizon-4839-large.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-card shadow-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-textPrimary">Bella's C5 vaccine</p>
                    <p className="text-xs text-success font-semibold">Shipped today ✓</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-center mb-4">
              Vet clinics are stressful, expensive, and inconvenient.
            </h2>
            <p className="text-primary-light text-center mb-12 text-lg">There's a better way.</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, stat: '$280+', text: 'Average puppy vaccination course in NZ', color: 'text-accent' },
              { icon: AlertCircle, stat: '85%', text: 'of dogs show stress behaviours at the vet clinic', color: 'text-warning' },
              { icon: Clock, stat: '4–7 days', text: 'Average wait time for a vet appointment', color: 'text-blue-300' },
            ].map(({ icon: Icon, stat, text, color }, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="bg-white/10 rounded-card-lg p-8 text-center backdrop-blur-sm border border-white/10">
                  <Icon className={`w-8 h-8 mx-auto mb-4 ${color}`} />
                  <div className={`font-mono font-bold text-4xl mb-2 ${color}`}>{stat}</div>
                  <p className="text-white/80 text-sm leading-relaxed">{text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Simple process</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">How VetPac works</h2>
              <p className="text-textSecondary max-w-xl mx-auto">From your couch to your dog's health plan — in under 10 minutes.</p>
            </div>
          </AnimatedSection>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 bg-border mx-32" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {steps.map((step, i) => {
                const Icon = step.icon
                return (
                  <AnimatedSection key={i} delay={i * 80}>
                    <div className="flex flex-col items-center text-center relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 z-10 ${step.color}`}>
                        <Icon className="w-9 h-9" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-3 -mt-2 z-10">
                        {i + 1}
                      </div>
                      <h3 className="font-semibold text-textPrimary mb-2 text-sm">{step.label}</h3>
                      <p className="text-textMuted text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </AnimatedSection>
                )
              })}
            </div>
          </div>

          <AnimatedSection>
            <div className="mt-12 bg-accent/10 rounded-card-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-textPrimary">Rather we do it for you?</p>
                <p className="text-textSecondary text-sm">Add VetPac Assist — a trained technician comes to your home.</p>
              </div>
              <Link to="/intake">
                <Button variant="accent">Add VetPac Assist +$49</Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* VIDEO REEL */}
      <section className="bg-bg py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Happy at home</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-3">This is what we're all here for</h2>
              <p className="text-textSecondary max-w-xl mx-auto">Healthy dogs. Stress-free owners. No clinic waiting room required.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-corgi-running-next-to-its-owner-at-the-park-45869-large.mp4',
                poster: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop&q=80',
                label: 'Corgi running with owner at the park',
                caption: 'Happy, vaccinated & full of energy',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-young-girl-playing-with-a-puppy-6178-large.mp4',
                poster: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop&q=80',
                label: 'Girl playing with a puppy',
                caption: 'Home is where puppies thrive',
              },
              {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-little-dog-running-in-snow-in-slow-motion-25225-large.mp4',
                poster: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&h=400&fit=crop&q=80',
                label: 'Puppy running in slow motion',
                caption: 'Protected. Playful. Loved.',
              },
            ].map((vid, i) => (
              <AnimatedSection key={i} delay={i * 120}>
                <div className="group relative rounded-card-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 bg-black aspect-[4/3]">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={vid.poster}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    aria-label={vid.label}
                  >
                    <source src={vid.src} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm">{vid.caption}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Transparent pricing</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-4">You pay for what your dog actually needs</h2>
              <p className="text-textSecondary max-w-2xl mx-auto leading-relaxed">
                VetPac is a two-stage process. First you pay a fixed consultation fee — this covers your AI intake, NZ vet review, and VOI. Then, once the vet has determined exactly what vaccines your dog needs (based on their age, history, and prior doses), you confirm and pay for those vaccines plus freight. No bundles. No guessing.
              </p>
            </div>
          </AnimatedSection>

          {/* Two stage diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-start">
            {/* Stage 1 */}
            <AnimatedSection>
              <div className="bg-white rounded-card-lg shadow-card p-7 border-2 border-primary/20 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">1</div>
                  <div>
                    <p className="font-semibold text-textPrimary text-sm">Consultation & Vet Review</p>
                    <p className="text-textMuted text-xs">Fixed fee, paid first</p>
                  </div>
                </div>
                <div className="font-mono font-bold text-3xl text-primary mb-4">NZD ${CONSULTATION_FEE.price}</div>
                <ul className="space-y-2">
                  {CONSULTATION_FEE.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-textSecondary">
                      <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 p-3 bg-primary/5 rounded-card">
                  <p className="text-xs text-primary font-semibold">Refunded in full if vet refers you to an in-person clinic.</p>
                </div>
              </div>
            </AnimatedSection>

            {/* Stage 2 */}
            <AnimatedSection delay={100}>
              <div className="bg-white rounded-card-lg shadow-card p-7 border-2 border-accent/30 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">2</div>
                  <div>
                    <p className="font-semibold text-textPrimary text-sm">Vaccines + Freight</p>
                    <p className="text-textMuted text-xs">Itemised — based on your dog's actual needs</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'C3 vaccine (first dose)', price: VACCINE_PRODUCTS.C3.price },
                    { label: 'C5 vaccine (per dose)', price: VACCINE_PRODUCTS.C5.price },
                    { label: 'Leptospirosis (if recommended)', price: VACCINE_PRODUCTS.LEPTO.price },
                    { label: 'Kennel Cough (if recommended)', price: VACCINE_PRODUCTS.KENNEL_COUGH.price },
                  ].map((v) => (
                    <div key={v.label} className="flex justify-between items-center text-sm">
                      <span className="text-textSecondary">{v.label}</span>
                      <span className="font-mono font-semibold text-textPrimary">NZD ${v.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-2">
                    <span className="text-textSecondary">Cold-chain freight (per shipment)</span>
                    <span className="font-mono font-semibold text-textPrimary">NZD ${FREIGHT.pricePerShipment}</span>
                  </div>
                </div>
                <p className="text-xs text-textMuted leading-relaxed">
                  The AI consult determines which vaccines your dog actually needs — accounting for prior doses, age, and lifestyle. You see exactly what you're paying for before confirming.
                </p>
              </div>
            </AnimatedSection>

            {/* Example totals */}
            <AnimatedSection delay={200}>
              <div className="bg-white rounded-card-lg shadow-card p-7 h-full">
                <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-4">Example totals</p>
                <div className="space-y-5">
                  {PRICING_EXAMPLES.map((ex) => {
                    const vaccineTotal = ex.vaccines.reduce((s, v) => s + v.price, 0)
                    const freightTotal = ex.shipments * FREIGHT.pricePerShipment
                    const total = ex.consultation + vaccineTotal + freightTotal
                    return (
                      <div key={ex.id} className="pb-5 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-textPrimary text-sm">{ex.label}</p>
                          {ex.badge && (
                            <span className="text-xs bg-accent/10 text-accent-dark font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{ex.badge}</span>
                          )}
                        </div>
                        <p className="text-xs text-textMuted mb-2">{ex.scenario}</p>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-textMuted">Total (consult + vaccines + freight)</span>
                          <span className="font-mono font-bold text-accent text-lg">NZD ${total}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 p-3 bg-bg rounded-card text-xs text-textMuted border border-border">
                  Compare: Auckland vet clinic = <span className="line-through font-medium text-textSecondary">$128–$140+</span> per visit, before the vaccine.
                </div>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection>
            <div className="bg-white rounded-card-lg shadow-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-textPrimary">Prefer someone else to do the injection?</p>
                <p className="text-textSecondary text-sm">Add VetPac Assist at checkout — a trained technician visits your home. Auckland only, +NZD $49.</p>
              </div>
              <Link to="/intake" className="flex-shrink-0">
                <Button variant="accent">Add VetPac Assist</Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* SAFETY & COMPLIANCE */}
      <section className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="bg-primary rounded-card-lg p-10 text-white">
                <Shield className="w-12 h-12 text-accent mb-6" />
                <h2 className="font-display font-bold text-3xl mb-4">Vet-authorised.<br />Every time.</h2>
                <p className="text-primary-light leading-relaxed mb-6">
                  We work within the same framework that New Zealand farmers have used for decades to vaccinate their own animals.
                </p>
                <ul className="space-y-3">
                  {[
                    'Every treatment plan reviewed by a NZ-registered vet',
                    'Veterinary Operating Instruction issued for every order',
                    'Vaccines sourced from NZ-approved suppliers only',
                    'Cold-chain delivery — vaccines never leave correct temperature',
                    'Digital vaccination record issued with every order',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div>
                <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-4">How it works legally</p>
                <h3 className="font-display font-semibold text-2xl text-textPrimary mb-4">The VOI Framework</h3>
                <div className="space-y-4 text-textSecondary leading-relaxed">
                  <p>
                    A <strong className="text-textPrimary">Veterinary Operating Instruction (VOI)</strong> is a legal document issued by a NZ-registered vet that authorises a named person to purchase and administer specific vaccines to their animal.
                  </p>
                  <p>
                    This is the same mechanism NZ farmers use to vaccinate their own livestock and working dogs — it's an established, well-understood framework under the ACVM Act 1997.
                  </p>
                  <p>
                    VetPac facilitates this process digitally: AI intake, vet review, VOI issuance, and cold-chain delivery — all in one seamless platform.
                  </p>
                </div>
                <div className="mt-8 p-4 bg-bg rounded-card border border-border">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-textPrimary text-sm">24/7 Emergency Line</p>
                      <p className="text-textMuted text-sm">0800 VETPAC — on-call vet technician for any post-administration concerns</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-bg py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Dog owners love VetPac</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary mb-2">Rated 4.9/5 by NZ dog owners</h2>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-warning fill-warning" />)}
              </div>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="bg-white rounded-card-lg shadow-card p-8 flex flex-col">
                  <div className="flex items-center gap-4 mb-5">
                    <img
                      src={t.dogPhoto}
                      alt={t.dogName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-textPrimary text-sm">{t.name}</p>
                      <p className="text-textMuted text-xs">{t.location} · {t.dogName}'s owner</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-3 h-3 text-warning fill-warning" />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-textSecondary text-sm leading-relaxed italic flex-grow">"{t.text}"</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <section className="py-4 bg-bg overflow-hidden">
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 px-4 sm:px-6 max-w-content mx-auto">
          {galleryPhotos.map((photo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 sm:w-56 h-36 sm:h-44 rounded-card overflow-hidden shadow-card"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-24">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Questions answered</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-textPrimary">Frequently asked questions</h2>
            </div>
          </AnimatedSection>
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="bg-bg rounded-card-lg p-2">
                {FAQ_ITEMS.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-primary py-20">
        <div className="max-w-content mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Ready to protect your dog?
            </h2>
            <p className="text-primary-light text-lg mb-8 max-w-xl mx-auto">
              Start your 5-minute AI health intake. Vet review in hours. Vaccines at your door.
            </p>
            <Link to="/intake">
              <Button variant="accent" size="xl">
                Start Your Dog's Health Plan <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-primary-light text-sm mt-4">No payment required until your vet plan is approved.</p>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
