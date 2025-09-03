import { supabase } from './supabase';
import { mockVeterinarios, MockVeterinario, calcularDistancia, getProximaDisponibilidad } from '../data/mockVeterinarios';

export interface FiltrosBusqueda {
  ubicacion?: {
    lat: number;
    lng: number;
  };
  distanciaMaxima?: number;
  busquedaTexto?: string;
  precioMin?: number;
  precioMax?: number;
  servicios?: string[];
  ratingMinimo?: number;
  aceptaUrgencias?: boolean;
  serviciosDomicilio?: boolean;
  disponibilidad?: string;
}

export interface ResultadoBusqueda {
  veterinarios: MockVeterinario[];
  total: number;
  page: number;
  limit: number;
}

class SearchService {
  
  async buscarVeterinarios(
    filtros: FiltrosBusqueda = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ data: ResultadoBusqueda | null; error: any }> {
    try {
      console.log('🔍 Buscando veterinarios con filtros:', filtros);
      
      // Por ahora usamos mock data, luego se puede integrar con Supabase
      if (!supabase) {
        return this.buscarVeterinariosMock(filtros, page, limit);
      }

      // Implementación con Supabase (preparada para el futuro)
      let query = supabase
        .from('veterinarios')
        .select(`
          *,
          clinica:clinicas(*),
          servicios:veterinario_servicios(*)
        `)
        .eq('verificado', true);

      // Aplicar filtros de precio
      if (filtros.precioMin !== undefined || filtros.precioMax !== undefined) {
        // Esta lógica necesitaría ser implementada en la base de datos
      }

      // Aplicar filtro de rating
      if (filtros.ratingMinimo && filtros.ratingMinimo > 0) {
        query = query.gte('rating', filtros.ratingMinimo);
      }

      // Aplicar filtros booleanos
      if (filtros.aceptaUrgencias) {
        query = query.eq('acepta_urgencias', true);
      }

      if (filtros.serviciosDomicilio) {
        query = query.eq('servicios_domicilio', true);
      }

      // Paginación
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;

      const resultado: ResultadoBusqueda = {
        veterinarios: data || [],
        total: count || 0,
        page,
        limit
      };

      return { data: resultado, error: null };
      
    } catch (error) {
      console.error('Error en búsqueda de veterinarios:', error);
      return { data: null, error };
    }
  }

