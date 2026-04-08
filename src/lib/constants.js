export const CONSULTATION_FEE = {
  id: 'consultation',
  name: 'Initial Consultation',
  price: 289,
  description: 'Full health assessment and personalised vaccine plan for your dog.',
  includes: [
    'Personalised health intake (10-15 min)',
    'Video assessment of your dog',
    'Tailored vaccine schedule for your dog\'s age, history, and lifestyle',
    'Full vaccine plan confirmed before anything ships',
    'Digital health record and vaccination certificate',
    'Step-by-step administration guide with every delivery',
  ],
  refundNote: 'Refunded in full if an in-person visit is recommended for your dog.',
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
    a: 'Fill in a short form about your dog — takes around 10 minutes. Record a quick video of your dog. Your vaccine plan is confirmed within a few hours. The vaccines arrive cold-chain couriered to your door, usually next day. Everything you need is in the box — just follow the step-by-step guide and you are done.',
  },
  {
    q: 'What vaccines do you offer?',
    a: 'We offer C3 and C5 — the standard core vaccinations for dogs in New Zealand. C3 covers Distemper, Hepatitis, and Parvovirus. C5 covers everything in C3 plus Parainfluenza and Kennel Cough. We also offer Leptospirosis and standalone Kennel Cough vaccines where needed based on your dog\'s lifestyle.',
  },
  {
    q: "I've never given an injection before. Is this something I can actually do?",
    a: 'Yes — most owners are surprised by how easy it is. It is a simple under-the-skin injection at the scruff of the neck. Every box includes a step-by-step video guide and a printed quick-reference card. Pre-loaded syringes, alcohol wipes, and a sharps disposal bag are all included. If you would rather not do it yourself, add our home visit option at checkout and we will send a trained technician to your door.',
  },
  {
    q: 'What is included in the box?',
    a: 'The vaccines your dog needs, pre-loaded to the correct dose. Step-by-step administration guide (printed card and video link). Alcohol wipes and a sharps disposal bag. A temperature indicator strip confirming the cold chain held during delivery. Our 0800 emergency number printed on the packaging.',
  },
  {
    q: 'How are the vaccines kept cold?',
    a: 'Every shipment is packed in pharmaceutical-grade insulated packaging with a certified gel ice pack rated to hold 2-8 degrees Celsius for a minimum of 48 hours. A colour-change temperature indicator strip is included in every box. If it is green when your order arrives, the cold chain held. If it has changed colour, do not use the vaccine — contact us and we will send a replacement within 24 hours.',
  },
  {
    q: 'Can someone come and do the injection for me?',
    a: 'Yes. Add VetPac Assist at checkout. A trained technician comes to your home and administers the vaccine for you. Same-day or next-day availability. Currently available in Auckland only.',
  },
  {
    q: 'What if my dog seems unwell when the vaccines arrive?',
    a: 'Do not vaccinate a dog that is unwell, even mildly. Every box includes a short pre-administration checklist to run through before you start. If your dog fails any item on it, hold off and call us. We can delay your next shipment or hold your order — just get in touch.',
  },
  {
    q: 'What if something goes wrong after the injection?',
    a: 'Our 0800 VETPAC line is staffed 24 hours a day, 7 days a week. The number is on the box, in your confirmation email, and in your account. If your dog shows any unusual signs after vaccination, call us immediately and we will advise you on what to do. Keep an eye on your dog for around 30 minutes after administering.',
  },
  {
    q: 'Do you deliver everywhere in New Zealand?',
    a: 'Yes — we deliver to all regions of New Zealand including rural addresses. Auckland is typically next day. Wellington and Christchurch 1-2 business days. Rest of New Zealand 2-3 business days. Signature required on delivery.',
  },
  {
    q: 'Is my dog\'s vaccination record official?',
    a: 'Yes. Every order includes a signed vaccination certificate confirming your dog\'s vaccinations, the products used, and the dates administered. This is the same record you would receive from a clinic visit and is accepted by boarding facilities, groomers, and border crossings.',
  },
  {
    q: 'What is your refund policy?',
    a: 'If we recommend an in-person visit for your dog after your assessment, you are refunded in full. If your delivery arrives with a triggered temperature strip, we replace it free and refund the original. If you cancel before dispatch, full refund. If you cancel after dispatch, a restocking fee applies. Once vaccines have been administered we cannot accept returns.',
  },
]
