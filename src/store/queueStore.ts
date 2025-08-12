import { create } from 'zustand';

export interface QueueTicket {
  id: string;
  number: string;
  category: string;
  isPriority: boolean;
  status: 'waiting' | 'called' | 'attending' | 'completed';
  queuePosition: number;
  createdAt: Date;
  calledAt?: Date;
  attendantId?: string;
  deskNumber?: string;
}

export interface Attendant {
  id: string;
  name: string;
  deskNumber: string;
  isActive: boolean;
  currentTicket?: string;
}

interface QueueStore {
  tickets: QueueTicket[];
  attendants: Attendant[];
  categories: string[];
  currentNumber: number;
  
  // Actions
  addTicket: (category: string, isPriority: boolean) => QueueTicket;
  callNextTicket: (attendantId: string, deskNumber: string) => QueueTicket | null;
  completeTicket: (ticketId: string) => void;
  addAttendant: (name: string, deskNumber: string) => void;
  removeAttendant: (attendantId: string) => void;
  getTicketById: (id: string) => QueueTicket | undefined;
  getQueuePosition: (ticketId: string) => number;
  getWaitingTickets: () => QueueTicket[];
}

const CATEGORIES = [
  'Atendimento Geral',
  'Abertura de Conta',
  'Empréstimos e Financiamentos',
  'Cartões',
  'Investimentos',
  'Suporte Técnico'
];

export const useQueueStore = create<QueueStore>((set, get) => ({
  tickets: [],
  attendants: [],
  categories: CATEGORIES,
  currentNumber: 1,

  addTicket: (category: string, isPriority: boolean) => {
    const state = get();
    const prefix = isPriority ? 'P' : 'N';
    const number = `${prefix}${state.currentNumber.toString().padStart(3, '0')}`;
    
    const ticket: QueueTicket = {
      id: crypto.randomUUID(),
      number,
      category,
      isPriority,
      status: 'waiting',
      queuePosition: state.tickets.filter(t => t.status === 'waiting').length + 1,
      createdAt: new Date(),
    };

    set(state => ({
      tickets: [...state.tickets, ticket],
      currentNumber: state.currentNumber + 1,
    }));

    return ticket;
  },

  callNextTicket: (attendantId: string, deskNumber: string) => {
    const state = get();
    const waitingTickets = state.tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => {
        // Priority tickets first, then by creation time
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    const nextTicket = waitingTickets[0];
    if (!nextTicket) return null;

    set(state => ({
      tickets: state.tickets.map(t => 
        t.id === nextTicket.id 
          ? { ...t, status: 'called' as const, calledAt: new Date(), attendantId, deskNumber }
          : t
      ),
      attendants: state.attendants.map(a =>
        a.id === attendantId
          ? { ...a, currentTicket: nextTicket.id }
          : a
      )
    }));

    return { ...nextTicket, status: 'called' as const, calledAt: new Date(), attendantId, deskNumber };
  },

  completeTicket: (ticketId: string) => {
    set(state => ({
      tickets: state.tickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'completed' as const }
          : t
      ),
      attendants: state.attendants.map(a =>
        a.currentTicket === ticketId
          ? { ...a, currentTicket: undefined }
          : a
      )
    }));
  },

  addAttendant: (name: string, deskNumber: string) => {
    const attendant: Attendant = {
      id: crypto.randomUUID(),
      name,
      deskNumber,
      isActive: true,
    };

    set(state => ({
      attendants: [...state.attendants, attendant]
    }));
  },

  removeAttendant: (attendantId: string) => {
    set(state => ({
      attendants: state.attendants.filter(a => a.id !== attendantId)
    }));
  },

  getTicketById: (id: string) => {
    return get().tickets.find(t => t.id === id);
  },

  getQueuePosition: (ticketId: string) => {
    const state = get();
    const ticket = state.tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'waiting') return 0;

    const waitingTickets = state.tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return waitingTickets.findIndex(t => t.id === ticketId) + 1;
  },

  getWaitingTickets: () => {
    return get().tickets.filter(t => t.status === 'waiting');
  },
}));