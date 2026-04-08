// ─── Stage 1: Consultation ───────────────────────────────────────────────────
// Paid first. Covers AI intake, NZ vet review, VOI issuance.
// One fee covers the entire multi-dose course — not per visit.
export const CONSULTATION_FEE = {
  id: 'consultation',
  name: 'Consultation & Vet Review',
  price: 95,
  description: 'AI-guided health intake, video assessment, NZ-registered vet review, and Veterinary Operating Instruction for your dog\'s full vaccine course.',
  includes: [
    'Personalised AI health intake (10–15 min)',
    'Video assessment reviewed by AI + NZ vet',
    'Full clinical review by a VCNZ-registered vet',
    'Veterinary Operating Instruction (VOI) issued in your name',
    'Tailored vaccine schedule based on your dog\'s history',
    'Digital health record + printable vaccination certificate',
  ],
  refundNote: 'Refunded in full if your vet refers you to an in-person clinic.',
}

// ─── Stage 2: Vaccines (per dose, itemised after consult) ────────────────────
// Surfaced after the AI determines exactly what the dog needs.
// Priced per dose so you see exactly what you are paying for.
export const VACCINE_PRODUCTS = {
  C3: {
    id: 'c3',
    name: 'C3 Vaccine',
    fullName: 'C3 — Distemper, Hepatitis, Parvovirus',
    description: 'Core first puppy dose protecting against the three most common fatal canine diseases.',
    price: 78,
    note: 'Typically the first dose for puppies 6–8 weeks.',
  },
  C5: {
    id: 'c5',
    name: 'C5 Vaccine',
    fullName: 'C5 — Distemper, Hepatitis, Parvovirus + Parainfluenza + Kennel Cough',
    description: 'Full core protection plus upper respiratory cover. Standard from 10 weeks and for annual boosters.',
    price: 92,
    note: 'Standard for doses 2, 3 and annual boosters.',
  },
  LEPTO: {
    id: 'lepto',
    name: 'Leptospirosis Vaccine',
    fullName: 'Leptospirosis — Leptospira interrogans',
    description: 'Recommended for dogs in rural areas or with access to waterways, rivers, or farm animals.',
    price: 59,
    note: 'Recommended based on your lifestyle responses.',
  },
  KENNEL_COUGH: {
    id: 'kennel_cough',
    name: 'Kennel Cough (Bordetella)',
    fullName: 'Kennel Cough — Bordetella bronchiseptica (intranasal)',
    description: 'Recommended for dogs attending boarding, daycare, dog parks, or training classes.',
    price: 54,
    note: 'Recommended based on your lifestyle responses.',
  },
}

// ─── Freight ─────────────────────────────────────────────────────────────────
// Charged per shipment. Multi-dose courses ship at the correct clinical interval.
export const FREIGHT = {
  id: 'freight',
  name: 'Cold-chain courier',
  pricePerShipment: 22,
  description: 'Pharmaceutical-grade cold-chain packaging maintaining 2–8°C. Temperature indicator strip included. Signature required.',
}

// ─── Add-ons ─────────────────────────────────────────────────────────────────
export const ADDONS = {
  ASSIST: {
    id: 'assist',
    name: 'VetPac Assist',
    description: 'A trained VetPac technician visits your home to administer the vaccine for you.',
    price: 69,
    note: 'Auckland only. Same-day or next-day availability.',
  },
  WORMING: { id: 'worming', name: 'Worming Treatment', price: 29 },
  FLEA: { id: 'flea', name: 'Flea Treatment', price: 34 },
}

