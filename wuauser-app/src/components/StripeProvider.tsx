import React from 'react';
import { StripeProvider as StripeProviderBase } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
    return null;
  }

  return (
    <StripeProviderBase
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.wuauser.app" // Adjust this to your merchant identifier
    >
      {children}
    </StripeProviderBase>
  );
};