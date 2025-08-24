import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

interface StripeEvent {
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata: {
        citaId: string;
        vetId: string;
        commission: string;
        vetAmount: string;
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature header', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Verify webhook signature (simplified for demo - use proper Stripe SDK in production)
    // In production, you would use Stripe.webhooks.constructEvent()
    
    const event: StripeEvent = JSON.parse(body);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { citaId, vetId, vetAmount } = paymentIntent.metadata;

        // Update transaction status to completed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
          throw updateError;
        }

        // Update vet balance using the stored function
        const { error: balanceError } = await supabase
          .rpc('update_vet_balance', {
            vet_id_param: vetId,
            amount_param: parseFloat(vetAmount),
          });

        if (balanceError) {
          console.error('Error updating vet balance:', balanceError);
          throw balanceError;
        }

        // Update appointment status to paid
        const { error: citaError } = await supabase
          .from('citas')
          .update({ 
            estado: 'confirmada'
          })
          .eq('id', citaId);

        if (citaError) {
          console.error('Error updating cita:', citaError);
          throw citaError;
        }

        console.log(`Payment completed for cita ${citaId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { citaId } = paymentIntent.metadata;

        // Update transaction status to failed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating failed transaction:', updateError);
          throw updateError;
        }

        console.log(`Payment failed for cita ${citaId}`);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        
        // Update transaction status to failed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating canceled transaction:', updateError);
          throw updateError;
        }

        console.log(`Payment canceled for payment intent ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});