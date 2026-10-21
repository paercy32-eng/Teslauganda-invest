import { PesaJet } from '@pesajet/sdk';

export const pesajet = new PesaJet({
  apiKey: process.env.PESAJET_API_KEY!,
  webhookSecret: process.env.PESAJET_WEBHOOK_SECRET,
  baseUrl: 'https://payments.pesajet.com/api/v1', 
  timeoutMs: 30000,
});
