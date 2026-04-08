import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PawPrint } from 'lucide-react'
import Input from '../../components/ui/Input'
import RadioGroup from '../../components/ui/RadioGroup'
import { SearchableSelect } from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { NZ_BREEDS } from '../../lib/constants'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  breed: z.string().min(1, 'Please select a breed'),
  dob: z.string().min(1, 'Date of birth is required'),
  sex: z.string().min(1, 'Please select sex'),
  desexed: z.string().min(1, 'Please select an option'),
  weight_kg: z.string().min(1, 'Weight is required'),
  colour: z.string().optional(),
  microchip_no: z.string().optional(),
  vaccinated_before: z.string().min(1, 'Please select an option'),
})

export default function Step1DogProfile() {
  const navigate = useNavigate()
  const { dogProfile, updateDogProfile } = useIntakeStore()

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: dogProfile,
  })

  const vaccinatedBefore = watch('vaccinated_before')

  const onSubmit = (data) => {
    updateDogProfile(data)
    navigate('/intake/health')
  }

  const dobValue = watch('dob')
  const ageText = dobValue ? (() => {
    const dob = new Date(dobValue)
    const now = new Date()
    const weeks = Math.floor((now - dob) / (7 * 24 * 60 * 60 * 1000))
    if (weeks < 20) return `${weeks} weeks old`
    const months = Math.floor(weeks / 4.33)
    if (months < 24) return `${months} months old`
    return `${Math.floor(months / 12)} years old`
  })() : null

  return (
    <IntakeLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <PawPrint className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Tell us about your dog</h1>
        <p className="text-textSecondary">This helps us build the right vaccination plan for your pup.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Dog's name"
          required
          placeholder="e.g. Bella"
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          name="breed"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Breed"
              required
              options={NZ_BREEDS}
              value={field.value}
              onChange={field.onChange}
              error={errors.breed?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Date of birth"
              required
              type="date"
              max={new Date().toISOString().split('T')[0]}
              error={errors.dob?.message}
              helper={ageText}
              {...register('dob')}
            />
          </div>
          <Input
            label="Weight (kg)"
            required
            type="number"
            step="0.1"
            min="0.5"
            max="120"
            placeholder="e.g. 8.5"
            error={errors.weight_kg?.message}
            {...register('weight_kg')}
          />
        </div>

        <Controller
          name="sex"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Sex"
              required
              name="sex"
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
              value={field.value}
              onChange={field.onChange}
              error={errors.sex?.message}
              inline
            />
          )}
        />

        <Controller
          name="desexed"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Desexed?"
              required
              name="desexed"
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_yet', label: 'Not yet' }]}
              value={field.value}
              onChange={field.onChange}
              error={errors.desexed?.message}
              inline
            />
          )}
        />

        <Input
          label="Colour / markings"
          placeholder="e.g. black and white"
          {...register('colour')}
        />

        <Input
          label="Microchip number"
          placeholder="15-digit number (if known)"
          {...register('microchip_no')}
        />

        <Controller
          name="vaccinated_before"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Has your dog been vaccinated before?"
              required
              name="vaccinated_before"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.vaccinated_before?.message}
              inline
            />
          )}
        />

        {vaccinatedBefore === 'yes' && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <Input
              label="Last vaccination date"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('last_vaccination_date')}
            />
            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">Which vaccines? (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {['C3', 'C4', 'C5', 'Leptospirosis', 'Kennel Cough', 'Unknown'].map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-bg">
                    <input type="checkbox" value={v} {...register('prior_vaccines')} className="rounded" />
                    <span className="text-sm text-textSecondary">{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Continue to Health History →
          </Button>
        </div>
      </form>
    </IntakeLayout>
  )
}
