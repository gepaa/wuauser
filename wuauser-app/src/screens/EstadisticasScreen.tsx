import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../constants/vetTheme';

interface EstadisticasScreenProps {
  navigation: any;
}

interface MetricaCard {
  titulo: string;
  valor: string;
  cambio: string;
  tendencia: 'up' | 'down' | 'stable';
  icono: string;
  color: string;
}

interface TratamientoTop {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface PacienteFrecuente {
  nombre: string;
  mascota: string;
  visitas: number;
  ultimaVisita: string;
}

const screenWidth = Dimensions.get('window').width;

export const EstadisticasScreen: React.FC<EstadisticasScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [periodoActual, setPeriodoActual] = useState('mes');

  const metricas: MetricaCard[] = [
    {
      titulo: 'Ingresos Total',
      valor: '$28,500',
      cambio: '+12.5%',
      tendencia: 'up',
      icono: 'cash',
      color: vetTheme.colors.status.success
    },
    {
      titulo: 'Pacientes Nuevos',
      valor: '23',
      cambio: '+8.3%',
      tendencia: 'up',
      icono: 'paw',
      color: vetTheme.colors.primary
    },
    {
      titulo: 'Citas Completadas',
      valor: '45',
      cambio: '-2.1%',
      tendencia: 'down',
      icono: 'checkmark-circle',
      color: vetTheme.colors.secondary
    },
    {
      titulo: 'Calificación Promedio',
      valor: '4.8',
      cambio: '+0.2',
      tendencia: 'up',
      icono: 'star',
      color: vetTheme.colors.accent
    }
  ];

  const tratamientosTop: TratamientoTop[] = [
    { nombre: 'Consulta General', cantidad: 18, porcentaje: 40 },
    { nombre: 'Vacunación', cantidad: 12, porcentaje: 27 },
    { nombre: 'Desparasitación', cantidad: 8, porcentaje: 18 },
    { nombre: 'Análisis Clínicos', cantidad: 4, porcentaje: 9 },
    { nombre: 'Cirugía Menor', cantidad: 3, porcentaje: 6 }
  ];

  const pacientesFrecuentes: PacienteFrecuente[] = [
    { nombre: 'María Elena Vásquez', mascota: 'Luna', visitas: 8, ultimaVisita: '2024-08-28' },
    { nombre: 'Carlos Mendoza', mascota: 'Max', visitas: 6, ultimaVisita: '2024-08-25' },
    { nombre: 'Ana Patricia López', mascota: 'Rocky', visitas: 5, ultimaVisita: '2024-08-30' },
    { nombre: 'Jorge Alberto Hernández', mascota: 'Mimi', visitas: 4, ultimaVisita: '2024-08-22' }
  ];

