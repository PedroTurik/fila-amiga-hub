import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Category {
  id: string;
  name: string;
  type: 'geral' | 'preferencial' | 'prioritario';
}

export interface Attendant {
  id: string;
  name: string;
  desk_number: number;
  status: 'available' | 'busy' | 'offline';
  current_ticket_id?: string;
}

export interface Ticket {
  id: string;
  number: string;
  category_id: string;
  is_preferential: boolean;
  status: 'waiting' | 'called' | 'being_served' | 'completed' | 'cancelled';
  attendant_id?: string;
  called_at?: string;
  served_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  attendant?: Attendant;
}

export function useSupabaseQueue() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, attendantsRes, ticketsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('attendants').select('*'),
        supabase.from('tickets').select(`
          *,
          category:categories(*),
          attendant:attendants(*)
        `).order('created_at', { ascending: true })
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (attendantsRes.error) throw attendantsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;

      setCategories(categoriesRes.data || []);
      setAttendants(attendantsRes.data || []);
      setTickets(ticketsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do sistema',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          loadData(); // Reload all data when tickets change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendants'
        },
        () => {
          loadData(); // Reload all data when attendants change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  };

  const generateTicketNumber = (categoryType: string) => {
    const prefix = categoryType === 'preferencial' ? 'P' : 
                  categoryType === 'prioritario' ? 'R' : 'G';
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const createTicket = async (categoryId: string, isPreferential: boolean) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) throw new Error('Categoria não encontrada');

      const ticketNumber = generateTicketNumber(category.type);

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          number: ticketNumber,
          category_id: categoryId,
          is_preferential: isPreferential,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Ticket Criado',
        description: `Seu ticket ${ticketNumber} foi gerado!`,
      });

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar ticket',
        variant: 'destructive',
      });
      return null;
    }
  };

  const callNextTicket = async (attendantId: string) => {
    try {
      // Find next waiting ticket (preferential first)
      const nextTicket = tickets
        .filter(t => t.status === 'waiting')
        .sort((a, b) => {
          if (a.is_preferential && !b.is_preferential) return -1;
          if (!a.is_preferential && b.is_preferential) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })[0];

      if (!nextTicket) {
        toast({
          title: 'Fila Vazia',
          description: 'Não há tickets aguardando atendimento',
        });
        return null;
      }

      // Update ticket status
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: 'called',
          attendant_id: attendantId,
          called_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id);

      if (ticketError) throw ticketError;

      // Update attendant status
      const { error: attendantError } = await supabase
        .from('attendants')
        .update({ 
          status: 'busy',
          current_ticket_id: nextTicket.id
        })
        .eq('id', attendantId);

      if (attendantError) throw attendantError;

      toast({
        title: 'Ticket Chamado',
        description: `Ticket ${nextTicket.number} foi chamado!`,
      });

      return nextTicket;
    } catch (error) {
      console.error('Error calling next ticket:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao chamar próximo ticket',
        variant: 'destructive',
      });
      return null;
    }
  };

  const startService = async (ticketId: string, attendantId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'being_served',
          served_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Atendimento Iniciado',
        description: 'Atendimento foi iniciado',
      });
    } catch (error) {
      console.error('Error starting service:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao iniciar atendimento',
        variant: 'destructive',
      });
    }
  };

  const completeService = async (ticketId: string, attendantId: string) => {
    try {
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      const { error: attendantError } = await supabase
        .from('attendants')
        .update({ 
          status: 'available',
          current_ticket_id: null
        })
        .eq('id', attendantId);

      if (attendantError) throw attendantError;

      toast({
        title: 'Atendimento Concluído',
        description: 'Atendimento foi finalizado',
      });
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar atendimento',
        variant: 'destructive',
      });
    }
  };

  const setAttendantStatus = async (attendantId: string, status: 'available' | 'offline') => {
    try {
      const { error } = await supabase
        .from('attendants')
        .update({ status })
        .eq('id', attendantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating attendant status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do atendente',
        variant: 'destructive',
      });
    }
  };

  const getQueuePosition = async (ticketId: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('get_queue_position', { ticket_id: ticketId });
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting queue position:', error);
      return 0;
    }
  };

  return {
    categories,
    attendants,
    tickets,
    isLoading,
    createTicket,
    callNextTicket,
    startService,
    completeService,
    setAttendantStatus,
    getQueuePosition,
    refreshData: loadData
  };
}