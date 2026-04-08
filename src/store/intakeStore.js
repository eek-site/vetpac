import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CONSULTATION_FEE, VACCINE_PRODUCTS, FREIGHT } from '../lib/constants'

const defaultDogProfile = {
  name: '',
  breed: '',
  dob: '',
  sex: '',
  desexed: '',
  weight_kg: '',
  colour: '',
  microchip_no: '',
  vaccinated_before: '',
  last_vaccination_date: '',
  prior_vaccines: [],
  certificate_available: '',
}

const defaultHealthHistory = {
  currently_ill: '',
  illness_description: '',
  prior_vaccine_reaction: '',
  reaction_description: '',
  known_allergies: '',
  allergy_description: '',
  current_medications: '',
  medication_list: '',
  surgeries: '',
  surgery_description: '',
  health_conditions: '',
  condition_description: '',
  pregnant_or_nursing: '',
  last_meal: '',
  activity_level: '',
}

const defaultLifestyle = {
  living_environment: '',
  dog_parks_boarding: '',
  waterway_access: '',
  other_dogs_household: '',
  livestock_contact: '',
  region: '',
}

const defaultOwnerDetails = {
  full_name: '',
  dob: '',
  email: '',
  mobile: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postcode: '',
  region: '',
  is_owner: false,
  understands_voi: false,
  agrees_tos: false,
  agrees_privacy: false,
}

