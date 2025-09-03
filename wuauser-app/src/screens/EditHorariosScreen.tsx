import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { vetTheme } from '../constants/vetTheme';

interface EditHorariosScreenProps {
  navigation: any;
}

interface HorarioDia {
  dia: string;
  diaNombre: string;
  activo: boolean;
  turnos: Turno[];
}

interface Turno {
  id: string;
  horaInicio: Date;
  horaFin: Date;
  tipo: 'mañana' | 'tarde' | 'noche';
}

interface ConfiguracionEspecial {
  consultasVirtuales: boolean;
  horariosVirtuales: {
    inicio: Date;
    fin: Date;
  };
  tiempoEntreCitas: number;
  horariosUrgencia: boolean;
  urgencia24h: boolean;
}

export const EditHorariosScreen: React.FC<EditHorariosScreenProps> = ({ navigation }) => {
  const [horarios, setHorarios] = useState<HorarioDia[]>([
    {
      dia: 'lunes',
      diaNombre: 'Lunes',
      activo: true,
      turnos: [
        {
          id: '1',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 13, 0),
          tipo: 'mañana'
        },
        {
          id: '2',
          horaInicio: new Date(2024, 0, 1, 15, 0),
          horaFin: new Date(2024, 0, 1, 19, 0),
          tipo: 'tarde'
        }
      ]
    },
    {
      dia: 'martes',
      diaNombre: 'Martes',
      activo: true,
      turnos: [
        {
          id: '3',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 13, 0),
          tipo: 'mañana'
        },
        {
          id: '4',
          horaInicio: new Date(2024, 0, 1, 15, 0),
          horaFin: new Date(2024, 0, 1, 19, 0),
          tipo: 'tarde'
        }
      ]
    },
    {
      dia: 'miercoles',
      diaNombre: 'Miércoles',
      activo: true,
      turnos: [
        {
          id: '5',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 13, 0),
          tipo: 'mañana'
        },
        {
          id: '6',
          horaInicio: new Date(2024, 0, 1, 15, 0),
          horaFin: new Date(2024, 0, 1, 19, 0),
          tipo: 'tarde'
        }
      ]
    },
    {
      dia: 'jueves',
      diaNombre: 'Jueves',
      activo: true,
      turnos: [
        {
          id: '7',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 13, 0),
          tipo: 'mañana'
        },
        {
          id: '8',
          horaInicio: new Date(2024, 0, 1, 15, 0),
          horaFin: new Date(2024, 0, 1, 19, 0),
          tipo: 'tarde'
        }
      ]
    },
    {
      dia: 'viernes',
      diaNombre: 'Viernes',
      activo: true,
      turnos: [
        {
          id: '9',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 13, 0),
          tipo: 'mañana'
        },
        {
          id: '10',
          horaInicio: new Date(2024, 0, 1, 15, 0),
          horaFin: new Date(2024, 0, 1, 18, 0),
          tipo: 'tarde'
        }
      ]
    },
    {
      dia: 'sabado',
      diaNombre: 'Sábado',
      activo: true,
      turnos: [
        {
          id: '11',
          horaInicio: new Date(2024, 0, 1, 9, 0),
          horaFin: new Date(2024, 0, 1, 14, 0),
          tipo: 'mañana'
        }
      ]
    },
    {
      dia: 'domingo',
      diaNombre: 'Domingo',
      activo: false,
      turnos: []
    }
  ]);

  const [configuracionEspecial, setConfiguracionEspecial] = useState<ConfiguracionEspecial>({
    consultasVirtuales: true,
    horariosVirtuales: {
      inicio: new Date(2024, 0, 1, 8, 0),
      fin: new Date(2024, 0, 1, 20, 0)
    },
    tiempoEntreCitas: 15,
    horariosUrgencia: true,
    urgencia24h: false
  });

  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    dia: string;
    turnoId: string;
    campo: 'inicio' | 'fin';
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const toggleDia = (dia: string) => {
    setHorarios(prev => prev.map(horario => 
      horario.dia === dia 
        ? { ...horario, activo: !horario.activo }
        : horario
    ));
  };

  const agregarTurno = (dia: string) => {
    const nuevoTurno: Turno = {
      id: Date.now().toString(),
      horaInicio: new Date(2024, 0, 1, 9, 0),
      horaFin: new Date(2024, 0, 1, 17, 0),
      tipo: 'tarde'
    };

    setHorarios(prev => prev.map(horario =>
      horario.dia === dia
        ? { ...horario, turnos: [...horario.turnos, nuevoTurno] }
        : horario
    ));
  };

  const eliminarTurno = (dia: string, turnoId: string) => {
    setHorarios(prev => prev.map(horario =>
      horario.dia === dia
        ? { ...horario, turnos: horario.turnos.filter(t => t.id !== turnoId) }
        : horario
    ));
  };

  const actualizarHorario = (dia: string, turnoId: string, campo: 'inicio' | 'fin', hora: Date) => {
    setHorarios(prev => prev.map(horario =>
      horario.dia === dia
        ? {
            ...horario,
            turnos: horario.turnos.map(turno =>
              turno.id === turnoId
                ? { 
                    ...turno, 
                    [campo === 'inicio' ? 'horaInicio' : 'horaFin']: hora 
                  }
                : turno
            )
          }
        : horario
    ));
  };

  const formatearHora = (fecha: Date): string => {
    return fecha.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const validarHorarios = (): boolean => {
    const diasActivos = horarios.filter(h => h.activo);
    
    if (diasActivos.length === 0) {
      Alert.alert('Error', 'Debes tener al menos un día activo');
      return false;
    }

    for (const dia of diasActivos) {
      if (dia.turnos.length === 0) {
        Alert.alert('Error', `${dia.diaNombre} está activo pero no tiene turnos configurados`);
        return false;
      }

      for (const turno of dia.turnos) {
        if (turno.horaInicio >= turno.horaFin) {
          Alert.alert('Error', `En ${dia.diaNombre}, la hora de inicio debe ser anterior a la hora de fin`);
          return false;
        }
      }
    }

    return true;
  };

  const guardarHorarios = async () => {
    if (!validarHorarios()) return;

    setLoading(true);
    try {
      // Aquí iría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Éxito', 'Horarios guardados correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const aplicarHorarioATodos = () => {
    const horarioBase = horarios.find(h => h.activo && h.turnos.length > 0);
    if (!horarioBase) {
      Alert.alert('Error', 'Selecciona un día con horarios configurados primero');
      return;
    }

    Alert.alert(
      'Aplicar a todos los días',
      `¿Aplicar el horario de ${horarioBase.diaNombre} a todos los días activos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            setHorarios(prev => prev.map(horario =>
              horario.activo
                ? { ...horario, turnos: [...horarioBase.turnos] }
                : horario
            ));
          }
        }
      ]
    );
  };

  const renderTurno = (turno: Turno, dia: string) => (
    <View key={turno.id} style={styles.turnoContainer}>
      <TouchableOpacity
        style={styles.horarioBtn}
        onPress={() => setShowTimePicker({ visible: true, dia, turnoId: turno.id, campo: 'inicio' })}
      >
        <Text style={styles.horarioText}>{formatearHora(turno.horaInicio)}</Text>
      </TouchableOpacity>
      
      <Text style={styles.separadorHora}>-</Text>
      
      <TouchableOpacity
        style={styles.horarioBtn}
        onPress={() => setShowTimePicker({ visible: true, dia, turnoId: turno.id, campo: 'fin' })}
      >
        <Text style={styles.horarioText}>{formatearHora(turno.horaFin)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.eliminarTurnoBtn}
        onPress={() => eliminarTurno(dia, turno.id)}
      >
        <Ionicons name="close-circle" size={20} color={vetTheme.colors.status.error} />
      </TouchableOpacity>
    </View>
  );

  const diasLaborables = horarios.filter(h => h.activo).length;
  const totalHoras = horarios
    .filter(h => h.activo)
    .reduce((total, dia) => {
      return total + dia.turnos.reduce((horasDia, turno) => {
        const horas = (turno.horaFin.getTime() - turno.horaInicio.getTime()) / (1000 * 60 * 60);
        return horasDia + horas;
      }, 0);
    }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Horarios y Disponibilidad</Text>
        <TouchableOpacity onPress={aplicarHorarioATodos} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={20} color={vetTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.resumenContainer}>
        <View style={styles.resumenCard}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{diasLaborables}</Text>
            <Text style={styles.resumenLabel}>Días Laborables</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{Math.round(totalHoras)}h</Text>
            <Text style={styles.resumenLabel}>Horas Semanales</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Horarios por Día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horarios por Día</Text>
          <Text style={styles.sectionSubtitle}>Configura tus horarios de atención</Text>
          
          {horarios.map((dia) => (
            <View key={dia.dia} style={styles.diaCard}>
              <View style={styles.diaHeader}>
                <Text style={styles.diaNombre}>{dia.diaNombre}</Text>
                <Switch
                  value={dia.activo}
                  onValueChange={() => toggleDia(dia.dia)}
                  trackColor={{ 
                    false: vetTheme.colors.border.medium, 
                    true: `${vetTheme.colors.primary}50` 
                  }}
                  thumbColor={dia.activo ? vetTheme.colors.primary : vetTheme.colors.text.light}
                />
              </View>
              
              {dia.activo && (
                <View style={styles.turnosContainer}>
                  {dia.turnos.map((turno) => renderTurno(turno, dia.dia))}
                  
                  <TouchableOpacity
                    style={styles.agregarTurnoBtn}
                    onPress={() => agregarTurno(dia.dia)}
                  >
                    <Ionicons name="add" size={16} color={vetTheme.colors.primary} />
                    <Text style={styles.agregarTurnoText}>Agregar Turno</Text>
                  </TouchableOpacity>
                </View>
              )}

              {dia.activo && dia.turnos.length === 0 && (
                <View style={styles.sinTurnosContainer}>
                  <Text style={styles.sinTurnosText}>Sin turnos configurados</Text>
                  <TouchableOpacity
                    style={styles.configurarBtn}
                    onPress={() => agregarTurno(dia.dia)}
                  >
                    <Text style={styles.configurarBtnText}>Configurar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Configuraciones Especiales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuraciones Especiales</Text>
          
          <View style={styles.configItem}>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>Consultas Virtuales</Text>
              <Text style={styles.configDescription}>Ofrecer consultas por videollamada</Text>
            </View>
            <Switch
              value={configuracionEspecial.consultasVirtuales}
              onValueChange={(value) => setConfiguracionEspecial(prev => ({ ...prev, consultasVirtuales: value }))}
              trackColor={{ 
                false: vetTheme.colors.border.medium, 
                true: `${vetTheme.colors.primary}50` 
              }}
              thumbColor={configuracionEspecial.consultasVirtuales ? vetTheme.colors.primary : vetTheme.colors.text.light}
            />
          </View>

          <View style={styles.configItem}>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>Tiempo entre Citas</Text>
              <Text style={styles.configDescription}>Buffer de tiempo entre consultas</Text>
            </View>
            <View style={styles.tiempoSelector}>
              {[5, 10, 15, 20, 30].map((minutos) => (
                <TouchableOpacity
                  key={minutos}
                  style={[
                    styles.tiempoBtn,
                    configuracionEspecial.tiempoEntreCitas === minutos && styles.tiempoBtnActive
                  ]}
                  onPress={() => setConfiguracionEspecial(prev => ({ ...prev, tiempoEntreCitas: minutos }))}
                >
                  <Text style={[
                    styles.tiempoText,
                    configuracionEspecial.tiempoEntreCitas === minutos && styles.tiempoTextActive
                  ]}>
                    {minutos}min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configItem}>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>Horarios de Urgencia</Text>
              <Text style={styles.configDescription}>Atención de emergencias</Text>
            </View>
            <Switch
              value={configuracionEspecial.horariosUrgencia}
              onValueChange={(value) => setConfiguracionEspecial(prev => ({ ...prev, horariosUrgencia: value }))}
              trackColor={{ 
                false: vetTheme.colors.border.medium, 
                true: `${vetTheme.colors.status.error}50` 
              }}
              thumbColor={configuracionEspecial.horariosUrgencia ? vetTheme.colors.status.error : vetTheme.colors.text.light}
            />
          </View>

          {configuracionEspecial.horariosUrgencia && (
            <View style={styles.configItem}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Urgencias 24/7</Text>
                <Text style={styles.configDescription}>Disponible las 24 horas</Text>
              </View>
              <Switch
                value={configuracionEspecial.urgencia24h}
                onValueChange={(value) => setConfiguracionEspecial(prev => ({ ...prev, urgencia24h: value }))}
                trackColor={{ 
                  false: vetTheme.colors.border.medium, 
                  true: `${vetTheme.colors.status.error}50` 
                }}
                thumbColor={configuracionEspecial.urgencia24h ? vetTheme.colors.status.error : vetTheme.colors.text.light}
              />
            </View>
          )}
        </View>

        {/* Botón Guardar */}
        <View style={styles.guardarContainer}>
          <TouchableOpacity 
            style={[styles.guardarButton, loading && styles.guardarButtonDisabled]}
            onPress={guardarHorarios}
            disabled={loading}
          >
            <Text style={styles.guardarButtonText}>
              {loading ? 'Guardando...' : 'Guardar Horarios'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker.campo === 'inicio' 
            ? horarios.find(h => h.dia === showTimePicker.dia)?.turnos.find(t => t.id === showTimePicker.turnoId)?.horaInicio || new Date()
            : horarios.find(h => h.dia === showTimePicker.dia)?.turnos.find(t => t.id === showTimePicker.turnoId)?.horaFin || new Date()
          }
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(null);
            if (selectedTime) {
              actualizarHorario(
                showTimePicker.dia,
                showTimePicker.turnoId,
                showTimePicker.campo,
                selectedTime
              );
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  backButton: {
    padding: vetTheme.spacing.sm,
    marginLeft: -vetTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
  },
  copyButton: {
    padding: vetTheme.spacing.sm,
  },
  resumenContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  resumenCard: {
    flexDirection: 'row',
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.md,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.primary,
  },
  resumenLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: vetTheme.spacing.xs,
  },
  resumenDivider: {
    width: 1,
    backgroundColor: vetTheme.colors.border.light,
    marginHorizontal: vetTheme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.lg,
  },
  diaCard: {
    marginHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    backgroundColor: 'white',
    borderRadius: vetTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  diaNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  turnosContainer: {
    padding: vetTheme.spacing.md,
  },
  turnoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.xs,
  },
  horarioBtn: {
    backgroundColor: vetTheme.colors.surface,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    minWidth: 70,
  },
  horarioText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  separadorHora: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginHorizontal: vetTheme.spacing.sm,
  },
  eliminarTurnoBtn: {
    marginLeft: vetTheme.spacing.md,
    padding: vetTheme.spacing.xs,
  },
  agregarTurnoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: vetTheme.borderRadius.sm,
    paddingVertical: vetTheme.spacing.sm,
    marginTop: vetTheme.spacing.xs,
  },
  agregarTurnoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    marginLeft: vetTheme.spacing.xs,
  },
  sinTurnosContainer: {
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.lg,
  },
  sinTurnosText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.sm,
  },
  configurarBtn: {
    backgroundColor: vetTheme.colors.primary,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.sm,
  },
  configurarBtnText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: 'white',
    fontWeight: vetTheme.typography.weights.medium,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  configInfo: {
    flex: 1,
  },
  configLabel: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  configDescription: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: 2,
  },
  tiempoSelector: {
    flexDirection: 'row',
    gap: vetTheme.spacing.xs,
  },
  tiempoBtn: {
    backgroundColor: vetTheme.colors.surface,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
  },
  tiempoBtnActive: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  tiempoText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
  },
  tiempoTextActive: {
    color: 'white',
  },
  guardarContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
  },
  guardarButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.lg,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
  },
  guardarButtonDisabled: {
    backgroundColor: vetTheme.colors.border.medium,
  },
  guardarButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: 'white',
  },
});

export default EditHorariosScreen;