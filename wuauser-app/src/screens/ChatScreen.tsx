import React, { useState, useRef, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Avatar,
  IconButton,
  Input,
  KeyboardAvoidingView,
  Pressable,
  Badge,
  ScrollView,
  Spinner,
  Icon,
  useToast,
  Button
} from 'native-base';
import { SafeAreaView, Alert, Dimensions, ListRenderItem, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { vetTheme } from '../constants/vetTheme';

type ChatScreenParams = {
  Chat: {
    conversacionId: string;
    duenoNombre: string;
    mascotaNombre: string;
    duenoId: string;
    mascotaId: string;
  };
};

type ChatScreenRouteProp = RouteProp<ChatScreenParams, 'Chat'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<ChatScreenParams>;

interface Mensaje {
  id: string;
  texto: string;
  timestamp: string;
  remitente: 'vet' | 'owner';
  leido: boolean;
  tipo: 'texto' | 'imagen' | 'documento';
  archivoUrl?: string;
}

interface RespuestaRapida {
  id: string;
  texto: string;
  categoria: 'citas' | 'diagnosticos' | 'medicamentos' | 'seguimiento';
}

const RESPUESTAS_RAPIDAS: RespuestaRapida[] = [
  { id: '1', texto: 'Gracias por la información. Revisaré el caso.', categoria: 'seguimiento' },
  { id: '2', texto: 'Necesito programar una cita de seguimiento.', categoria: 'citas' },
  { id: '3', texto: 'Los síntomas que describes son normales después del tratamiento.', categoria: 'diagnosticos' },
  { id: '4', texto: 'Por favor, continúa con la medicación como se indicó.', categoria: 'medicamentos' },
  { id: '5', texto: 'Si los síntomas persisten, contacta de inmediato.', categoria: 'seguimiento' },
  { id: '6', texto: 'Vamos a ajustar el plan de tratamiento.', categoria: 'diagnosticos' },
];

const MOCK_MENSAJES: Mensaje[] = [
  {
    id: '1',
    texto: 'Hola Doctor, Luna ha estado muy decaída desde ayer.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    remitente: 'owner',
    leido: true,
    tipo: 'texto'
  },
  {
    id: '2',
    texto: 'Hola María, gracias por contactarme. ¿Luna ha estado comiendo normalmente?',
    timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
    remitente: 'vet',
    leido: true,
    tipo: 'texto'
  },
  {
    id: '3',
    texto: 'Sí, está comiendo pero menos cantidad de lo normal. También está durmiendo más.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    remitente: 'owner',
    leido: true,
    tipo: 'texto'
  },
  {
    id: '4',
    texto: 'Esto puede ser una reacción normal a la vacuna que recibió ayer. Mantengámosla en observación.',
    timestamp: new Date(Date.now() - 1.3 * 60 * 60 * 1000).toISOString(),
    remitente: 'vet',
    leido: true,
    tipo: 'texto'
  },
  {
    id: '5',
    texto: '¿Qué síntomas debo vigilar que sean preocupantes?',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    remitente: 'owner',
    leido: true,
    tipo: 'texto'
  },
  {
    id: '6',
    texto: 'Vigila si tiene vómitos, diarrea, dificultad para respirar o si no mejora en 24 horas. En ese caso, tráela de inmediato.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    remitente: 'vet',
    leido: false,
    tipo: 'texto'
  }
];

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const toast = useToast();
  const flatListRef = useRef<any>(null);

  const { conversacionId, duenoNombre, mascotaNombre, duenoId, mascotaId, chatId, otherUser } = route.params as any;
  
  const [mensajes, setMensajes] = useState<Mensaje[]>(MOCK_MENSAJES);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mostrarRespuestas, setMostrarRespuestas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);

  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [mensajes]);

  const formatearTiempo = (timestamp: string) => {
    const fecha = new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));

    if (diffMinutos < 1) return 'Ahora';
    if (diffMinutos < 60) return `${diffMinutos}m`;
    if (diffMinutos < 1440) return `${Math.floor(diffMinutos / 60)}h`;
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  };

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    const nuevoMensajeObj: Mensaje = {
      id: Date.now().toString(),
      texto: texto.trim(),
      timestamp: new Date().toISOString(),
      remitente: 'vet',
      leido: false,
      tipo: 'texto'
    };

    try {
      setMensajes(prev => [...prev, nuevoMensajeObj]);
      setNuevoMensaje('');
      setMostrarRespuestas(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      toast.show({
        description: 'Mensaje enviado',
        duration: 2000
      });
    } catch (error) {
      toast.show({
        description: 'Error al enviar mensaje',
        duration: 3000
      });
    } finally {
      setEnviando(false);
    }
  };

  const seleccionarRespuestaRapida = (respuesta: RespuestaRapida) => {
    enviarMensaje(respuesta.texto);
  };

  const renderMensaje: ListRenderItem<Mensaje> = ({ item }) => {
    const esMio = item.remitente === 'vet';
    
    return (
      <Box
        mb={3}
        alignSelf={esMio ? 'flex-end' : 'flex-start'}
        maxW="85%"
      >
        <Box
          bg={esMio ? vetTheme.colors.primary : vetTheme.colors.surface}
          px={4}
          py={3}
          borderRadius={16}
          borderBottomRightRadius={esMio ? 4 : 16}
          borderBottomLeftRadius={esMio ? 16 : 4}
        >
          <Text
            color={esMio ? 'white' : vetTheme.colors.text.primary}
            fontSize="sm"
            lineHeight="sm"
          >
            {item.texto}
          </Text>
        </Box>
        <HStack
          justifyContent={esMio ? 'flex-end' : 'flex-start'}
          alignItems="center"
          mt={1}
          px={2}
        >
          <Text fontSize="xs" color={vetTheme.colors.text.secondary}>
            {formatearTiempo(item.timestamp)}
          </Text>
          {esMio && (
            <Icon
              as={Ionicons}
              name={item.leido ? 'checkmark-done' : 'checkmark'}
              size={3}
              color={item.leido ? vetTheme.colors.primary : vetTheme.colors.text.light}
              ml={1}
            />
          )}
        </HStack>
      </Box>
    );
  };

  const renderRespuestaRapida = ({ item }: { item: RespuestaRapida }) => (
    <Pressable onPress={() => seleccionarRespuestaRapida(item)}>
      <Box
        bg={vetTheme.colors.surface}
        borderWidth={1}
        borderColor={vetTheme.colors.border.light}
        borderRadius={8}
        px={3}
        py={2}
        mr={2}
        mb={2}
      >
        <Text fontSize="sm" color={vetTheme.colors.text.primary}>
          {item.texto}
        </Text>
      </Box>
    </Pressable>
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <HStack
          bg="white"
          px={4}
          py={3}
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor={vetTheme.colors.border.light}
          safeAreaTop
        >
          <IconButton
            icon={<Icon as={Ionicons} name="arrow-back" size={5} color={vetTheme.colors.text.secondary} />}
            onPress={() => navigation.goBack()}
            mr={2}
          />
          
          <Avatar
            size="sm"
            bg={vetTheme.colors.primary}
            mr={3}
          >
            <Text color="white" fontSize="xs" fontWeight="bold">
              {(otherUser?.name || duenoNombre || 'U').charAt(0).toUpperCase()}
              {(mascotaNombre || '').charAt(0)?.toUpperCase() || ''}
            </Text>
          </Avatar>

          <VStack flex={1}>
            <Text fontSize="md" fontWeight="semibold" color={vetTheme.colors.text.primary}>
              {otherUser?.name || duenoNombre || 'Usuario'}
            </Text>
            <Text fontSize="sm" color={vetTheme.colors.text.secondary}>
              {mascotaNombre || (otherUser?.type === 'veterinario' ? 'Veterinario' : 'Chat')}
            </Text>
          </VStack>

          <HStack space={2}>
            <IconButton
              icon={<Icon as={Ionicons} name="call" size={5} color={vetTheme.colors.text.secondary} />}
              onPress={() => Alert.alert('Llamar', `¿Deseas llamar a ${duenoNombre}?`)}
            />
            <IconButton
              icon={<Icon as={Ionicons} name="videocam" size={5} color={vetTheme.colors.text.secondary} />}
              onPress={() => Alert.alert('Videollamada', 'Función disponible próximamente')}
            />
          </HStack>
        </HStack>

        {/* Messages */}
        <VStack flex={1} bg={vetTheme.colors.surface}>
          {cargando ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="lg" color={vetTheme.colors.primary} />
              <Text mt={2} color={vetTheme.colors.text.secondary}>
                Cargando conversación...
              </Text>
            </Box>
          ) : (
            <FlatList
              ref={flatListRef}
              data={mensajes}
              keyExtractor={(item) => item.id}
              renderItem={renderMensaje}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          )}

          {/* Quick Replies */}
          {mostrarRespuestas && (
            <Box
              bg="white"
              borderTopWidth={1}
              borderTopColor={vetTheme.colors.border.light}
              px={4}
              py={3}
            >
              <HStack justifyContent="space-between" alignItems="center" mb={3}>
                <Text fontSize="sm" fontWeight="medium" color={vetTheme.colors.text.primary}>
                  Respuestas rápidas
                </Text>
                <IconButton
                  icon={<Icon as={Ionicons} name="close" size={4} />}
                  size="sm"
                  onPress={() => setMostrarRespuestas(false)}
                />
              </HStack>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <HStack space={2} flexWrap="wrap">
                  {RESPUESTAS_RAPIDAS.map((respuesta) => (
                    <Box key={respuesta.id}>
                      {renderRespuestaRapida({ item: respuesta })}
                    </Box>
                  ))}
                </HStack>
              </ScrollView>
            </Box>
          )}

          {/* Input Area */}
          <HStack
            bg="white"
            px={4}
            py={3}
            alignItems="flex-end"
            borderTopWidth={1}
            borderTopColor={vetTheme.colors.border.light}
          >
            <IconButton
              icon={<Icon as={Ionicons} name="add" size={5} color={vetTheme.colors.text.secondary} />}
              onPress={() => Alert.alert('Adjuntar', 'Selecciona una opción', [
                { text: 'Cámara', onPress: () => {} },
                { text: 'Galería', onPress: () => {} },
                { text: 'Documento', onPress: () => {} },
                { text: 'Cancelar', style: 'cancel' }
              ])}
              mr={2}
            />
            
            <Input
              flex={1}
              placeholder="Escribe un mensaje..."
              value={nuevoMensaje}
              onChangeText={setNuevoMensaje}
              borderRadius={20}
              borderWidth={1}
              borderColor={vetTheme.colors.border.medium}
              bg="white"
              px={4}
              py={2}
              fontSize="sm"
              multiline
              maxHeight={100}
              mr={2}
            />
            
            <IconButton
              icon={<Icon as={Ionicons} name="chatbubble-ellipses" size={5} color={vetTheme.colors.primary} />}
              onPress={() => setMostrarRespuestas(!mostrarRespuestas)}
              mr={1}
            />

            {nuevoMensaje.trim() ? (
              <IconButton
                icon={
                  enviando ? (
                    <Spinner size="sm" color={vetTheme.colors.primary} />
                  ) : (
                    <Icon as={Ionicons} name="send" size={5} color={vetTheme.colors.primary} />
                  )
                }
                onPress={() => enviarMensaje(nuevoMensaje)}
                disabled={enviando}
              />
            ) : (
              <IconButton
                icon={<Icon as={Ionicons} name="mic" size={5} color={vetTheme.colors.text.secondary} />}
                onPress={() => Alert.alert('Mensaje de voz', 'Función disponible próximamente')}
              />
            )}
          </HStack>
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

