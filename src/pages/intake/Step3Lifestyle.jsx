import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { MapPin } from 'lucide-react'
import RadioGroup from '../../components/ui/RadioGroup'
import { Select } from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { NZ_REGIONS } from '../../lib/constants'

export default function Step3Lifestyle() {
  const navigate = useNavigate()
  const { lifestyle, updateLifestyle } = useIntakeStore()
  const { control, handleSubmit } = useForm({ defaultValues: lifestyle })

  const onSubmit = (data) => {
    updateLifestyle(data)
    navigate('/intake/owner')
  }

  const yesSometimesNo = [
    { value: 'yes', label: 'Yes' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'no', label: 'No' },
  ]

  const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

  return (
    <IntakeLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Lifestyle & environment</h1>
        <p className="text-textSecondary">This helps us recommend the right vaccines for your dog's lifestyle.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <Controller
          name="living_environment"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Where does your dog live?"
              required
              name="living_environment"
              options={[
                { value: 'urban', label: 'Urban / Suburban' },
                { value: 'rural', label: 'Rural' },
                { value: 'farm', label: 'Farm property' },
              ]}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="dog_parks_boarding"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Does your dog visit dog parks, boarding, or daycare?"
              required
              name="dog_parks_boarding"
              options={yesSometimesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="waterway_access"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Does your dog swim or have access to waterways?"
              required
              name="waterway_access"
              options={yesSometimesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="other_dogs_household"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Are there other dogs in your household?"
              required
              name="other_dogs_household"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="livestock_contact"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Does your dog have contact with livestock?"
              required
              name="livestock_contact"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="region"
          control={control}
          render={({ field }) => (
            <Select
              label="Your region"
              required
              options={NZ_REGIONS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select your region..."
            />
          )}
        />

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Continue to Your Details →
          </Button>
        </div>
      </form>
    </IntakeLayout>
  )
}
