import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;
  private isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV') !== 'production';
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not found. Operating in fallback mock mode.');
    }
  }

  async createPaymentIntent(amountCents: number, currency: string, orderId: string, userEmail: string): Promise<{ clientSecret: string, paymentIntentId: string }> {
    if (this.shouldUseFallback()) {
      this.logger.debug(`Mock createPaymentIntent for order ${orderId}`);
      return { clientSecret: 'mock_client_secret', paymentIntentId: `pi_mock_${Date.now()}` };
    }

    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: amountCents,
        currency,
        metadata: { orderId },
        receipt_email: userEmail,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Stripe error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    if (this.shouldUseFallback()) {
      // In dev, we simply JSON parse if no Stripe configured
      return JSON.parse(payload.toString()) as Stripe.Event;
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
    return this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async issueRefund(paymentIntentId: string): Promise<Stripe.Refund | { id: string, status: string }> {
    if (this.shouldUseFallback()) {
      this.logger.debug(`Mock issueRefund for payment intent ${paymentIntentId}`);
      return { id: `re_mock_${Date.now()}`, status: 'succeeded' };
    }

    try {
      const refund = await this.stripe!.refunds.create({
        payment_intent: paymentIntentId,
      });
      return refund;
    } catch (error) {
      this.logger.error(`Stripe error issuing refund: ${error.message}`);
      throw error;
    }
  }

  private shouldUseFallback(): boolean {
    return !this.stripe;
  }
}
