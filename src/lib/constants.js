// ─── Regional consult fee pricing (Stats NZ 2023 median household income) ────
// Auckland = $49 to meet local competition. All others income-scaled to $289 max.
// Formula: $149 + $140 × (income − $61k) / ($95k − $61k), rounded to nearest $5
export const REGIONAL_CONSULTATION_FEES = {
  'Auckland':              49,   // competition pricing
  'Wellington':           289,   // $95k income — top tier
  'Waikato':              245,   // $84k
  'Canterbury':           219,   // $77k
  "Hawke's Bay":          209,   // $75k
  'Bay of Plenty':        199,   // $73k
  'Taranaki':             195,   // $72k
  'Nelson':               195,   // $72k
  'Marlborough':          189,   // $71k
  'Tasman':               185,   // $70k
  'Otago':                179,   // $69k
  'Manawatu-Whanganui':   179,   // $68k
  'Northland':            175,   // $67k
  'Southland':            159,   // $64k
  'West Coast':           155,   // $63k
  'Gisborne':             149,   // $61k — floor
}

// 18% compound reduction per additional puppy, min $48/puppy, result as 1 number
export function calculateConsultFee(region, numberOfPuppies = 1) {
  const basePrice = REGIONAL_CONSULTATION_FEES[region] ?? 289
  const MIN_PER_PUPPY = 48
  let total = 0
  let price = basePrice
  for (let i = 0; i < numberOfPuppies; i++) {
    total += Math.max(Math.round(price), MIN_PER_PUPPY)
    price = price * 0.82
  }
  return total
}

export const CONSULTATION_FEE = {
  id: 'consultation',
  name: 'Initial Consultation',
  price: 289, // default — overridden dynamically by region + puppy count
  description: 'Full health assessment and personalised vaccine plan for your puppy.',
  includes: [
    'Personalised health intake',
    'Video assessment of your puppy',
    'Vaccine plan designed for your puppy\'s age, breed, and lifestyle',
    'Digital health record and vaccination certificate',
    'Around-the-clock support throughout your puppy\'s programme',
  ],
  refundNote: 'Full refund if we determine your puppy needs an alternative approach.',
}

export const VACCINE_PRODUCTS = {
  C3: {
    id: 'c3',
    name: 'C3 Vaccine',
    fullName: 'C3 — Distemper, Hepatitis, Parvovirus',
    description: 'Core first puppy dose.',
    price: 89,
    note: 'Typically the first dose for puppies 6-8 weeks.',
  },
  C5: {
    id: 'c5',
    name: 'C5 Vaccine',
    fullName: 'C5 — Distemper, Hepatitis, Parvovirus, Parainfluenza, Kennel Cough',
    description: 'Full core protection. Standard from 10 weeks and for annual boosters.',
    price: 89,
    note: 'Standard for doses 2, 3 and annual boosters.',
  },
  LEPTO: {
    id: 'lepto',
    name: 'Leptospirosis Vaccine',
    fullName: 'Leptospirosis',
    description: 'Recommended for puppies with rural or waterway exposure.',
    price: 89,
    note: 'Recommended based on your lifestyle responses.',
  },
  KENNEL_COUGH: {
    id: 'kennel_cough',
    name: 'Kennel Cough',
    fullName: 'Kennel Cough — Bordetella bronchiseptica',
    description: 'Recommended for puppies attending boarding, daycare, or puppy parks.',
    price: 89,
    note: 'Recommended based on your lifestyle responses.',
  },
}

export const FREIGHT = {
  id: 'freight',
  name: 'Cold-chain delivery',
  pricePerShipment: 119,
  description: 'Pharmaceutical-grade cold-chain packaging maintaining 2-8 degrees. Temperature indicator strip included. Signature required on delivery.',
}

export const ADDONS = {
  ASSIST: {
    id: 'assist',
    name: 'VetPac Assist',
    description: 'A trained VetPac technician visits your home and administers the vaccine for you.',
    price: 149,
    note: 'Auckland only. Same-day or next-day availability.',
  },
  WORMING: { id: 'worming', name: 'Worming Treatment', price: 29 },
  FLEA: { id: 'flea', name: 'Flea Treatment', price: 34 },
}

export const SCALES = {
  id: 'scales',
  name: 'VetPac Digital Scales',
  retailPrice: 49,
  introPrice: 0,
  description: 'Precision puppy scales accurate to 0.1kg. Monitor your puppy\'s weight at each vaccination point — ensures correct dosing every time.',
}

export const INSURANCE = {
  id: 'insurance',
  name: 'VetPac Health Cover',
  description: 'Accident and illness cover for your puppy, provided by Forman Pacific LLC.',
  weeklyRetailPrice: 16.99,
  weeklyIntroPrice: 4.99,
  annualPrice: 259,
  monthlyPrice: 24.99,
  coverLimit: 15000,
  excess: 200,
  reimbursement: 80,
}

