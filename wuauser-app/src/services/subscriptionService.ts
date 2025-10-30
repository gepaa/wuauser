/**
 * WUAUSER - Subscription Service
 *
 * Servicio para gestionar suscripciones de veterinarios.
 * Modelo: Free ($0, 5 citas/mes) y Pro ($600 MXN, ilimitado)
 */

import { supabase } from './supabase';
import type {
  SubscriptionPlan,
  VetSubscription,
  VetSubscriptionInsert,
  VetSubscriptionUpdate,
  VetSubscriptionInfo,
  VetMonthlyStats,
  SubscriptionInvoice,
  PlanSlug,
  SubscriptionError,
  CreateStripeSubscriptionParams,
  StripeSubscriptionResponse,
} from '../types/subscription';

// ============================================================================
// GESTIÓN DE PLANES
// ============================================================================

/**
 * Obtener todos los planes disponibles
 */
export const getAvailablePlans = async (): Promise<{
  data: SubscriptionPlan[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error obteniendo planes:', error);
    return { data: null, error };
  }
};

/**
 * Obtener un plan específico por slug
 */
export const getPlanBySlug = async (
  slug: PlanSlug
): Promise<{
  data: SubscriptionPlan | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`[subscriptionService] Error obteniendo plan ${slug}:`, error);
    return { data: null, error };
  }
};

/**
 * Obtener plan por ID
 */
export const getPlanById = async (
  planId: string
): Promise<{
  data: SubscriptionPlan | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`[subscriptionService] Error obteniendo plan ID ${planId}:`, error);
    return { data: null, error };
  }
};

// ============================================================================
// GESTIÓN DE SUSCRIPCIONES
// ============================================================================

/**
 * Obtener suscripción actual de un veterinario
 */
export const getCurrentSubscription = async (
  vetId: string
): Promise<{
  data: VetSubscription | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('vet_subscriptions')
      .select('*')
      .eq('vet_id', vetId)
      .single();

    // Si no tiene suscripción, no es error (será plan Free por defecto)
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`[subscriptionService] Error obteniendo suscripción de vet ${vetId}:`, error);
    return { data: null, error };
  }
};

/**
 * Obtener información completa de suscripción usando función SQL
 */
export const getSubscriptionInfo = async (
  vetId: string
): Promise<{
  data: VetSubscriptionInfo | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('get_vet_subscription_info', {
        vet_id_param: vetId,
      })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`[subscriptionService] Error obteniendo info de suscripción:`, error);
    return { data: null, error };
  }
};

/**
 * Crear suscripción local (después de crear en Stripe)
 */
export const createSubscription = async (
  subscriptionData: VetSubscriptionInsert
): Promise<{
  data: VetSubscription | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('vet_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;

    // Actualizar tabla veterinarios con el plan actual
    await supabase
      .from('veterinarios')
      .update({
        current_plan_id: subscriptionData.plan_id,
        subscription_status: subscriptionData.status || 'active',
        can_receive_appointments: true,
      })
      .eq('id', subscriptionData.vet_id);

    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error creando suscripción:', error);
    return { data: null, error };
  }
};

/**
 * Actualizar suscripción existente
 */
export const updateSubscription = async (
  vetId: string,
  updates: VetSubscriptionUpdate
): Promise<{
  data: VetSubscription | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('vet_subscriptions')
      .update(updates)
      .eq('vet_id', vetId)
      .select()
      .single();

    if (error) throw error;

    // Actualizar tabla veterinarios si cambió el plan o estado
    if (updates.plan_id || updates.status) {
      await supabase
        .from('veterinarios')
        .update({
          ...(updates.plan_id && { current_plan_id: updates.plan_id }),
          ...(updates.status && { subscription_status: updates.status }),
        })
        .eq('id', vetId);
    }

    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error actualizando suscripción:', error);
    return { data: null, error };
  }
};

/**
 * Cancelar suscripción (marca para cancelar al final del período)
 */
