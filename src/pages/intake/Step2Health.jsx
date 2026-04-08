import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Heart, AlertTriangle } from 'lucide-react'
import RadioGroup from '../../components/ui/RadioGroup'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'

export default function Step2Health() {
  const navigate = useNavigate()
  const { healthHistory, updateHealthHistory } = useIntakeStore()

  const { control, handleSubmit, watch, register } = useForm({ defaultValues: healthHistory })

  const currentlyIll = watch('currently_ill')
  const priorReaction = watch('prior_vaccine_reaction')
  const hasAllergies = watch('known_allergies')
  const hasMeds = watch('current_medications')
  const hasSurgeries = watch('surgeries')
  const hasConditions = watch('health_conditions')

  const onSubmit = (data) => {
    updateHealthHistory(data)
    if (data.currently_ill === 'yes') {
      navigate('/intake/referral')
    } else {
      navigate('/intake/lifestyle')
    }
  }

  const yesNoUnknown = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'unknown', label: 'Unknown' },
  ]
  const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

  return (
    <IntakeLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-6 h-6 text-error" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Health history</h1>
        <p className="text-textSecondary">Help us understand your dog's current and past health.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <Controller
          name="currently_ill"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Is your dog currently showing any signs of illness?"
              required
              name="currently_ill"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        {currentlyIll === 'yes' && (
          <Alert type="error" title="Please don't proceed">
            VetPac is for healthy dogs only. You'll need to consult a vet in person before vaccinating. We'll help you find next steps.
          </Alert>
        )}

        {currentlyIll === 'yes' && (
          <Textarea
            label="Describe the symptoms"
            required
            placeholder="What symptoms is your dog showing?"
            rows={3}
            {...register('illness_description')}
          />
        )}

        <Controller
          name="prior_vaccine_reaction"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Has your dog ever had a reaction to a vaccine?"
              required
              name="prior_vaccine_reaction"
              options={yesNoUnknown}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        {priorReaction === 'yes' && (
          <>
            <Alert type="warning" title="Flagged for vet review">
              Prior vaccine reactions will be highlighted for your reviewing vet.
            </Alert>
            <Textarea
              label="Describe the reaction"
              placeholder="What type of reaction, when, and which vaccine?"
              rows={3}
              {...register('reaction_description')}
            />
          </>
        )}

        <Controller
          name="known_allergies"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Does your dog have any known allergies?"
              required
              name="known_allergies"
              options={yesNoUnknown}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />
        {hasAllergies === 'yes' && (
          <Textarea label="Describe the allergies" rows={2} {...register('allergy_description')} />
        )}

        <Controller
          name="current_medications"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Does your dog take any current medications?"
              required
              name="current_medications"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />
        {hasMeds === 'yes' && (
          <Textarea label="List current medications" placeholder="Name, dose, frequency" rows={2} {...register('medication_list')} />
        )}

        <Controller
          name="surgeries"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Has your dog had any surgeries or hospitalisations?"
              required
              name="surgeries"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />
        {hasSurgeries === 'yes' && (
          <Textarea label="Brief description" rows={2} {...register('surgery_description')} />
        )}

        <Controller
          name="health_conditions"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Any diagnosed health conditions?"
              required
              name="health_conditions"
              options={yesNo}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />
        {hasConditions === 'yes' && (
          <Textarea label="Describe the conditions" rows={2} {...register('condition_description')} />
        )}

        <Controller
          name="pregnant_or_nursing"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Is your dog pregnant or nursing?"
              required
              name="pregnant_or_nursing"
              options={yesNoUnknown}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <Controller
          name="last_meal"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="When did your dog last eat?"
              required
              name="last_meal"
              options={[
                { value: 'within_2hrs', label: 'Within 2 hours' },
                { value: '2_8hrs', label: '2–8 hours ago' },
                { value: 'over_8hrs', label: 'More than 8 hours ago' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          name="activity_level"
          control={control}
          render={({ field }) => (
            <RadioGroup
              label="Is your dog active and playful today?"
              required
              name="activity_level"
              options={[
                { value: 'yes', label: 'Yes, very' },
                { value: 'normal', label: 'Normal' },
                { value: 'less_usual', label: 'Less than usual' },
                { value: 'no', label: 'No, quite flat' },
              ]}
              value={field.value}
              onChange={field.onChange}
              inline
            />
          )}
        />

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Continue to Lifestyle →
          </Button>
        </div>
      </form>
    </IntakeLayout>
  )
}