export const PRICING_EXAMPLES = [
  {
    id: 'puppy_course',
    label: 'Full puppy course',
    scenario: '3-dose programme shipped at the right intervals',
    consultation: 289,
    vaccines: [
      { name: 'C3 dose 1', price: 89 },
      { name: 'C5 dose 2', price: 89 },
      { name: 'C5 dose 3', price: 89 },
    ],
    shipments: 3,
    badge: 'Most common',
  },
  {
    id: 'single_dose',
    label: 'Annual booster',
    scenario: 'Adult puppy, single C5 booster',
    consultation: 289,
    vaccines: [
      { name: 'C5 annual booster', price: 89 },
    ],
    shipments: 1,
  },
  {
    id: 'partial_course',
    label: 'Partially vaccinated puppy',
    scenario: '2 doses remaining',
    consultation: 289,
    vaccines: [
      { name: 'C5 dose 2', price: 89 },
      { name: 'C5 dose 3', price: 89 },
    ],
    shipments: 2,
  },
]

export const NZ_REGIONS = [
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  "Hawke's Bay",
  'Taranaki',
  'Manawatu-Whanganui',
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Southland',
]

export const NZ_BREEDS = [
  'Mixed breed / Unknown',
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'French Bulldog',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'German Shorthaired Pointer',
  'Dachshund',
  'Pembroke Welsh Corgi',
  'Australian Shepherd',
  'Border Collie',
  'Boxer',
  'Siberian Husky',
  'Great Dane',
  'Doberman Pinscher',
  'Miniature Schnauzer',
  'Cavalier King Charles Spaniel',
  'Shih Tzu',
  'Boston Terrier',
  'Pomeranian',
  'Havanese',
  'Shetland Sheepdog',
  'Bernese Mountain puppy',
  'English Springer Spaniel',
  'Brittany',
  'Cocker Spaniel',
  'Vizsla',
  'Maltese',
  'Chihuahua',
  'Jack Russell Terrier',
  'Bichon Frise',
  'Staffordshire Bull Terrier',
  'American Staffordshire Terrier',
  'Weimaraner',
  'Alaskan Malamute',
  'Newfoundland',
  'Belgian Malinois',
  'Pug',
  'Basenji',
  'Samoyed',
  'West Highland White Terrier',
  'Yorkshire Terrier',
  'Italian Greyhound',
  'Whippet',
  'Greyhound',
  'Irish Setter',
  'Dalmatian',
  'Other',
]

export const INTAKE_STEPS = [
  { path: '/intake', label: "Your puppy's Profile" },
  { path: '/intake/health', label: 'Health History' },
  { path: '/intake/lifestyle', label: 'Lifestyle & Environment' },
  { path: '/intake/owner', label: 'Your Details' },
  { path: '/intake/video', label: 'puppy Video' },
  { path: '/intake/review', label: 'Review & Confirm' },
]

export const FAQ_ITEMS = [
  {
    q: 'How does it work?',
    a: 'Start your puppy\'s health plan below. Our AI reviews your puppy\'s history, age, breed, and lifestyle to build a personalised vaccination programme, reviewed and authorised by a NZ-registered veterinarian. Your vaccines are then administered at home, at a time that works for both of you.',
  },
  {
    q: 'What vaccines do you offer?',
    a: 'We offer C3 and C5 — the standard core vaccinations for puppies in New Zealand. C3 covers Distemper, Hepatitis, and Parvovirus. C5 adds Parainfluenza and Kennel Cough. We also offer Leptospirosis and Kennel Cough boosters where your puppy\'s lifestyle warrants it.',
  },
  {
    q: 'Is it safe?',
    a: 'Yes — and in many ways, your home is a better environment than a clinic waiting room. Your home has none of the pathogens that circulate in a waiting room, which is particularly important for unvaccinated puppies. Every vaccine is sealed, sterile, and single-use. We walk you through everything — you are supported at every step.',
  },
  {
    q: 'Can I meet the technician before you send someone to my home?',
    a: 'Yes. Before any home visit, our senior programme coordinator will video call you to introduce the technician assigned to your puppy, walk you through what to expect, and make sure you are completely comfortable. Every technician is individually matched to ensure they share our values around animal care. We will arrange this once your plan is confirmed.',
  },
  {
    q: 'What if my puppy seems unwell on the day?',
    a: 'Never proceed if your puppy is showing any signs of illness, however mild. We include a simple pre-vaccination checklist. If anything flags, stop and call us. We will hold your programme until your puppy is well.',
  },
  {
    q: 'What if something goes wrong after vaccination?',
    a: 'Our 0800 VETPAC line is staffed 24 hours a day, 7 days a week. Call us immediately if your puppy shows any unusual signs after vaccination. We will advise you on what to do and stay with you throughout.',
  },
  {
    q: 'Do you cover all of New Zealand?',
    a: 'Yes — we cover all regions of New Zealand including rural addresses. Get in touch if you have questions about your area.',
  },
  {
    q: 'Is the vaccination record official?',
    a: 'Yes. Every programme includes a signed vaccination certificate confirming your puppy\'s vaccinations, the products used, and the dates administered. It is accepted by boarding facilities, groomers, and vets.',
  },
]