export const cancelSubscription = async (
  vetId: string
): Promise<{
  data: VetSubscription | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('vet_subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      })
      .eq('vet_id', vetId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error cancelando suscripción:', error);
    return { data: null, error };
  }
};

// ============================================================================
// VALIDACIÓN DE LÍMITES
// ============================================================================

/**
 * Verificar si un veterinario puede recibir más citas este mes
 */
export const checkAppointmentLimit = async (
  vetId: string
): Promise<{
  canReceive: boolean;
  currentCount: number;
  limit: number | null;
  error: any;
}> => {
  try {
    // Llamar función SQL que hace toda la lógica
    const { data, error } = await supabase.rpc('check_vet_appointment_limit', {
      vet_id_param: vetId,
    });

    if (error) throw error;

    // Obtener info adicional para el usuario
    const { data: info } = await getSubscriptionInfo(vetId);

    return {
      canReceive: data === true,
      currentCount: info?.appointments_this_month || 0,
      limit: info?.appointments_limit || null,
      error: null,
    };
  } catch (error) {
    console.error('[subscriptionService] Error verificando límite:', error);
    return {
      canReceive: false,
      currentCount: 0,
      limit: null,
      error,
    };
  }
};

/**
 * Incrementar contador de citas mensuales
 */
export const incrementMonthlyAppointments = async (
  vetId: string
): Promise<{
  success: boolean;
  error: any;
}> => {
  try {
    const { error } = await supabase.rpc('increment_vet_monthly_appointments', {
      vet_id_param: vetId,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error incrementando contador:', error);
    return { success: false, error };
  }
};

/**
 * Obtener estadísticas del mes actual
 */
export const getMonthlyStats = async (
  vetId: string
): Promise<{
  data: VetMonthlyStats | null;
  error: any;
}> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    const { data, error } = await supabase
      .from('vet_monthly_stats')
      .select('*')
      .eq('vet_id', vetId)
      .eq('year', year)
      .eq('month', month)
      .single();

    // Si no existe registro, retornar null (no es error)
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error obteniendo stats mensuales:', error);
    return { data: null, error };
  }
};

// ============================================================================
// FACTURAS
// ============================================================================

/**
 * Obtener historial de facturas de un veterinario
 */
export const getInvoices = async (
  vetId: string,
  limit: number = 10
): Promise<{
  data: SubscriptionInvoice[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('vet_id', vetId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error obteniendo facturas:', error);
    return { data: null, error };
  }
};

/**
 * Obtener factura por ID de Stripe
 */
export const getInvoiceByStripeId = async (
  stripeInvoiceId: string
): Promise<{
  data: SubscriptionInvoice | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('stripe_invoice_id', stripeInvoiceId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[subscriptionService] Error obteniendo factura:', error);
    return { data: null, error };
  }
};

// ============================================================================
// UPGRADE/DOWNGRADE
// ============================================================================

/**
 * Cambiar de plan Free a Pro
 */
export const upgradeToProPlan = async (
  vetId: string,
  paymentMethodId: string
): Promise<{
  success: boolean;
  subscription: VetSubscription | null;
  error: any;
}> => {
  try {
    // 1. Obtener plan Pro
    const { data: proPlan, error: planError } = await getPlanBySlug('pro');
    if (planError || !proPlan) {
      throw new Error('Plan Pro no encontrado');
    }

    // 2. Verificar si ya tiene suscripción activa
    const { data: currentSub } = await getCurrentSubscription(vetId);
    if (currentSub && currentSub.status === 'active') {
      throw new Error('Ya tiene una suscripción activa');
    }

    // 3. Aquí iría la llamada a Stripe para crear la suscripción
    // TODO: Implementar integración con Stripe en FASE 3 parte 2
    // Por ahora creamos la suscripción local

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const subscriptionData: VetSubscriptionInsert = {
      vet_id: vetId,
      plan_id: proPlan.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      // stripe_subscription_id y stripe_customer_id se agregarán después de llamar a Stripe
    };

    const { data, error } = await createSubscription(subscriptionData);

    if (error) throw error;

    return {
      success: true,
      subscription: data,
      error: null,
    };
  } catch (error) {
    console.error('[subscriptionService] Error upgradeando a Pro:', error);
    return {
      success: false,
      subscription: null,
      error,
    };
  }
};

/**
 * Cambiar de plan Pro a Free (downgrade)
 */
export const downgradeToFreePlan = async (
  vetId: string
): Promise<{
  success: boolean;
  error: any;
}> => {
  try {
    // 1. Obtener plan Free
    const { data: freePlan, error: planError } = await getPlanBySlug('free');
    if (planError || !freePlan) {
      throw new Error('Plan Free no encontrado');
    }

    // 2. Cancelar suscripción actual
    await cancelSubscription(vetId);

    // 3. Actualizar a plan Free al final del período
    // En producción, esto lo haría el webhook de Stripe
    const { data, error } = await updateSubscription(vetId, {
      plan_id: freePlan.id,
      status: 'canceled',
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('[subscriptionService] Error downgradeando a Free:', error);
    return {
      success: false,
      error,
    };
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verificar si un veterinario tiene plan Pro activo
 */
export const hasProPlan = async (vetId: string): Promise<boolean> => {
  try {
    const { data: info } = await getSubscriptionInfo(vetId);
    return info?.plan_slug === 'pro' && info?.subscription_status === 'active';
  } catch (error) {
    console.error('[subscriptionService] Error verificando plan Pro:', error);
    return false;
  }
};

/**
 * Verificar si un veterinario está cerca del límite de citas
 * (para mostrar alertas en UI)
 */
export const isNearLimit = async (
  vetId: string,
  threshold: number = 0.8 // 80%
): Promise<boolean> => {
  try {
    const { data: info } = await getSubscriptionInfo(vetId);

    if (!info) return false;
    if (info.appointments_limit === null) return false; // Ilimitado

    const usagePercent = info.appointments_this_month / info.appointments_limit;
    return usagePercent >= threshold;
  } catch (error) {
    console.error('[subscriptionService] Error verificando límite:', error);
    return false;
  }
};

/**
 * Obtener mensaje de estado de suscripción para mostrar en UI
 */
export const getSubscriptionStatusMessage = (
  info: VetSubscriptionInfo
): string => {
  const { plan_slug, subscription_status, appointments_this_month, appointments_limit } = info;

  if (plan_slug === 'free') {
    const remaining = (appointments_limit || 0) - appointments_this_month;
    if (remaining <= 0) {
      return 'Has alcanzado el límite de citas este mes. Mejora a Plan Pro para recibir más clientes.';
    }
    if (remaining <= 2) {
      return `Solo te quedan ${remaining} citas este mes. Considera mejorar a Plan Pro.`;
    }
    return `Plan Gratuito: ${appointments_this_month}/${appointments_limit} citas usadas este mes`;
  }

  if (plan_slug === 'pro') {
    if (subscription_status === 'past_due') {
      return 'Tu pago está vencido. Por favor actualiza tu método de pago.';
    }
    if (subscription_status === 'canceled') {
      return 'Tu suscripción ha sido cancelada y terminará pronto.';
    }
    return `Plan Profesional: Citas ilimitadas`;
  }

  return 'Estado de suscripción desconocido';
};

// Exportar todo como objeto para fácil importación
export const subscriptionService = {
  // Planes
  getAvailablePlans,
  getPlanBySlug,
  getPlanById,

  // Suscripciones
  getCurrentSubscription,
  getSubscriptionInfo,
  createSubscription,
  updateSubscription,
  cancelSubscription,

  // Límites
  checkAppointmentLimit,
  incrementMonthlyAppointments,
  getMonthlyStats,

  // Facturas
  getInvoices,
  getInvoiceByStripeId,

  // Upgrade/Downgrade
  upgradeToProPlan,
  downgradeToFreePlan,

  // Helpers
  hasProPlan,
  isNearLimit,
  getSubscriptionStatusMessage,
};

export default subscriptionService;