// ─── Homepage pricing examples (illustrative) ─────────────────────────────────
export const PRICING_EXAMPLES = [
  {
    id: 'puppy_course',
    label: 'Full puppy course from scratch',
    scenario: '3-dose programme (C3 + C5 + C5), shipped at clinical intervals',
    consultation: 95,
    vaccines: [
      { name: 'C3 — dose 1 (6–8 weeks)', price: 78 },
      { name: 'C5 — dose 2 (10–12 weeks)', price: 92 },
      { name: 'C5 — dose 3 (14–16 weeks)', price: 92 },
    ],
    shipments: 3,
    badge: 'Most common',
  },
  {
    id: 'single_dose',
    label: 'Annual booster',
    scenario: 'Adult dog, up-to-date records, single C5 booster',
    consultation: 95,
    vaccines: [
      { name: 'C5 — annual booster', price: 92 },
    ],
    shipments: 1,
  },
  {
    id: 'partial_course',
    label: 'Partially vaccinated puppy',
    scenario: '2 doses remaining — AI determines based on prior records',
    consultation: 95,
    vaccines: [
      { name: 'C5 — dose 2 (10–12 weeks)', price: 92 },
      { name: 'C5 — dose 3 (14–16 weeks)', price: 92 },
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
    q: 'Is this actually legal in New Zealand?',
    a: `Yes — and it's important you understand exactly how.

VetPac operates under the Veterinary Operating Instruction (VOI) framework established in the ACVM Act 1997. A VOI is a legal document issued by a NZ-registered veterinarian that authorises a named individual to purchase and administer specific Restricted Veterinary Medicines (RVMs) to their own animal.

This is not a workaround or grey area. VOIs have been in common use for decades — they are the standard mechanism by which NZ farmers vaccinate their own livestock and working dogs without a vet being physically present. It is one of the most widely-used provisions in NZ veterinary law.

The key difference VetPac introduces is doing this digitally for dog owners, using AI-assisted intake and video assessment to give the reviewing vet "sufficient information" about the animal — the same legal standard that applies to any VOI. Every order is reviewed by a NZ-registered vet holding a current VCNZ Annual Practising Certificate before any vaccine is dispatched.

The vaccines we supply are exactly the same products your local vet uses.`,
  },
  {
    q: 'Who is the vet who reviews my dog? Are they qualified?',
    a: `Every VetPac intake is reviewed by a NZ-registered veterinarian who holds a current Annual Practising Certificate issued by the Veterinary Council of New Zealand (VCNZ). This is the same credential required of any vet working in NZ.

Our partner vets are experienced in small animal medicine and have been specifically briefed on the VetPac platform, the VOI model, and the clinical standards we apply to each assessment.

You will receive the reviewing vet's name and VCNZ registration number with your Veterinary Operating Instruction. Your VOI is a legal document you should keep — it confirms that a qualified NZ vet has authorised the specific vaccines for your specific dog.`,
  },
  {
    q: 'What vaccines do you supply, and are they the same brands my vet uses?',
    a: `We supply C3 and C5 vaccines — the standard core puppy and adult dog vaccinations in New Zealand.

C3 protects against: Canine Distemper Virus, Canine Adenovirus (Hepatitis), and Canine Parvovirus.
C5 protects against: everything in C3, plus Canine Parainfluenza Virus and Bordetella bronchiseptica (Kennel Cough).

We source vaccines from NZ-approved suppliers only. The brands we use — such as Vanguard Plus 5 (Zoetis) and equivalents — are the same products used in NZ veterinary clinics. We do not use grey-market or imported vaccines.

Optional add-ons include standalone Leptospirosis vaccination (recommended for dogs with rural or waterway exposure) and additional Kennel Cough protection.`,
  },
  {
    q: 'How are vaccines kept cold during delivery? What if the temperature goes wrong?',
    a: `Every VetPac shipment is packed in an insulated polystyrene inner box with a certified gel ice pack rated to maintain 2–8°C for a minimum of 48 hours — well beyond our typical 1–3 business day nationwide delivery window.

Each box includes a colour-change temperature indicator strip. This strip is green when your order arrives. If it has changed colour (indicating the cold chain was compromised at any point in transit), do not use the vaccine — contact us immediately and we will dispatch a free replacement within 24 hours, no questions asked.

We only work with courier partners who have pharmaceutical cold-chain capability and signature-required delivery for all medical shipments.`,
  },
  {
    q: "I've never given an injection before. Is this actually something I can do?",
    a: `Most owners are surprised by how straightforward it is. A subcutaneous (under-the-skin) injection is significantly easier than it sounds — you are not injecting into muscle or a vein. You are simply lifting the skin at the scruff of the neck to form a small tent and injecting beneath it.

Here is what we include to make sure you feel completely prepared:
• A professional 5-minute administration video (filmed with a vet demonstrating each step)
• A printed two-sided laminated card in the box: quick-reference checklist on one side, emergency info on the other
• Pre-loaded syringes with the correct gauge needle for your dog's size
• Alcohol wipes and a sharps disposal bag
• An 0800 emergency number staffed by an on-call vet technician

If you would genuinely rather not do it yourself, add VetPac Assist at checkout. A trained technician will come to your home — Auckland same-day or next-day, no clinic stress for you or your dog.`,
  },
  {
    q: 'What happens if my dog has a reaction?',
    a: `Vaccine reactions in dogs are uncommon — the rate for routine core vaccines is well under 1% — but we take this seriously.

Every VetPac order includes our 0800 VETPAC emergency line number on the packaging, in your confirmation email, and in your dashboard. This line is answered by an on-call vet technician 24 hours a day, 7 days a week. They will advise you on whether to monitor at home or attend an emergency vet, and will stay on the line with you.

We ask all owners to observe their dog for 30 minutes after administration. Signs of a significant reaction typically appear within this window: facial swelling, hives, vomiting, extreme lethargy, or collapse. These are rare — but knowing what to look for matters.

All adverse events are logged in our system and reported to MPI (Ministry for Primary Industries) within 72 hours, as required under the ACVM Act. Your VOI may be reviewed or revoked following an adverse event.`,
  },
  {
    q: 'What if the vet reviews my intake and says my dog cannot be vaccinated?',
    a: `This can happen, and we handle it respectfully and promptly.

If our reviewing vet determines that your dog needs an in-person physical examination before vaccinating — because of flagged health concerns, ambiguity in the assessment, or other clinical reasons — you will be notified within 4 hours of your submission during business hours.

In this case, a full refund is initiated immediately. We will also provide a written summary of the vet's findings and a recommendation for next steps, so you can bring this to your local vet. There is no charge for the intake or vet review if you are referred.

Our AI intake system is specifically designed to flag obvious concerns before you reach the vet review stage — so referrals are relatively uncommon for otherwise healthy dogs. But safety comes first, always.`,
  },
  {
    q: 'Do I really need to record a video of my dog?',
    a: `Yes, and here is why it matters. The video is the single most important part of the vet's remote assessment.

A 90-second video showing your dog walking, their face (eyes and nose), and their body from each side gives the reviewing vet a direct visual assessment of:
• Mobility — is the dog moving freely without lameness?
• Eye and nasal discharge — common early indicators of illness
• Body condition — appropriate weight for breed and age
• General alertness and demeanour

This is what allows a qualified vet to issue a VOI with clinical confidence, without requiring a physical consultation. Without the video, the vet's assessment is limited to your written responses alone — and they are more likely to request an in-person visit as a result.

The video takes about 2 minutes to record. We show you exactly what angles to capture, step by step.`,
  },
  {
    q: 'What if my dog is sick on the day the vaccines arrive?',
    a: `Do not vaccinate a dog that is unwell, even mildly. This is a firm rule — it applies whether you are at a clinic or at home.

Your VetPac box includes a pre-administration health checklist that you complete immediately before giving the injection. If your dog fails any item on that checklist (lethargy, loss of appetite, discharge, vomiting, diarrhoea, elevated temperature), the instruction is clear: do not proceed. Contact us.

If your dog becomes unwell between ordering and your vaccine arriving, call our support line. We can delay shipment, hold your order, or advise on next steps. Vaccines in transit have a 48-hour temperature window, so there is some flexibility.

If your dog requires veterinary care, your order will be held until they have recovered and been cleared.`,
  },
  {
    q: 'What areas do you deliver to?',
    a: `We deliver to all regions of New Zealand, including rural addresses. All shipments are via pharmaceutical-grade cold-chain courier with signature required on delivery.

Delivery times: Auckland 1 business day, Wellington and Christchurch 1–2 business days, rest of North Island 2 business days, South Island (outside Christchurch) 2–3 business days.

VetPac Assist — where a trained technician visits your home to administer the vaccine — is currently available in Auckland only. Wellington and Christchurch are on our roadmap. If you are outside Auckland and prefer not to administer yourself, please contact us to discuss options.`,
  },
  {
    q: "What's a VOI, and what does mine actually say?",
    a: `A Veterinary Operating Instruction (VOI) is a legal document issued under section 44G of the ACVM Act 1997. It is the instrument that authorises you, by name, to purchase and administer specific Restricted Veterinary Medicines to your dog.

Your VetPac VOI will include:
• Your full name and date of birth (as the authorised person)
• Your dog's details (name, breed, weight, age, sex)
• The specific vaccines authorised (product name, dose, route, site)
• The administration schedule (which doses, on what dates)
• The issuing vet's name, VCNZ registration number, and practice details
• Valid from and valid until dates (maximum 12 months)
• The vet's digital signature

A copy is emailed to you in PDF format, another is included in every delivery box, and the original is stored securely in our system for a minimum of 7 years (the VCNZ-required retention period).`,
  },
  {
    q: "What's your refund policy?",
    a: `We aim to be fair and straightforward.

Full refund, no questions asked:
• If our vet review determines your dog needs an in-person examination, you are refunded in full — including any delivery charges.
• If your delivery arrives with a triggered temperature indicator (cold chain compromised), we replace the order at no cost and refund your original order.
• If you cancel before your order has been dispatched, you receive a full refund.

Partial refund:
• If you cancel after dispatch but before delivery, a restocking and return fee applies.

No refund:
• Once vaccines have been administered, we cannot accept returns for health and safety reasons.
• If vaccines were administered and there was no product defect, we are unable to refund.

We believe in doing the right thing. If something has gone wrong that is our fault — contact us and we will make it right.`,
  },
]
