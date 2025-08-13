import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseQueue, Attendant as AttendantType } from '@/hooks/useSupabaseQueue';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Phone, CheckCircle, Clock, Star, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Attendant = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<AttendantType | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    attendants, 
    tickets,
    callNextTicket,
    startService,
    completeService,
    setAttendantStatus,
    isLoading
  } = useSupabaseQueue();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSelectAttendant = async (attendantId: string) => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (attendant) {
      setSelectedAttendant(attendant);
      await setAttendantStatus(attendantId, 'available');
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo à ${attendant.name}!`,
      });
    }
  };

  const handleLogout = async () => {
    if (selectedAttendant) {
      await setAttendantStatus(selectedAttendant.id, 'offline');
    }
    
    await supabase.auth.signOut();
    setSelectedAttendant(null);
    setIsAuthenticated(false);
    navigate('/auth');
    
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleCallNext = async () => {
    if (!selectedAttendant) return;
    
    const ticket = await callNextTicket(selectedAttendant.id);
    if (ticket) {
      toast({
        title: "Cliente chamado",
        description: `Senha ${ticket.number} chamada para ${selectedAttendant.name}`,
      });
    }
  };

  const handleStartService = async () => {
    if (!selectedAttendant?.current_ticket_id) return;
    
    await startService(selectedAttendant.current_ticket_id, selectedAttendant.id);
  };

  const handleCompleteService = async () => {
    if (!selectedAttendant?.current_ticket_id) return;
    
    await completeService(selectedAttendant.current_ticket_id, selectedAttendant.id);
  };

  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const currentTicket = selectedAttendant?.current_ticket_id 
    ? tickets.find(t => t.id === selectedAttendant.current_ticket_id)
    : null;

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-xl">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedAttendant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-primary flex items-center justify-center gap-2">
              <UserCheck className="w-7 h-7" />
              Selecionar Mesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Escolha sua mesa de atendimento:</label>
              <Select onValueChange={handleSelectAttendant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {attendants.map((attendant) => (
                    <SelectItem key={attendant.id} value={attendant.id}>
                      {attendant.name} {attendant.status === 'busy' ? '(Ocupada)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
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
              {selectedAttendant.name}
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
                          <span className="text-lg font-semibold">{currentTicket.category?.name}</span>
                          {currentTicket.is_preferential && (
                            <Badge variant="secondary" className="bg-warning/10 text-warning">
                              <Star className="w-4 h-4 mr-1" />
                              Preferencial
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          Status
                        </div>
                        <div className="font-semibold">
                          {currentTicket.status === 'called' ? 'Chamado' : 
                           currentTicket.status === 'being_served' ? 'Em Atendimento' : 'Aguardando'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {currentTicket.status === 'called' && (
                        <Button 
                          onClick={handleStartService}
                          className="w-full bg-primary hover:bg-primary/90"
                          size="lg"
                        >
                          <UserCheck className="w-5 h-5 mr-2" />
                          Iniciar Atendimento
                        </Button>
                      )}
                      
                      {currentTicket.status === 'being_served' && (
                        <Button 
                          onClick={handleCompleteService}
                          className="w-full bg-accent hover:bg-accent/90"
                          size="lg"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Concluir Atendimento
                        </Button>
                      )}
                    </div>
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
                      {waitingTickets.filter(t => t.is_preferential).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Normal:</span>
                    <span className="font-semibold text-primary">
                      {waitingTickets.filter(t => !t.is_preferential).length}
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
                              {ticket.category?.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {index + 1}º
                            </div>
                            {ticket.is_preferential && (
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