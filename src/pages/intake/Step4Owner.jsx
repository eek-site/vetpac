import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User } from 'lucide-react'
import Input from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import Checkbox from '../../components/ui/Checkbox'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import IntakeLayout from '../../components/layout/IntakeLayout'
import { useIntakeStore } from '../../store/intakeStore'
import { NZ_REGIONS } from '../../lib/constants'

const schema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  dob: z.string().min(1, 'Date of birth required'),
  email: z.string().email('Valid email required'),
  mobile: z.string().min(8, 'Valid NZ mobile required'),
  address_line1: z.string().min(5, 'Address required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City required'),
  postcode: z.string().regex(/^\d{4}$/, 'NZ postcode is 4 digits'),
  region: z.string().min(1, 'Region required'),
  is_owner: z.boolean().refine((v) => v === true, 'You must confirm you are the owner'),
  understands_voi: z.boolean().refine((v) => v === true, 'You must confirm you understand the VOI'),
  agrees_tos: z.boolean().refine((v) => v === true, 'You must agree to the Terms of Service'),
  agrees_privacy: z.boolean().refine((v) => v === true, 'You must agree to the Privacy Policy'),
})

export default function Step4Owner() {
  const navigate = useNavigate()
  const { ownerDetails, updateOwnerDetails } = useIntakeStore()

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: ownerDetails,
  })

  const onSubmit = (data) => {
    updateOwnerDetails(data)
    navigate('/intake/video')
  }

  return (
    <IntakeLayout>
      <div className="mb-8">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-accent-dark" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-textPrimary mb-2">Your details</h1>
        <p className="text-textSecondary">Required for your Veterinary Operating Instruction and delivery.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Full legal name"
          required
          placeholder="As it appears on your ID"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Date of birth"
          required
          type="date"
          error={errors.dob?.message}
          helper="Required for your Veterinary Operating Instruction"
          {...register('dob')}
        />

        <Input
          label="Email address"
          required
          type="email"
          placeholder="hello@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile number"
          required
          type="tel"
          placeholder="+64 21 000 0000"
          error={errors.mobile?.message}
          helper="We'll send your order updates by SMS"
          {...register('mobile')}
        />

        <div className="border-t border-border pt-5">
          <h3 className="font-semibold text-textPrimary mb-4">Delivery address</h3>
          <div className="space-y-4">
            <Input
              label="Address line 1"
              required
              placeholder="Street number and name"
              error={errors.address_line1?.message}
              {...register('address_line1')}
            />
            <Input
              label="Address line 2"
              placeholder="Apartment, unit, etc. (optional)"
              {...register('address_line2')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Suburb / City"
                required
                placeholder="e.g. Ponsonby"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="Postcode"
                required
                placeholder="e.g. 1011"
                maxLength={4}
                error={errors.postcode?.message}
                {...register('postcode')}
              />
            </div>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  label="Region"
                  required
                  options={NZ_REGIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.region?.message}
                  placeholder="Select region..."
                />
              )}
            />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <Alert type="info" title="VOI Consent & Authorisation">
            A NZ-registered vet will issue a Veterinary Operating Instruction (VOI) naming you as the authorised person to purchase and administer the vaccines to your dog. This is the legal basis for VetPac's model under the ACVM Act 1997.
          </Alert>
          <div className="mt-5 space-y-4">
            <Controller
              name="is_owner"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={errors.is_owner?.message}
                  required
                  label="I confirm that I am the owner or responsible person for this dog and have the right to authorise veterinary care."
                />
              )}
            />
            <Controller
              name="understands_voi"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={errors.understands_voi?.message}
                  required
                  label="I understand that I am being authorised to administer vaccines to my dog under a vet-issued Veterinary Operating Instruction, and I accept responsibility for following the administration guide provided."
                />
              )}
            />
            <Controller
              name="agrees_tos"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={errors.agrees_tos?.message}
                  required
                  label={<span>I have read and agree to VetPac's <a href="/terms" target="_blank" className="text-primary underline">Terms of Service</a></span>}
                />
              )}
            />
            <Controller
              name="agrees_privacy"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  error={errors.agrees_privacy?.message}
                  required
                  label={<span>I have read and agree to VetPac's <a href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</a></span>}
                />
              )}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">
            Continue to Video Upload →
          </Button>
        </div>
      </form>
    </IntakeLayout>
  )
}
