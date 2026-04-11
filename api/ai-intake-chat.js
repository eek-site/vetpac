/**
 * POST { messages: [{role, content}] }
 * Proxies conversational intake chat to Anthropic — keeps the API key server-side.
 */
import { handleCors } from './lib/cors.js'

const INTAKE_CHAT_PROMPT = `You are a warm, knowledgeable intake coordinator for VetPac — New Zealand's premium at-home puppy vaccination service. Your job is to have a natural, friendly conversation to gather everything needed to design a personalised vaccination programme.

Guidelines:
- Be warm and conversational — like a knowledgeable friend who knows puppy health well
- Ask 1-2 questions at a time, never overwhelm
- Accept natural language — "she's about 12 weeks" is fine, work it out
- Follow the natural flow of conversation, don't follow a rigid script
- If someone seems worried, be genuinely reassuring
- Keep responses concise — this is a chat, not an essay
- Never reveal you're following a checklist

Information to gather naturally across the conversation:

PUPPY: name, breed, date of birth (or approximate age), sex, desexed status, weight in kg (approximate fine), any previous vaccinations (which, when, certificate available?)

HEALTH: currently unwell?, past vaccine reactions?, known allergies?, on medications?, surgeries or health conditions?, pregnant or nursing?, what did they last eat and when?, activity level

LIFESTYLE: which region of NZ, urban/suburban/rural, visits dog parks or boarding facilities?, near waterways?, other dogs at home?, livestock contact?

OWNER: full name, email address, mobile number, home address (including city, postcode)

When you have gathered all necessary information and are ready to proceed, include this marker at the very end of your final message:

INTAKE_COMPLETE:{"dogProfile":{"name":"","breed":"","dob":"YYYY-MM-DD","sex":"","desexed":"","weight_kg":"","colour":"","microchip_no":"","vaccinated_before":"","last_vaccination_date":"","prior_vaccines":[],"certificate_available":""},"healthHistory":{"currently_ill":"no","illness_description":"","prior_vaccine_reaction":"no","reaction_description":"","known_allergies":"no","allergy_description":"","current_medications":"no","medication_list":"","surgeries":"no","surgery_description":"","health_conditions":"no","condition_description":"","pregnant_or_nursing":"no","last_meal":"","activity_level":"moderate"},"lifestyle":{"living_environment":"","dog_parks_boarding":"no","waterway_access":"no","other_dogs_household":"no","livestock_contact":"no","region":""},"ownerDetails":{"full_name":"","dob":"","email":"","mobile":"","address_line1":"","address_line2":"","city":"","postcode":"","region":"","is_owner":true,"understands_voi":true,"agrees_tos":true,"agrees_privacy":true}}

Fill in all fields with the actual values from the conversation. Only include INTAKE_COMPLETE when you genuinely have enough to proceed. Do not include it in every message.`

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: INTAKE_CHAT_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[ai-intake-chat] Anthropic error:', err)
      return res.status(502).json({ error: 'AI unavailable — please try again' })
    }

    const data = await response.json()
    return res.status(200).json({ text: data.content[0].text })
  } catch (e) {
    console.error('[ai-intake-chat]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