  private async buscarVeterinariosMock(
    filtros: FiltrosBusqueda, 
    page: number, 
    limit: number
  ): Promise<{ data: ResultadoBusqueda; error: null }> {
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let veterinarios = [...mockVeterinarios];

    // Calcular distancias si hay ubicación
    if (filtros.ubicacion) {
      veterinarios = veterinarios.map(vet => ({
        ...vet,
        distancia: calcularDistancia(
          filtros.ubicacion!.lat,
          filtros.ubicacion!.lng,
          vet.ubicacion.lat,
          vet.ubicacion.lng
        ),
        proximaDisponibilidad: getProximaDisponibilidad(vet.id)
      }));

      // Filtrar por distancia máxima
      if (filtros.distanciaMaxima) {
        veterinarios = veterinarios.filter(vet => 
          (vet.distancia || 0) <= filtros.distanciaMaxima!
        );
      }

      // Ordenar por distancia
      veterinarios.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
    }

    // Filtrar por búsqueda de texto
    if (filtros.busquedaTexto && filtros.busquedaTexto.trim()) {
      const textoBusqueda = filtros.busquedaTexto.toLowerCase();
      veterinarios = veterinarios.filter(vet => 
        vet.nombre.toLowerCase().includes(textoBusqueda) ||
        vet.especialidad.toLowerCase().includes(textoBusqueda) ||
        vet.clinica.nombre.toLowerCase().includes(textoBusqueda) ||
        vet.servicios.some(s => 
          s.nombre.toLowerCase().includes(textoBusqueda) ||
          s.categoria.toLowerCase().includes(textoBusqueda)
        )
      );
    }

    // Filtrar por rango de precios
    if (filtros.precioMin !== undefined || filtros.precioMax !== undefined) {
      veterinarios = veterinarios.filter(vet => {
        const precioMinimo = Math.min(...vet.servicios.map(s => s.precio));
        const precioMaximo = Math.max(...vet.servicios.map(s => s.precio));
        
        let cumpleFiltro = true;
        
        if (filtros.precioMin !== undefined) {
          cumpleFiltro = cumpleFiltro && precioMinimo >= filtros.precioMin;
        }
        
        if (filtros.precioMax !== undefined) {
          cumpleFiltro = cumpleFiltro && precioMinimo <= filtros.precioMax;
        }
        
        return cumpleFiltro;
      });
    }

    // Filtrar por rating mínimo
    if (filtros.ratingMinimo && filtros.ratingMinimo > 0) {
      veterinarios = veterinarios.filter(vet => vet.rating >= filtros.ratingMinimo!);
    }

    // Filtrar por servicios específicos
    if (filtros.servicios && filtros.servicios.length > 0) {
      veterinarios = veterinarios.filter(vet => 
        filtros.servicios!.some(servicioFiltro =>
          vet.servicios.some(s => 
            s.categoria === servicioFiltro || 
            s.nombre.toLowerCase().includes(servicioFiltro.toLowerCase())
          )
        )
      );
    }

    // Filtrar por características especiales
    if (filtros.aceptaUrgencias) {
      veterinarios = veterinarios.filter(vet => vet.configuraciones.aceptaUrgencias);
    }

    if (filtros.serviciosDomicilio) {
      veterinarios = veterinarios.filter(vet => vet.configuraciones.serviciosDomicilio);
    }

    // Aplicar paginación
    const total = veterinarios.length;
    const offset = (page - 1) * limit;
    const veterinariosPaginados = veterinarios.slice(offset, offset + limit);

    const resultado: ResultadoBusqueda = {
      veterinarios: veterinariosPaginados,
      total,
      page,
      limit
    };

    console.log(`📊 Búsqueda completada: ${veterinariosPaginados.length}/${total} veterinarios`);
    
    return { data: resultado, error: null };
  }

