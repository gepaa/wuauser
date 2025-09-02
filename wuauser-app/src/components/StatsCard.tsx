import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Stat {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  backgroundColor: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  onPress?: () => void;
}

interface StatsCardProps {
  // Content
  stats: Stat[];
  isLoading?: boolean;
  
  // Display
  title?: string;
  layout?: 'grid' | 'row';
  showTrends?: boolean;
  
  // Actions
  onStatPress?: (stat: Stat) => void;
  
  // Styling
  style?: ViewStyle;
  cardStyle?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  stats = [],
  isLoading = false,
  title = 'Estadísticas de Hoy',
  layout = 'grid',
  showTrends = true,
  onStatPress,
  style,
  cardStyle,
}) => {
  
  const getTrendIcon = (direction: 'up' | 'down' | 'neutral'): string => {
    switch (direction) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'neutral': return 'remove';
    }
  };
  
  const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
    switch (direction) {
      case 'up': return Colors.success;
      case 'down': return Colors.error;
      case 'neutral': return Colors.gray[500];
    }
  };
  
  const renderStat = (stat: Stat, index: number) => {
    const isGrid = layout === 'grid';
    const cardWidth = isGrid ? '48%' : '100%';
    
    return (
      <TouchableOpacity
        key={stat.id}
        style={[
          styles.statCard,
          { width: cardWidth },
          cardStyle,
          !isGrid && styles.rowCard
        ]}
        onPress={() => {
          stat.onPress?.();
          onStatPress?.(stat);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[stat.backgroundColor, stat.backgroundColor + 'CC']}
          style={styles.gradientBackground}
        >
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <Ionicons 
                name={stat.icon as any} 
                size={isGrid ? 20 : 24} 
                color={Colors.text.inverse} 
              />
            </View>
            
            {showTrends && stat.trend && (
              <View style={[
                styles.trendContainer,
                { backgroundColor: getTrendColor(stat.trend.direction) + '20' }
              ]}>
                <Ionicons 
                  name={getTrendIcon(stat.trend.direction)} 
                  size={12} 
                  color={getTrendColor(stat.trend.direction)} 
                />
                <Text style={[
                  styles.trendPercentage,
                  { color: getTrendColor(stat.trend.direction) }
                ]}>
                  {stat.trend.percentage}%
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.statContent}>
            <Text style={[
              styles.statValue,
              isGrid ? Typography.headline.medium : Typography.headline.large
            ]}>
              {stat.value}
            </Text>
            
            <Text style={[
              styles.statTitle,
              isGrid ? Typography.body.small : Typography.body.medium
            ]}>
              {stat.title}
            </Text>
            
            {stat.subtitle && (
              <Text style={[
                styles.statSubtitle,
                isGrid ? Typography.caption.small : Typography.caption.medium
              ]}>
                {stat.subtitle}
              </Text>
            )}
            
            {showTrends && stat.trend && (
              <Text style={styles.trendPeriod}>
                vs {stat.trend.period}
              </Text>
            )}
          </View>
          
          {!isGrid && (
            <View style={styles.statArrow}>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray[400]} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  
  const renderSkeletonGrid = () => (
    <>
      {[...Array(4)].map((_, index) => (
        <View key={index} style={[styles.statCard, { width: '48%' }]}>
          <LoadingSkeleton 
            variant="card" 
            height={120}
            animated={true}
          />
        </View>
      ))}
    </>
  );
  
  const renderSkeletonRows = () => (
    <>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={[styles.statCard, { width: '100%' }]}>
          <LoadingSkeleton 
            variant="card" 
            height={80}
            animated={true}
          />
        </View>
      ))}
    </>
  );
  
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        <View style={[
          styles.statsGrid,
          layout === 'row' && styles.statsColumn
        ]}>
          {layout === 'grid' ? renderSkeletonGrid() : renderSkeletonRows()}
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      <View style={[
        styles.statsGrid,
        layout === 'row' && styles.statsColumn
      ]}>
        {stats.map(renderStat)}
      </View>
    </View>
  );
};

// Predefined stat configurations for common veterinary metrics
export const VetStatsConfig = {
  todayAppointments: (count: number, trend?: number): Stat => ({
    id: 'today-appointments',
    title: 'Citas de Hoy',
    value: count,
    subtitle: `${count} programadas`,
    icon: 'calendar',
    color: Colors.medical.consultation,
    backgroundColor: Colors.medical.consultation + '15',
    trend: trend ? {
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
      percentage: Math.abs(trend),
      period: 'ayer'
    } : undefined,
  }),
  
  totalPatients: (count: number, newCount?: number): Stat => ({
    id: 'total-patients',
    title: 'Pacientes Activos',
    value: count,
    subtitle: newCount ? `${newCount} nuevos esta semana` : undefined,
    icon: 'people',
    color: Colors.medical.preventive,
    backgroundColor: Colors.medical.preventive + '15',
    trend: newCount ? {
      direction: 'up',
      percentage: Math.round((newCount / count) * 100),
      period: 'sem. pasada'
    } : undefined,
  }),
  
  weeklyRevenue: (amount: string, trend?: number): Stat => ({
    id: 'weekly-revenue',
    title: 'Ingresos Semanal',
    value: amount,
    subtitle: 'últimos 7 días',
    icon: 'cash',
    color: Colors.secondary,
    backgroundColor: Colors.secondary + '15',
    trend: trend ? {
      direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
      percentage: Math.abs(trend),
      period: 'sem. anterior'
    } : undefined,
  }),
  
  averageRating: (rating: number, reviewCount: number): Stat => ({
    id: 'average-rating',
    title: 'Calificación Promedio',
    value: rating.toFixed(1),
    subtitle: `${reviewCount} reseñas`,
    icon: 'star',
    color: Colors.medical.emergency,
    backgroundColor: Colors.medical.emergency + '15',
  }),
  
  emergencyCalls: (count: number): Stat => ({
    id: 'emergency-calls',
    title: 'Emergencias',
    value: count,
    subtitle: count === 0 ? 'Sin emergencias' : 'requieren atención',
    icon: 'medical',
    color: count > 0 ? Colors.error : Colors.success,
    backgroundColor: (count > 0 ? Colors.error : Colors.success) + '15',
  }),
  
  pendingResults: (count: number): Stat => ({
    id: 'pending-results',
    title: 'Resultados Pendientes',
    value: count,
    subtitle: count === 0 ? 'Todo al día' : 'por entregar',
    icon: 'document-text',
    color: count > 3 ? Colors.warning : Colors.success,
    backgroundColor: (count > 3 ? Colors.warning : Colors.success) + '15',
  }),
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.large,
    ...Shadow.md,
  },
  
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  
  title: {
    ...Typography.headline.medium,
    color: Colors.text.primary,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  
  statsColumn: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  
  statCard: {
    borderRadius: BorderRadius.card.medium,
    overflow: 'hidden',
    minHeight: 120,
    ...Shadow.sm,
  },
  
  rowCard: {
    minHeight: 80,
  },
  
  gradientBackground: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xs,
  },
  
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.button.small,
    gap: 2,
  },
  
  trendPercentage: {
    ...Typography.caption.small,
    fontWeight: 'bold',
    fontSize: 10,
  },
  
  statContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  statValue: {
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  
  statTitle: {
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  statSubtitle: {
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  
  trendPeriod: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  
  statArrow: {
    alignSelf: 'flex-end',
  },
});

export default StatsCard;