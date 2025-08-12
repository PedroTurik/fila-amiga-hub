import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueueStore } from '@/store/queueStore';
import { Clock, Star, Users, Phone } from 'lucide-react';

const Display = () => {
  const { tickets, attendants } = useQueueStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const recentCalls = tickets
    .filter(t => t.status === 'called' && t.calledAt)
    .sort((a, b) => (b.calledAt?.getTime() || 0) - (a.calledAt?.getTime() || 0))
    .slice(0, 5);

  const waitingTickets = tickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const activeAttendants = attendants.filter(a => a.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Painel de Atendimento
          </h1>
          <div className="text-2xl text-muted-foreground">
            {currentTime.toLocaleTimeString()} - {currentTime.toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chamadas Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Phone className="w-7 h-7 text-primary" />
                Últimas Chamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCalls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Nenhuma chamada recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCalls.map((ticket, index) => (
                    <div
                      key={ticket.id}
                      className={`p-6 rounded-lg border-2 transition-all duration-500 ${
                        index === 0 
                          ? 'bg-warning/10 border-warning animate-pulse' 
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-primary">
                            {ticket.number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{ticket.category}</span>
                              {ticket.isPriority && (
                                <Badge variant="secondary" className="bg-warning/10 text-warning">
                                  <Star className="w-3 h-3 mr-1" />
                                  Preferencial
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Chamado às {ticket.calledAt?.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">
                            Mesa {ticket.deskNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {attendants.find(a => a.id === ticket.attendantId)?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Fila Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {waitingTickets.length}
                  </div>
                  <p className="text-muted-foreground">pessoas aguardando</p>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preferencial:</span>
                    <span className="font-semibold text-warning">
                      {waitingTickets.filter(t => t.isPriority).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Normal:</span>
                    <span className="font-semibold text-primary">
                      {waitingTickets.filter(t => !t.isPriority).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-accent" />
                  Atendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAttendants.length === 0 ? (
                    <p className="text-center text-muted-foreground">
                      Nenhum atendente ativo
                    </p>
                  ) : (
                    activeAttendants.map((attendant) => {
                      const currentTicket = attendant.currentTicket 
                        ? tickets.find(t => t.id === attendant.currentTicket)
                        : null;
                      
                      return (
                        <div key={attendant.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">Mesa {attendant.deskNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {attendant.name}
                              </div>
                            </div>
                            <div className="text-right">
                              {currentTicket ? (
                                <div>
                                  <div className="font-bold text-accent">
                                    {currentTicket.number}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Atendendo
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="bg-accent/10 text-accent">
                                  Disponível
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Próximos na Fila */}
        {waitingTickets.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                Próximos na Fila
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {waitingTickets.slice(0, 8).map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg border bg-card text-center"
                  >
                    <div className="text-2xl font-bold text-primary mb-1">
                      {ticket.number}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {ticket.category}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {index + 1}º posição
                      </span>
                      {ticket.isPriority && (
                        <Star className="w-3 h-3 text-warning" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Display;