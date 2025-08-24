import { supabase } from './supabase';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CreatePaymentParams {
  citaId: string;
  amount: number;
  vetId: string;
}

export interface Transaction {
  id: string;
  cita_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  commission: number;
  vet_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface VetBalance {
  vet_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  updated_at: string;
}

class PaymentService {
  private readonly COMMISSION_RATE = 0.15; // 15% commission

  async createPayment({ citaId, amount, vetId }: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      const commission = amount * this.COMMISSION_RATE;
      const vetAmount = amount - commission;

      // Create payment intent via Supabase Edge Function
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to centavos
          currency: 'mxn',
          metadata: {
            citaId,
            vetId,
            commission: commission.toString(),
            vetAmount: vetAmount.toString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Store transaction in Supabase
      const { error } = await supabase
        .from('transactions')
        .insert({
          cita_id: citaId,
          stripe_payment_intent_id: paymentIntentId,
          amount,
          commission,
          vet_amount: vetAmount,
          status: 'pending',
        });

      if (error) {
        console.error('Error storing transaction:', error);
        throw error;
      }

      return {
        clientSecret,
        paymentIntentId,
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getTransactionsByCita(citaId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('cita_id', citaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getVetBalance(vetId: string): Promise<VetBalance | null> {
    try {
      const { data, error } = await supabase
        .from('vet_balances')
        .select('*')
        .eq('vet_id', vetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No balance found, return default
          return {
            vet_id: vetId,
            available_balance: 0,
            pending_balance: 0,
            total_earned: 0,
            updated_at: new Date().toISOString(),
          };
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching vet balance:', error);
      throw error;
    }
  }

  async updateTransactionStatus(paymentIntentId: string, status: Transaction['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  async getTransactionsByVet(vetId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          citas!inner(veterinario_id)
        `)
        .eq('citas.veterinario_id', vetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vet transactions:', error);
      throw error;
    }
  }

  calculateCommission(amount: number): number {
    return amount * this.COMMISSION_RATE;
  }

  calculateVetAmount(amount: number): number {
    return amount * (1 - this.COMMISSION_RATE);
  }
}

export const paymentService = new PaymentService();