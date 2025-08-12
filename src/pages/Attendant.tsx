import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQueueStore } from '@/store/queueStore';
import { UserCheck, Phone, CheckCircle, Clock, Star, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Attendant = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [attendantName, setAttendantName] = useState('');
  const [deskNumber, setDeskNumber] = useState('');
  const [currentAttendantId, setCurrentAttendantId] = useState('');
  
  const { 
    addAttendant, 
    removeAttendant, 
    callNextTicket, 
    completeTicket, 
    attendants, 
    tickets,
    getWaitingTickets 
  } = useQueueStore();

  const handleLogin = () => {
    if (!attendantName.trim() || !deskNumber.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    addAttendant(attendantName.trim(), deskNumber.trim());
    const attendant = attendants.find(a => a.name === attendantName.trim() && a.deskNumber === deskNumber.trim());
    if (attendant) {
      setCurrentAttendantId(attendant.id);
    } else {
      // Get the ID of the newly created attendant
      const newAttendant = attendants[attendants.length - 1];
      setCurrentAttendantId(newAttendant?.id || '');
    }
    setIsLoggedIn(true);
    
    toast({
      title: "Login realizado",
      description: `Bem-vindo, ${attendantName}!`,
    });
  };

  const handleLogout = () => {
    if (currentAttendantId) {
      removeAttendant(currentAttendantId);
    }
    setIsLoggedIn(false);
    setAttendantName('');
    setDeskNumber('');
    setCurrentAttendantId('');
    
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleCallNext = () => {
    const ticket = callNextTicket(currentAttendantId, deskNumber);
    if (ticket) {
      toast({
        title: "Cliente chamado",
        description: `Senha ${ticket.number} chamada para mesa ${deskNumber}`,
      });
    } else {
      toast({
        title: "Fila vazia",
        description: "Não há clientes aguardando atendimento",
        variant: "destructive"
      });
    }
  };

  const handleCompleteAttendance = () => {
    const currentAttendant = attendants.find(a => a.id === currentAttendantId);
    if (currentAttendant?.currentTicket) {
      completeTicket(currentAttendant.currentTicket);
      toast({
        title: "Atendimento concluído",
        description: "Cliente atendido com sucesso!",
      });
    }
  };

  const waitingTickets = getWaitingTickets();
  const currentAttendant = attendants.find(a => a.id === currentAttendantId);
  const currentTicket = currentAttendant?.currentTicket 
    ? tickets.find(t => t.id === currentAttendant.currentTicket)
    : null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-primary flex items-center justify-center gap-2">
              <UserCheck className="w-7 h-7" />
              Login do Atendente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Atendente</Label>
              <Input
                id="name"
                type="text"
                value={attendantName}
                onChange={(e) => setAttendantName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            
            <div>
              <Label htmlFor="desk">Número da Mesa</Label>
              <Input
                id="desk"
                type="text"
                value={deskNumber}
                onChange={(e) => setDeskNumber(e.target.value)}
                placeholder="Ex: 01, 02, 03..."
              />
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full"
              size="lg"
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Painel do Atendente
            </h1>
            <p className="text-xl text-muted-foreground">
              {attendantName} - Mesa {deskNumber}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atendimento Atual */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <UserCheck className="w-7 h-7 text-primary" />
                Atendimento Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTicket ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-accent/10 border-2 border-accent/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-4xl font-bold text-accent mb-2">
                          {currentTicket.number}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{currentTicket.category}</span>
                          {currentTicket.isPriority && (
                            <Badge variant="secondary" className="bg-warning/10 text-warning">
                              <Star className="w-4 h-4 mr-1" />
                              Preferencial
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          Chamado às
                        </div>
                        <div className="font-semibold">
                          {currentTicket.calledAt?.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleCompleteAttendance}
                      className="w-full bg-accent hover:bg-accent/90"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Concluir Atendimento
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-xl text-muted-foreground mb-6">
                    Nenhum cliente em atendimento
                  </p>
                  <Button 
                    onClick={handleCallNext}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    disabled={waitingTickets.length === 0}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Chamar Próximo Cliente
                  </Button>
                  {waitingTickets.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Fila vazia
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas e Controles */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  Fila de Espera
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {waitingTickets.length}
                  </div>
                  <p className="text-muted-foreground">clientes aguardando</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferencial:</span>
                    <span className="font-semibold text-warning">
                      {waitingTickets.filter(t => t.isPriority).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Normal:</span>
                    <span className="font-semibold text-primary">
                      {waitingTickets.filter(t => !t.isPriority).length}
                    </span>
                  </div>
                </div>
                
                {!currentTicket && waitingTickets.length > 0 && (
                  <Button 
                    onClick={handleCallNext}
                    className="w-full mt-4"
                    size="lg"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Chamar Próximo
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Próximos na Fila</CardTitle>
              </CardHeader>
              <CardContent>
                {waitingTickets.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Fila vazia
                  </p>
                ) : (
                  <div className="space-y-3">
                    {waitingTickets.slice(0, 5).map((ticket, index) => (
                      <div 
                        key={ticket.id}
                        className="p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-primary">
                              {ticket.number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ticket.category}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {index + 1}º
                            </div>
                            {ticket.isPriority && (
                              <Star className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendant;