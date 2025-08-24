import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Alert,
  Spinner,
  useToast,
} from 'native-base';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { paymentService, CreatePaymentParams } from '../services/paymentService';
import { colors } from '../constants/colors';

interface PaymentScreenProps {
  citaId: string;
  vetId: string;
  amount: number;
  vetName: string;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  citaId,
  vetId,
  amount,
  vetName,
  onPaymentSuccess,
  onPaymentCancel,
}) => {
  const { confirmPayment } = useStripe();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');

  const commission = paymentService.calculateCommission(amount);
  const vetAmount = paymentService.calculateVetAmount(amount);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError('');

      const paymentParams: CreatePaymentParams = {
        citaId,
        amount,
        vetId,
      };

      const { clientSecret } = await paymentService.createPayment(paymentParams);
      setClientSecret(clientSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el pago';
      setError(errorMessage);
      console.error('Error creating payment intent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!clientSecret || !cardComplete) {
      toast.show({
        title: 'Error',
        description: 'Por favor completa la información de la tarjeta',
        status: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        setError(`Error en el pago: ${error.message}`);
        toast.show({
          title: 'Error en el pago',
          description: error.message,
          status: 'error',
        });
      } else if (paymentIntent?.status === 'Succeeded') {
        toast.show({
          title: '¡Pago exitoso!',
          description: 'Tu cita ha sido confirmada',
          status: 'success',
        });
        onPaymentSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error procesando el pago';
      setError(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !clientSecret) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color={colors.primary} />
        <Text mt={4}>Preparando el pago...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="white" p={6}>
      <VStack space={6} flex={1}>
        <VStack space={3}>
          <Text fontSize="xl" fontWeight="bold" color={colors.primary}>
            Confirmar Pago
          </Text>
          <Text fontSize="md" color="gray.600">
            Veterinario: {vetName}
          </Text>
        </VStack>

        {/* Payment Summary */}
        <Box bg="gray.50" p={4} borderRadius="md">
          <VStack space={2}>
            <Text fontSize="lg" fontWeight="semibold">
              Resumen del Pago
            </Text>
            <HStack justifyContent="space-between">
              <Text>Consulta:</Text>
              <Text fontWeight="medium">${amount.toFixed(2)} MXN</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color="gray.500">
                Comisión de plataforma:
              </Text>
              <Text fontSize="sm" color="gray.500">
                ${commission.toFixed(2)} MXN
              </Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color="gray.500">
                Al veterinario:
              </Text>
              <Text fontSize="sm" color="gray.500">
                ${vetAmount.toFixed(2)} MXN
              </Text>
            </HStack>
            <Box borderTopWidth={1} borderColor="gray.300" pt={2}>
              <HStack justifyContent="space-between">
                <Text fontSize="lg" fontWeight="bold">
                  Total:
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                  ${amount.toFixed(2)} MXN
                </Text>
              </HStack>
            </Box>
          </VStack>
        </Box>

        {/* Card Input */}
        <VStack space={3}>
          <Text fontSize="md" fontWeight="medium">
            Información de la tarjeta
          </Text>
          <Box 
            borderWidth={1} 
            borderColor="gray.300" 
            borderRadius="md" 
            p={3}
          >
            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
                expiration: 'MM/AA',
                cvc: 'CVC',
                postalCode: 'Código postal',
              }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
              }}
              style={{
                width: '100%',
                height: 50,
              }}
              onCardChange={(details) => {
                setCardComplete(details.complete);
              }}
            />
          </Box>
        </VStack>

        {/* Error Display */}
        {error ? (
          <Alert status="error">
            <Alert.Icon />
            <Text flex={1} color="error.600">
              {error}
            </Text>
          </Alert>
        ) : null}

        {/* Action Buttons */}
        <VStack space={3} mt="auto">
          <Button
            bg={colors.primary}
            _pressed={{ bg: colors.secondary }}
            isLoading={loading}
            isDisabled={!cardComplete || loading}
            onPress={handlePayment}
          >
            <Text color="white" fontWeight="bold">
              Pagar ${amount.toFixed(2)} MXN
            </Text>
          </Button>
          
          <Button
            variant="outline"
            borderColor={colors.primary}
            _text={{ color: colors.primary }}
            onPress={onPaymentCancel}
            isDisabled={loading}
          >
            Cancelar
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};