export const CONSULTATION_FEE = {
  id: 'consultation',
  name: 'Initial Consultation',
  price: 289,
  description: 'Full health assessment and personalised vaccine plan for your dog.',
  includes: [
    'Personalised health intake',
    'Video assessment of your dog',
    'Vaccine plan designed for your puppy\'s age, breed, and lifestyle',
    'Digital health record and vaccination certificate',
    'Around-the-clock support throughout your dog\'s programme',
  ],
  refundNote: 'Full refund if we determine your dog needs an alternative approach.',
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
    description: 'Recommended for dogs with rural or waterway exposure.',
    price: 89,
    note: 'Recommended based on your lifestyle responses.',
  },
  KENNEL_COUGH: {
    id: 'kennel_cough',
    name: 'Kennel Cough',
    fullName: 'Kennel Cough — Bordetella bronchiseptica',
    description: 'Recommended for dogs attending boarding, daycare, or dog parks.',
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
    scenario: 'Adult dog, single C5 booster',
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
  'Bernese Mountain Dog',
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
  { path: '/intake', label: "Your Dog's Profile" },
  { path: '/intake/health', label: 'Health History' },
  { path: '/intake/lifestyle', label: 'Lifestyle & Environment' },
  { path: '/intake/owner', label: 'Your Details' },
  { path: '/intake/video', label: 'Dog Video' },
  { path: '/intake/review', label: 'Review & Confirm' },
]

export const FAQ_ITEMS = [
  {
    q: 'How does it work?',
    a: 'Get started below — it takes less than 10 minutes to set up your dog\'s health plan. We design a personalised vaccination programme for your dog based on their age, breed, and lifestyle. From there, every vaccination is done at home, at a time that suits you. Already started? Pick up right where you left off.',
  },
  {
    q: 'What vaccines do you offer?',
    a: 'We offer C3 and C5 — the standard core vaccinations for dogs in New Zealand. C3 covers Distemper, Hepatitis, and Parvovirus. C5 covers everything in C3 plus Parainfluenza and Kennel Cough. We also offer Leptospirosis and Kennel Cough vaccines where your dog\'s lifestyle warrants it.',
  },
  {
    q: "I've never done it this way before. Is it safe and sterile at home?",
    a: 'Yes — and in many ways, your home is a better environment than a clinic waiting room. Every vaccine arrives in sealed, sterile, single-use packaging. The equipment is pharmaceutical grade. Your home has none of the pathogens that circulate in a clinic waiting room, which is particularly important for unvaccinated puppies. We walk you through everything — you are supported at every step.',
  },
  {
    q: 'What is included?',
    a: 'Everything needed for a safe, complete vaccination at home. The vaccines your dog needs, sealed and sterile. Full clinical documentation confirming what was administered and when. Temperature indicator confirming the cold chain was maintained throughout delivery. Our 0800 support line available around the clock.',
  },
  {
    q: 'How are the vaccines kept safe during delivery?',
    a: 'Every shipment is packed in pharmaceutical-grade insulated packaging with a certified gel ice pack rated to maintain 2-8 degrees Celsius for a minimum of 48 hours. A colour-change temperature indicator strip is included. If it is green on arrival, the cold chain held throughout. If it has changed colour, contact us and we will send a replacement within 24 hours.',
  },
  {
    q: 'Can you send someone to do it at our home?',
    a: 'Yes. A trained VetPac technician can come to your home and take care of everything. Same-day or next-day availability in Auckland. We will discuss all options with you once your plan is set up.',
  },
  {
    q: 'What if my dog seems unwell on the day?',
    a: 'Never proceed if your dog is showing any signs of illness, however mild. We include a simple pre-vaccination checklist as part of the process. If anything flags, stop and call us. We will hold your programme until your dog is well and advise on next steps.',
  },
  {
    q: 'What if something goes wrong after vaccination?',
    a: 'Our 0800 VETPAC line is staffed 24 hours a day, 7 days a week. If your dog shows any unusual signs following vaccination, call us immediately. We will advise you on whether to monitor at home or attend an emergency clinic and stay with you throughout. The number is in your confirmation and on your documentation.',
  },
  {
    q: 'Do you cover all of New Zealand?',
    a: 'Yes — we cover all regions of New Zealand including rural addresses. Auckland is typically next day. Wellington and Christchurch 1-2 business days. Rest of New Zealand 2-3 business days.',
  },
  {
    q: 'Is the vaccination record official?',
    a: 'Yes. Every programme includes a signed vaccination certificate confirming your dog\'s vaccinations, the products used, and the dates administered. It is accepted by boarding facilities, groomers, and vets, and is the same standard of record you would receive from a clinic.',
  },
  {
    q: 'What is your refund policy?',
    a: 'If following your consultation we determine your dog needs an alternative approach, you are refunded in full. If your delivery arrives with a triggered temperature indicator, we replace it at no cost. If you cancel before your programme begins, full refund. Once your programme is underway and vaccines have been administered, we are unable to refund.',
  },
]