// Build the initial selected vaccines list from the AI assessment result.
// Each entry: { id, name, fullName, description, price, selected, doseNumber, scheduledDate, note, recommended }
export function buildVaccinePlan(aiAssessment, dogProfile) {
  const dob = dogProfile?.dob ? new Date(dogProfile.dob) : new Date()
  const scheduleDate = (weeksFromDob) => {
    const d = new Date(dob)
    d.setDate(d.getDate() + weeksFromDob * 7)
    return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const plan = aiAssessment?.treatment_plan
  if (!plan) {
    // Fallback: full puppy course
    return [
      { ...VACCINE_PRODUCTS.C3, selected: true, doseNumber: 1, scheduledDate: scheduleDate(8), recommended: true },
      { ...VACCINE_PRODUCTS.C5, selected: true, doseNumber: 2, scheduledDate: scheduleDate(12), recommended: true },
      { ...VACCINE_PRODUCTS.C5, id: 'c5_d3', selected: true, doseNumber: 3, scheduledDate: scheduleDate(16), recommended: true },
    ]
  }

  // Build from AI recommended products
  const items = []
  const products = plan.recommended_products || []
  products.forEach((p, i) => {
    const isC3 = p.product_name?.toLowerCase().includes('c3')
    const base = isC3 ? VACCINE_PRODUCTS.C3 : VACCINE_PRODUCTS.C5
    items.push({
      ...base,
      id: `${base.id}_d${p.dose_number || i + 1}`,
      selected: true,
      doseNumber: p.dose_number || i + 1,
      scheduledDate: p.scheduled_date || scheduleDate((p.scheduled_age_weeks || 8) + i * 4),
      recommended: true,
      note: p.administration_instructions ? base.note : base.note,
    })
  })

  // If AI didn't return products, build standard 3-dose
  if (!items.length) {
    items.push(
      { ...VACCINE_PRODUCTS.C3, id: 'c3_d1', selected: true, doseNumber: 1, scheduledDate: scheduleDate(8), recommended: true },
      { ...VACCINE_PRODUCTS.C5, id: 'c5_d2', selected: true, doseNumber: 2, scheduledDate: scheduleDate(12), recommended: true },
      { ...VACCINE_PRODUCTS.C5, id: 'c5_d3', selected: true, doseNumber: 3, scheduledDate: scheduleDate(16), recommended: true },
    )
  }

  // Lepto add-on
  if (plan.leptospirosis_recommended) {
    items.push({
      ...VACCINE_PRODUCTS.LEPTO,
      id: 'lepto_addon',
      selected: true,
      doseNumber: null,
      scheduledDate: 'With dose 1',
      recommended: true,
      note: plan.leptospirosis_reason || VACCINE_PRODUCTS.LEPTO.note,
    })
  }

  // Kennel cough add-on
  if (plan.kennel_cough_recommended) {
    items.push({
      ...VACCINE_PRODUCTS.KENNEL_COUGH,
      id: 'kc_addon',
      selected: true,
      doseNumber: null,
      scheduledDate: 'With dose 1',
      recommended: true,
      note: plan.kennel_cough_reason || VACCINE_PRODUCTS.KENNEL_COUGH.note,
    })
  }

  return items
}

export const useIntakeStore = create(
  persist(
    (set, get) => ({
      dogProfile: defaultDogProfile,
      healthHistory: defaultHealthHistory,
      lifestyle: defaultLifestyle,
      ownerDetails: defaultOwnerDetails,
      videoUrl: null,
      videoFile: null,
      aiAssessment: null,

      // Stage 1: consultation (fixed, always included)
      consultationFee: CONSULTATION_FEE,

      // Stage 2: itemised vaccine plan built from AI output
      vaccinePlan: [], // array of vaccine items with `selected` flag
      assistSelected: false,

      dogId: null,
      intakeId: null,

      // ─── Actions ────────────────────────────────────────────────────────────
      updateDogProfile: (data) =>
        set((s) => ({ dogProfile: { ...s.dogProfile, ...data } })),

      updateHealthHistory: (data) =>
        set((s) => ({ healthHistory: { ...s.healthHistory, ...data } })),

      updateLifestyle: (data) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, ...data } })),

      updateOwnerDetails: (data) =>
        set((s) => ({ ownerDetails: { ...s.ownerDetails, ...data } })),

      setVideoUrl: (url) => set({ videoUrl: url }),
      setVideoFile: (file) => set({ videoFile: file }),

      setAiAssessment: (assessment) => {
        const plan = buildVaccinePlan(assessment, get().dogProfile)
        set({ aiAssessment: assessment, vaccinePlan: plan })
      },

      toggleVaccineItem: (itemId) =>
        set((s) => ({
          vaccinePlan: s.vaccinePlan.map((item) =>
            item.id === itemId ? { ...item, selected: !item.selected } : item
          ),
        })),

      setAssistSelected: (val) => set({ assistSelected: val }),
      setDogId: (id) => set({ dogId: id }),
      setIntakeId: (id) => set({ intakeId: id }),

      // ─── Computed totals ────────────────────────────────────────────────────
      getOrderTotals: () => {
        const s = get()
        const vaccineTotal = s.vaccinePlan
          .filter((v) => v.selected)
          .reduce((sum, v) => sum + v.price, 0)

        // Count unique shipment dates to calculate freight
        const shipmentDates = [...new Set(
          s.vaccinePlan.filter((v) => v.selected && v.doseNumber).map((v) => v.scheduledDate)
        )]
        const shipmentCount = Math.max(shipmentDates.length, s.vaccinePlan.filter((v) => v.selected && v.doseNumber).length > 0 ? 1 : 0)
        const freightTotal = shipmentCount * FREIGHT.pricePerShipment
        const assistTotal = s.assistSelected ? 45 : 0 // per visit × shipments (simplified to first visit)

        return {
          consultation: CONSULTATION_FEE.price,
          vaccines: vaccineTotal,
          freight: freightTotal,
          shipmentCount,
          assist: assistTotal,
          total: CONSULTATION_FEE.price + vaccineTotal + freightTotal + assistTotal,
        }
      },

      resetIntake: () =>
        set({
          dogProfile: defaultDogProfile,
          healthHistory: defaultHealthHistory,
          lifestyle: defaultLifestyle,
          ownerDetails: defaultOwnerDetails,
          videoUrl: null,
          videoFile: null,
          aiAssessment: null,
          vaccinePlan: [],
          assistSelected: false,
          dogId: null,
          intakeId: null,
        }),
    }),
    {
      name: 'vetpac-intake',
      partialize: (s) => ({
        dogProfile: s.dogProfile,
        healthHistory: s.healthHistory,
        lifestyle: s.lifestyle,
        ownerDetails: s.ownerDetails,
        videoUrl: s.videoUrl,
        aiAssessment: s.aiAssessment,
        vaccinePlan: s.vaccinePlan,
        assistSelected: s.assistSelected,
        dogId: s.dogId,
        intakeId: s.intakeId,
      }),
    }
  )
)
