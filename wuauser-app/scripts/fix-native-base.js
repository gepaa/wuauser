const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/native-base/src/hooks/useKeyboardDismissable.ts');

console.log('🔧 Checking NativeBase useKeyboardDismissable.ts...');

if (fs.existsSync(filePath)) {
  console.log('📝 Recreating NativeBase useKeyboardDismissable.ts with correct syntax...');
  
  // Contenido corregido completo
  const fixedContent = `import React from 'react';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

type IParams = {
  enabled?: boolean;
  callback: () => any;
};

let keyboardDismissHandlers: Array<() => any> = [];
export const keyboardDismissHandlerManager = {
  push: (handler: () => any) => {
    keyboardDismissHandlers.push(handler);
    return () => {
      keyboardDismissHandlers = keyboardDismissHandlers.filter(
        (h) => h !== handler
      );
    };
  },
  length: () => keyboardDismissHandlers.length,
  pop: () => {
    return keyboardDismissHandlers.pop();
  },
};

/**
 * Handles attaching callback for Escape key listener on web and Back button listener on Android
 */
export const useKeyboardDismissable = ({ enabled, callback }: IParams) => {
  React.useEffect(() => {
    let cleanupFn = () => {};
    if (enabled) {
      cleanupFn = keyboardDismissHandlerManager.push(callback);
    } else {
      cleanupFn();
    }
    return () => {
      cleanupFn();
    };
  }, [enabled, callback]);

  useBackHandler({ enabled, callback });
};

export function useBackHandler({ enabled, callback }: IParams) {
  useEffect(() => {
    if (!enabled) return;
    
    const backHandler = () => {
      callback();
      return true;
    };
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    
    return () => subscription.remove();
  }, [enabled, callback]);
}
`;
  
  fs.writeFileSync(filePath, fixedContent);
  console.log('✅ NativeBase useKeyboardDismissable.ts completely fixed!');
} else {
  console.log('⚠️  NativeBase useKeyboardDismissable.ts not found');
}