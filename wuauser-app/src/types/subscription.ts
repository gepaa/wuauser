/**
 * WUAUSER - Tipos de Suscripciones
 *
 * Definición de tipos TypeScript para el sistema de suscripciones.
 * Modelo: Veterinarios pagan suscripción mensual (Free o Pro)
 */

// ============================================================================
// PLANES DE SUSCRIPCIÓN
// ============================================================================

export type PlanSlug = 'free' | 'pro';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: PlanSlug;
  description: string | null;
  price_mxn: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  max_appointments_per_month: number | null; // null = ilimitado
  features: string[]; // Array de características del plan
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanInsert {
  name: string;
  slug: PlanSlug;
  description?: string;
  price_mxn: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
  max_appointments_per_month?: number | null;
  features: string[];
  is_active?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}

// ============================================================================
// SUSCRIPCIONES DE VETERINARIOS
// ============================================================================

export type SubscriptionStatus =
  | 'active'      // Suscripción activa y pagada
  | 'past_due'    // Pago fallido, en período de gracia
  | 'canceled'    // Cancelada por el usuario
  | 'unpaid'      // Pago pendiente
  | 'incomplete'; // Suscripción incompleta (fallo en setup)

export interface VetSubscription {
  id: string;
  vet_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VetSubscriptionInsert {
  vet_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
}

export interface VetSubscriptionUpdate {
  plan_id?: string;
  status?: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
}

// ============================================================================
// FACTURAS
// ============================================================================

export type InvoiceStatus =
  | 'draft'         // Borrador
  | 'open'          // Abierta (pendiente de pago)
  | 'paid'          // Pagada
  | 'uncollectible' // Incobrable
  | 'void';         // Anulada

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string | null;
  vet_id: string;
  stripe_invoice_id: string;
  stripe_payment_intent_id: string | null;
  amount_mxn: number;
  currency: string;
  status: InvoiceStatus;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ESTADÍSTICAS MENSUALES
// ============================================================================

export interface VetMonthlyStats {
  id: string;
  vet_id: string;
  year: number;
  month: number; // 1-12
  appointments_count: number;
  appointments_completed: number;
  appointments_cancelled: number;
  created_at: string;
  updated_at: string;
}

export interface VetMonthlyStatsInsert {
  vet_id: string;
  year: number;
  month: number;
  appointments_count?: number;
  appointments_completed?: number;
  appointments_cancelled?: number;
}

// ============================================================================
// TIPOS COMPUESTOS (para respuestas de funciones SQL)
// ============================================================================

/**
 * Resultado de la función get_vet_subscription_info()
 */
export interface VetSubscriptionInfo {
  plan_name: string;
  plan_slug: PlanSlug;
  plan_price: number;
  subscription_status: SubscriptionStatus | 'free';
  current_period_end: string | null;
  appointments_this_month: number;
  appointments_limit: number | null; // null = ilimitado
  can_receive_more: boolean;
}

/**
 * Información completa del plan con suscripción activa
 */
export interface PlanWithSubscription {
  plan: SubscriptionPlan;
  subscription: VetSubscription | null;
  stats: VetMonthlyStats | null;
}

// ============================================================================
// TIPOS PARA STRIPE
// ============================================================================

/**
 * Datos necesarios para crear una suscripción en Stripe
 */
export interface CreateStripeSubscriptionParams {
  vet_id: string;
  plan_id: string;
  payment_method_id?: string; // Token de tarjeta de crédito
  email: string;
  name: string;
}

/**
 * Respuesta de Stripe al crear suscripción
 */
export interface StripeSubscriptionResponse {
  subscription_id: string;
  customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  client_secret?: string; // Para confirmar pago si requiere 3D Secure
}

/**
 * Evento de webhook de Stripe
 */
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// ============================================================================
// TIPOS DE ERROR
// ============================================================================

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code:
      | 'LIMIT_REACHED'
      | 'PLAN_NOT_FOUND'
      | 'SUBSCRIPTION_NOT_FOUND'
      | 'PAYMENT_FAILED'
      | 'STRIPE_ERROR'
      | 'INVALID_PLAN'
      | 'ALREADY_SUBSCRIBED'
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const PLAN_SLUGS = {
  FREE: 'free' as const,
  PRO: 'pro' as const,
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active' as const,
  PAST_DUE: 'past_due' as const,
  CANCELED: 'canceled' as const,
  UNPAID: 'unpaid' as const,
  INCOMPLETE: 'incomplete' as const,
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft' as const,
  OPEN: 'open' as const,
  PAID: 'paid' as const,
  UNCOLLECTIBLE: 'uncollectible' as const,
  VOID: 'void' as const,
} as const;
