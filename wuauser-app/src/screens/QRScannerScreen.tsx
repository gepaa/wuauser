import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface QRScannerScreenProps {
  navigation: any;
  route?: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    console.log('QRScanner: Permission status:', permission);
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // Check if it's a valid pet QR code
    if (data.startsWith('WUAUSER_PET_')) {
      Alert.alert(
        '¡Mascota Encontrada!',
        `Has escaneado el código QR de una mascota registrada en Wuauser. 
        
Código: ${data}

¿Qué quieres hacer?`,
        [
          {
            text: 'Ver Información',
            onPress: () => {
              // TODO: Navigate to pet info screen with pet ID
              console.log('Ver información de mascota:', data);
              navigation.goBack();
            },
          },
          {
            text: 'Reportar como Encontrada',
            onPress: () => {
              // TODO: Navigate to report found pet screen
              console.log('Reportar mascota encontrada:', data);
              navigation.goBack();
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
        ]
      );
    } else {
      Alert.alert(
        'Código QR No Válido',
        'Este código QR no corresponde a una mascota registrada en Wuauser.',
        [
          {
            text: 'Intentar de Nuevo',
            onPress: () => setScanned(false),
          },
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  console.log('QRScanner: Rendering with permission:', permission);
  console.log('QRScanner: Camera ready:', cameraReady);

  if (!permission) {
    console.log('QRScanner: No permission object available');
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Solicitando permisos de cámara...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.permissionTitle}>Permisos de Cámara Necesarios</Text>
          <Text style={styles.permissionText}>
            Para escanear códigos QR de mascotas, necesitamos acceso a tu cámara.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  console.log('QRScanner: About to render camera with granted permission');

  return (
    <View style={styles.container}>
      {/* Simple camera test - minimal overlays */}
      <CameraView
        style={styles.camera}
        facing="back"
        flash={flashEnabled ? 'on' : 'off'}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        onCameraReady={() => {
          console.log('QRScanner: Camera ready callback fired');
          setCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('QRScanner: Camera mount error:', error);
        }}
      />
      
      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR</Text>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Ionicons 
            name={flashEnabled ? "flash" : "flash-off"} 
            size={24} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Simple scan frame */}
      <View style={styles.scanFrameOverlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Bottom instructions */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.instructionText}>
          Apunta hacia el código QR de la mascota
        </Text>
        {!cameraReady && (
          <Text style={styles.loadingText}>Iniciando cámara...</Text>
        )}
        {scanned && (
          <TouchableOpacity 
            style={styles.rescanButton} 
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Escanear de Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FFF8E7',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  scanFrameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: 'center',
    zIndex: 1,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#F4B740',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  rescanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default QRScannerScreen;