  async getVeterinarioPorId(veterinarioId: string): Promise<{ data: MockVeterinario | null; error: any }> {
    try {
      console.log('🔍 Obteniendo veterinario:', veterinarioId);
      
      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        const veterinario = mockVeterinarios.find(v => v.id === veterinarioId);
        
        if (!veterinario) {
          return { data: null, error: 'Veterinario no encontrado' };
        }

        // Agregar información dinámica
        const veterinarioCompleto = {
          ...veterinario,
          proximaDisponibilidad: getProximaDisponibilidad(veterinario.id)
        };

        return { data: veterinarioCompleto, error: null };
      }

      // Implementación con Supabase
      const { data, error } = await supabase
        .from('veterinarios')
        .select(`
          *,
          clinica:clinicas(*),
          servicios:veterinario_servicios(*)
        `)
        .eq('id', veterinarioId)
        .eq('verificado', true)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Error obteniendo veterinario:', error);
      return { data: null, error };
    }
  }

  async getServiciosVeterinario(veterinarioId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      console.log('🔍 Obteniendo servicios del veterinario:', veterinarioId);
      
      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 300));
        const veterinario = mockVeterinarios.find(v => v.id === veterinarioId);
        
        if (!veterinario) {
          return { data: null, error: 'Veterinario no encontrado' };
        }

        return { data: veterinario.servicios, error: null };
      }

      // Implementación con Supabase
      const { data, error } = await supabase
        .from('veterinario_servicios')
        .select('*')
        .eq('veterinario_id', veterinarioId)
        .eq('activo', true)
        .order('precio', { ascending: true });
      
      if (error) throw error;
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Error obteniendo servicios:', error);
      return { data: null, error };
    }
  }

  async getHorariosDisponibles(
    veterinarioId: string, 
    fecha: string
  ): Promise<{ data: string[] | null; error: any }> {
    try {
      console.log('🔍 Obteniendo horarios disponibles:', { veterinarioId, fecha });
      
      if (!supabase) {
        // Mock implementation - generar horarios disponibles
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const veterinario = mockVeterinarios.find(v => v.id === veterinarioId);
        if (!veterinario) {
          return { data: null, error: 'Veterinario no encontrado' };
        }

        const fechaObj = new Date(fecha);
        const diaSemana = fechaObj.toLocaleDateString('es-MX', { weekday: 'long' }).toLowerCase();
        
        const horarioDia = veterinario.horarios[diaSemana];
        if (!horarioDia || !horarioDia.activo) {
          return { data: [], error: null };
        }

        // Generar slots de tiempo basados en configuración
        const horariosDisponibles = this.generarHorariosDisponibles(
          horarioDia.inicio!,
          horarioDia.fin!,
          veterinario.configuraciones.tiempoEntreCitas
        );

        return { data: horariosDisponibles, error: null };
      }

      // Implementación con Supabase
      const { data, error } = await supabase
        .rpc('get_horarios_disponibles', {
          vet_id: veterinarioId,
          fecha_consulta: fecha
        });
      
      if (error) throw error;
      
      return { data, error: null };
      
    } catch (error) {
      console.error('Error obteniendo horarios disponibles:', error);
      return { data: null, error };
    }
  }

  private generarHorariosDisponibles(
    horaInicio: string, 
    horaFin: string, 
    intervaloMinutos: number
  ): string[] {
    const horarios: string[] = [];
    
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    
    let horaActual = new Date();
    horaActual.setHours(horaInicioH, horaInicioM, 0, 0);
    
    const horaLimite = new Date();
    horaLimite.setHours(horaFinH, horaFinM, 0, 0);
    
    while (horaActual < horaLimite) {
      // Simular que algunos horarios ya están ocupados
      const estaOcupado = Math.random() < 0.3; // 30% probabilidad de estar ocupado
      
      if (!estaOcupado) {
        const horaString = horaActual.toTimeString().slice(0, 5);
        horarios.push(horaString);
      }
      
      horaActual.setMinutes(horaActual.getMinutes() + intervaloMinutos);
    }
    
    return horarios;
  }

  async getVeterinariosFavoritos(usuarioId: string): Promise<{ data: MockVeterinario[] | null; error: any }> {
    try {
      console.log('⭐ Obteniendo veterinarios favoritos para:', usuarioId);
      
      if (!supabase) {
        // Mock implementation - simular favoritos
        await new Promise(resolve => setTimeout(resolve, 400));
        const favoritos = mockVeterinarios.slice(0, 3); // Primeros 3 como favoritos
        return { data: favoritos, error: null };
      }

      // Implementación con Supabase
      const { data, error } = await supabase
        .from('veterinarios_favoritos')
        .select(`
          veterinario:veterinarios(
            *,
            clinica:clinicas(*),
            servicios:veterinario_servicios(*)
          )
        `)
        .eq('usuario_id', usuarioId);
      
      if (error) throw error;
      
      const favoritos = data?.map(item => item.veterinario) || [];
      return { data: favoritos, error: null };
      
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      return { data: null, error };
    }
  }

  async agregarFavorito(usuarioId: string, veterinarioId: string): Promise<{ data: boolean; error: any }> {
    try {
      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('⭐ Agregado a favoritos:', { usuarioId, veterinarioId });
        return { data: true, error: null };
      }

      const { error } = await supabase
        .from('veterinarios_favoritos')
        .insert({ usuario_id: usuarioId, veterinario_id: veterinarioId });
      
      if (error) throw error;
      
      return { data: true, error: null };
      
    } catch (error) {
      console.error('Error agregando favorito:', error);
      return { data: false, error };
    }
  }

  async removerFavorito(usuarioId: string, veterinarioId: string): Promise<{ data: boolean; error: any }> {
    try {
      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('💔 Removido de favoritos:', { usuarioId, veterinarioId });
        return { data: true, error: null };
      }

      const { error } = await supabase
        .from('veterinarios_favoritos')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('veterinario_id', veterinarioId);
      
      if (error) throw error;
      
      return { data: true, error: null };
      
    } catch (error) {
      console.error('Error removiendo favorito:', error);
      return { data: false, error };
    }
  }
}

export const searchService = new SearchService();