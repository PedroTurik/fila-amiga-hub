import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueueStore } from '@/store/queueStore';
import { Clock, Hash, Star, Users, CheckCircle, Phone } from 'lucide-react';

const Ticket = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { getTicketById, getQueuePosition } = useQueueStore();
  const [ticket, setTicket] = useState(getTicketById(ticketId || ''));
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (ticketId) {
        const updatedTicket = getTicketById(ticketId);
        setTicket(updatedTicket);
        if (updatedTicket && updatedTicket.status === 'waiting') {
          setPosition(getQueuePosition(ticketId));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ticketId, getTicketById, getQueuePosition]);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Senha não encontrada
            </h2>
            <p className="text-muted-foreground">
              Verifique se o QR Code foi escaneado corretamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (ticket.status) {
      case 'waiting':
        return {
          title: 'Aguardando Atendimento',
          color: 'text-primary',
          icon: Clock,
          bgColor: 'bg-primary/10'
        };
      case 'called':
        return {
          title: 'Chamado para Atendimento',
          color: 'text-warning',
          icon: Phone,
          bgColor: 'bg-warning/10'
        };
      case 'attending':
        return {
          title: 'Em Atendimento',
          color: 'text-accent',
          icon: Users,
          bgColor: 'bg-accent/10'
        };
      case 'completed':
        return {
          title: 'Atendimento Concluído',
          color: 'text-accent',
          icon: CheckCircle,
          bgColor: 'bg-accent/10'
        };
      default:
        return {
          title: 'Status Desconhecido',
          color: 'text-muted-foreground',
          icon: Clock,
          bgColor: 'bg-muted/10'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl text-primary">
              Sua Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold text-primary mb-4">
              {ticket.number}
            </div>
            {ticket.isPriority && (
              <Badge variant="secondary" className="bg-warning/10 text-warning mb-4">
                <Star className="w-4 h-4 mr-1" />
                Preferencial
              </Badge>
            )}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Hash className="w-4 h-4" />
                <span>{ticket.category}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Criado às {ticket.createdAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`mb-6 ${statusInfo.bgColor}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              <h3 className={`text-xl font-semibold ${statusInfo.color}`}>
                {statusInfo.title}
              </h3>
            </div>
            
            {ticket.status === 'waiting' && (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {position}º
                </div>
                <p className="text-muted-foreground">
                  posição na fila
                </p>
                <div className="mt-4 text-sm text-muted-foreground">
                  Tempo estimado: {position * 5} - {position * 10} minutos
                </div>
              </div>
            )}

            {ticket.status === 'called' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-warning mb-2">
                  Dirija-se à mesa {ticket.deskNumber}
                </div>
                <p className="text-muted-foreground">
                  Seu atendimento foi chamado!
                </p>
              </div>
            )}

            {ticket.status === 'attending' && (
              <div className="text-center">
                <div className="text-xl font-semibold text-accent mb-2">
                  Mesa {ticket.deskNumber}
                </div>
                <p className="text-muted-foreground">
                  Você está sendo atendido
                </p>
              </div>
            )}

            {ticket.status === 'completed' && (
              <div className="text-center">
                <p className="text-accent font-semibold">
                  Obrigado por utilizar nossos serviços!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                📱 Mantenha esta tela aberta para acompanhar atualizações em tempo real
              </p>
              <p>
                ⏰ Chegue ao balcão quando for chamado
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ticket;