import Stripe from 'stripe'
import { config } from '../config.js'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    throw new Error('Stripe is not configured — set STRIPE_SECRET_KEY')
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(config.stripeSecretKey)
  }
  return stripeInstance
}
