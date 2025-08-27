const fs = require('fs');
const path = require('path');

function fixBackHandler(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Fix the specific native-base useKeyboardDismissable issue
  content = content.replace(
    /export function useBackHandler\(\{ enabled, callback \}: IParams\) \{[\s\S]*?\}/g,
    `export function useBackHandler({ enabled, callback }: IParams) {
  useEffect(() => {
    if (!enabled) return;
    
    let backHandler = () => {
      callback();
      return true;
    };
    
    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    
    return () => subscription.remove();
  }, [enabled, callback]);
}`
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Patched: ${filePath}`);
    return true;
  }
  return false;
}

// Fix the specific file
const nativeBaseFile = 'node_modules/native-base/src/hooks/useKeyboardDismissable.ts';
if (fs.existsSync(nativeBaseFile)) {
  fixBackHandler(nativeBaseFile);
}

console.log('✅ NativeBase BackHandler patch completed');