  const datosGrafico = [
    { mes: 'Ene', citas: 32, ingresos: 24000 },
    { mes: 'Feb', citas: 28, ingresos: 21000 },
    { mes: 'Mar', citas: 35, ingresos: 26500 },
    { mes: 'Abr', citas: 42, ingresos: 31000 },
    { mes: 'May', citas: 38, ingresos: 28000 },
    { mes: 'Jun', citas: 45, ingresos: 33500 },
    { mes: 'Jul', citas: 41, ingresos: 30000 },
    { mes: 'Ago', citas: 45, ingresos: 28500 }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  const MetricaCardComponent: React.FC<MetricaCard> = ({ 
    titulo, 
    valor, 
    cambio, 
    tendencia, 
    icono, 
    color 
  }) => (
    <View style={[styles.metricaCard, { borderLeftColor: color }]}>
      <View style={styles.metricaContent}>
        <Text style={styles.metricaTitulo}>{titulo}</Text>
        <Text style={[styles.metricaValor, { color }]}>{valor}</Text>
        <View style={styles.metricaCambio}>
          <Ionicons 
            name={tendencia === 'up' ? 'arrow-up' : tendencia === 'down' ? 'arrow-down' : 'remove'} 
            size={12} 
            color={tendencia === 'up' ? vetTheme.colors.status.success : 
                   tendencia === 'down' ? vetTheme.colors.status.error : 
                   vetTheme.colors.text.light} 
          />
          <Text style={[styles.metricaCambioText, {
            color: tendencia === 'up' ? vetTheme.colors.status.success : 
                   tendencia === 'down' ? vetTheme.colors.status.error : 
                   vetTheme.colors.text.light
          }]}>
            {cambio}
          </Text>
        </View>
      </View>
      <Ionicons name={icono as any} size={28} color={color} />
    </View>
  );

  const SimpleChart = () => {
    const maxValue = Math.max(...datosGrafico.map(d => d.citas));
    const chartHeight = 120;
    const barWidth = (screenWidth - 80) / datosGrafico.length - 8;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Citas por Mes</Text>
        <View style={styles.chart}>
          {datosGrafico.map((data, index) => {
            const barHeight = (data.citas / maxValue) * chartHeight;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight, 
                        width: barWidth,
                        backgroundColor: vetTheme.colors.primary 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{data.mes}</Text>
                <Text style={styles.barValue}>{data.citas}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="download-outline" size={20} color={vetTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Período */}
        <View style={styles.periodoSelector}>
          <Text style={styles.periodoTitulo}>Período:</Text>
          <View style={styles.periodoButtons}>
            {['semana', 'mes', 'año'].map((periodo) => (
              <TouchableOpacity
                key={periodo}
                style={[
                  styles.periodoButton,
                  periodoActual === periodo && styles.periodoButtonActivo
                ]}
                onPress={() => setPeriodoActual(periodo)}
              >
                <Text style={[
                  styles.periodoButtonText,
                  periodoActual === periodo && styles.periodoButtonTextActivo
                ]}>
                  {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Métricas Principales */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Resumen del Mes</Text>
          <View style={styles.metricasGrid}>
            {metricas.map((metrica, index) => (
              <MetricaCardComponent key={index} {...metrica} />
            ))}
          </View>
        </View>

        {/* Gráfico Simple */}
        <View style={styles.seccion}>
          <SimpleChart />
        </View>

        {/* Top Tratamientos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Tratamientos Más Frecuentes</Text>
          <View style={styles.tratamientosList}>
            {tratamientosTop.map((tratamiento, index) => (
              <View key={index} style={styles.tratamientoItem}>
                <View style={styles.tratamientoInfo}>
                  <Text style={styles.tratamientoNombre}>{tratamiento.nombre}</Text>
                  <Text style={styles.tratamientoCantidad}>{tratamiento.cantidad} consultas</Text>
                </View>
                <View style={styles.tratamientoBar}>
                  <View 
                    style={[
                      styles.tratamientoBarFill,
                      { width: `${tratamiento.porcentaje}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.tratamientoPorcentaje}>{tratamiento.porcentaje}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pacientes Frecuentes */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Pacientes Más Frecuentes</Text>
          <View style={styles.pacientesList}>
            {pacientesFrecuentes.map((paciente, index) => (
              <View key={index} style={styles.pacienteItem}>
                <View style={styles.pacienteAvatar}>
                  <Text style={styles.pacienteAvatarText}>
                    {paciente.nombre.charAt(0)}{paciente.mascota.charAt(0)}
                  </Text>
                </View>
                <View style={styles.pacienteInfo}>
                  <Text style={styles.pacienteNombre}>{paciente.nombre}</Text>
                  <Text style={styles.pacienteMascota}>{paciente.mascota}</Text>
                  <Text style={styles.pacienteVisitas}>
                    {paciente.visitas} visitas • Última: {formatFecha(paciente.ultimaVisita)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={vetTheme.colors.text.light} />
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={20} color={vetTheme.colors.status.success} />
              <Text style={styles.insightText}>
                Tus ingresos han aumentado 12.5% este mes comparado con el anterior
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="time-outline" size={20} color={vetTheme.colors.secondary} />
              <Text style={styles.insightText}>
                Los martes son tu día más ocupado con un promedio de 8 citas
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="star" size={20} color={vetTheme.colors.accent} />
              <Text style={styles.insightText}>
                Tu calificación promedio ha mejorado 0.2 puntos en las últimas 4 semanas
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  headerAction: {
    padding: vetTheme.spacing.sm,
    marginRight: -vetTheme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  periodoSelector: {
    backgroundColor: 'white',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodoTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  periodoButtons: {
    flexDirection: 'row',
    gap: vetTheme.spacing.sm,
  },
  periodoButton: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
  },
  periodoButtonActivo: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  periodoButtonText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  periodoButtonTextActivo: {
    color: 'white',
    fontWeight: vetTheme.typography.weights.medium,
  },
  seccion: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.lg,
  },
  seccionTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.lg,
  },
  metricasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: vetTheme.spacing.lg,
    gap: vetTheme.spacing.sm,
  },
  metricaCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricaContent: {
    flex: 1,
  },
  metricaTitulo: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  metricaValor: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    marginBottom: vetTheme.spacing.xs,
  },
  metricaCambio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricaCambioText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    marginLeft: 2,
  },
  chartContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  chartTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: vetTheme.spacing.sm,
  },
  bar: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginBottom: 2,
  },
  barValue: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  tratamientosList: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  tratamientoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.lg,
  },
  tratamientoInfo: {
    flex: 2,
  },
  tratamientoNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  tratamientoCantidad: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  tratamientoBar: {
    flex: 3,
    height: 8,
    backgroundColor: vetTheme.colors.border.light,
    borderRadius: 4,
    marginHorizontal: vetTheme.spacing.md,
    overflow: 'hidden',
  },
  tratamientoBarFill: {
    height: '100%',
    backgroundColor: vetTheme.colors.primary,
    borderRadius: 4,
  },
  tratamientoPorcentaje: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    minWidth: 35,
    textAlign: 'right',
  },
  pacientesList: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  pacienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  pacienteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vetTheme.spacing.md,
  },
  pacienteAvatarText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.bold,
    color: 'white',
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  pacienteMascota: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  pacienteVisitas: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
  },
  insightsList: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.lg,
  },
  insightText: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.md,
    lineHeight: 20,
  },
});

export default EstadisticasScreen;