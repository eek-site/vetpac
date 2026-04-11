// ─── Regional consult fee pricing ────────────────────────────────────────────
// Flat $49 across all regions.
export const REGIONAL_CONSULTATION_FEES = {
  'Auckland':              49,
  'Wellington':            49,
  'Waikato':               49,
  'Canterbury':            49,
  "Hawke's Bay":           49,
  'Bay of Plenty':         49,
  'Taranaki':              49,
  'Nelson':                49,
  'Marlborough':           49,
  'Tasman':                49,
  'Otago':                 49,
  'Manawatu-Whanganui':    49,
  'Northland':             49,
  'Southland':             49,
  'West Coast':            49,
  'Gisborne':              49,
}

// 18% compound reduction per additional puppy, min $48/puppy, result as 1 number
export function calculateConsultFee(region, numberOfPuppies = 1) {
  const basePrice = REGIONAL_CONSULTATION_FEES[region] ?? 49
  const MIN_PER_PUPPY = 49
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
  price: 49, // default — overridden dynamically by region + puppy count
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
    price: 229,
    note: 'Nationwide. Same-day or next-day availability.',
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
  id: 'warranty',
  name: 'VetPac Programme Warranty',
  description: 'One-time warranty on your puppy\'s VetPac vaccination programme — covers vaccine failure and adverse reactions.',
  warrantyTerm: 'programme period',

  // Actuarial model — 1,000 dogs through programme:
  // — Non-responders: 5% × 1,000 = 50 dogs don't build immunity (Decaro et al., Vet Microbiol 2020)
  // — Of those, ~15% get disease (exposure risk, household puppy) = 7.5 dogs × $2,500 NZ avg = $18,750
  // — Moderate adverse reactions: 0.78%/dose × 3 doses × 1,000 = 7.8 dogs × $280 avg = $2,184
  // — Severe reactions (anaphylaxis): 0.065%/dose × 3 × 1,000 = 1.95 dogs × $800 avg = $1,560
  // — Total expected claims per 1,000 dogs: $22,494
  // — Per dog: $22.49  →  10× = $224.90  →  price: $225
  oneTimePrice: 225,
  claimLimit: 5000,
  serviceFee: 0,       // zero service fee — full eligible costs covered
  coverageRate: 100,
}

export const PRICING_EXAMPLES = [
  {
    id: 'puppy_course',
    label: 'Full puppy course',
    scenario: '3-dose programme shipped at the right intervals',
    consultation: 49,
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
    consultation: 49,
    vaccines: [
      { name: 'C5 annual booster', price: 89 },
    ],
    shipments: 1,
  },
  {
    id: 'partial_course',
    label: 'Partially vaccinated puppy',
    scenario: '2 doses remaining',
    consultation: 49,
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
  { path: '/intake', label: 'Tell us about your puppy' },
  { path: '/intake/review', label: 'Review & Confirm' },
]

export const FAQ_ITEMS = [
  {
    q: 'How does it work?',
    a: 'Start your puppy\'s health plan below. Our AI reviews your puppy\'s history, age, breed, and lifestyle to build a personalised vaccination programme, reviewed and authorised by a NZ-registered veterinarian. Your vaccines are cold-chain delivered to your home and administered at a time that works for both of you.',
  },
  {
    q: 'When should my puppy get their first vaccination?',
    a: 'The first C3 vaccination is typically given at 6–8 weeks — usually by the breeder. If your puppy hasn\'t had it yet, start as soon as possible. VetPac will build the programme around your puppy\'s actual age and history, so there\'s no guessing.',
  },
  {
    q: 'What is the difference between C3 and C5?',
    a: 'C3 covers Distemper, Hepatitis, and Parvovirus — the three core diseases. C5 adds Parainfluenza and Kennel Cough (Bordetella). Most puppies receive C3 as their first dose and C5 from dose 2 onwards. Annual boosters are C5. If your puppy attends boarding or daycare, C5 is required.',
  },
  {
    q: 'Does my puppy need the Leptospirosis vaccine?',
    a: 'It depends on your puppy\'s lifestyle. Leptospirosis is recommended if your puppy has exposure to farms, rivers, livestock, or wildlife. Your VetPac intake will ask the right questions and your vet will include it if warranted. Requires two doses 2–4 weeks apart.',
  },
  {
    q: 'What vaccines do you offer?',
    a: 'We offer C3, C5, Leptospirosis, and Kennel Cough — the full suite of core and non-core vaccinations for puppies in New Zealand. Every programme is personalised by a NZ-registered veterinarian.',
  },
  {
    q: 'Is it safe?',
    a: 'Yes — and in many ways, your home is a safer environment than a clinic waiting room. Your home has none of the pathogens that circulate among sick or unvaccinated animals. Every vaccine is sealed, sterile, and single-use, cold-chain maintained to your door. You are supported at every step.',
  },
  {
    q: 'Can I take my puppy to the park before vaccinations are complete?',
    a: 'Not to public areas where unvaccinated dogs may have been. You can carry your puppy for socialisation exposure, or let them play with fully vaccinated dogs in clean private environments. Full off-lead freedom comes 2 weeks after the final dose.',
  },
  {
    q: 'What if my puppy already has some vaccinations from the breeder?',
    a: 'No problem — VetPac continues from wherever your puppy left off. Your intake asks for the prior vaccine product, dose number, and date. Your vet will design the remaining programme so nothing is repeated unnecessarily.',
  },
  {
    q: 'Can I meet the technician before you send someone to my home?',
    a: 'Yes. Before any home visit, our senior programme coordinator will video call you to introduce the technician assigned to your puppy, walk you through what to expect, and make sure you are completely comfortable. Every technician is individually matched to ensure they share our values around animal care.',
  },
  {
    q: 'What if my puppy seems unwell on the day?',
    a: 'Never proceed if your puppy is showing any signs of illness, however mild. We include a simple pre-vaccination checklist in every kit. If anything flags, stop and chat with us — we will hold your programme until your puppy is well.',
  },
  {
    q: 'What if something goes wrong after vaccination?',
    a: 'Our chat support is available 24 hours a day, 7 days a week. Message us immediately if your puppy shows any unusual signs after vaccination. Serious reactions are rare — under 0.07% of doses — but we are here if you need us.',
  },
  {
    q: 'Do puppies need annual boosters?',
    a: 'Yes. Vaccine immunity fades after 1–3 years. Annual C5 boosters maintain full protection. Most boarding facilities and doggy day care centres require an up-to-date C5 certificate — VetPac provides these for every dose.',
  },
  {
    q: 'Do you cover all of New Zealand?',
    a: 'Yes — we cover all regions of New Zealand including rural addresses. Cold-chain delivery reaches every part of the country.',
  },
  {
    q: 'Is the vaccination record official?',
    a: 'Yes. Every programme includes a signed vaccination certificate confirming the vaccine product, batch number, date, and authorising veterinarian. It is accepted by boarding facilities, groomers, and vets across New Zealand.',
  },
  {
    q: 'How much does VetPac cost?',
    a: 'The initial consultation is $49. Each vaccine is $89. Cold-chain delivery is $119 per shipment. A typical 3-dose puppy course costs approximately $624 all in. The optional Programme Warranty is $225 one-time and covers vaccine failure and adverse reactions up to $5,000.',
  },
]
