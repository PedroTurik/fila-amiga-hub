import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabaseQueue } from '@/hooks/useSupabaseQueue';
import { QRCodeModal } from '@/components/QRCodeModal';
import { Users, Clock, Star } from 'lucide-react';

const Totem = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isPriority, setIsPriority] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  
  const { categories, tickets, createTicket, isLoading } = useSupabaseQueue();
  const waitingCount = tickets.filter(t => t.status === 'waiting').length;

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePrioritySelect = (priority: boolean) => {
    setIsPriority(priority);
  };

  const handleGenerateTicket = async () => {
    if (!selectedCategory) return;
    
    const ticket = await createTicket(selectedCategory, isPriority);
    if (ticket) {
      setGeneratedTicket(ticket);
      setShowQRModal(true);
    }
  };

  const handleBackToStart = () => {
    setSelectedCategory('');
    setIsPriority(false);
    setShowQRModal(false);
    setGeneratedTicket(null);
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Sistema de Atendimento
            </h1>
            <p className="text-xl text-muted-foreground">
              Selecione a categoria de atendimento desejada
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-lg">
                <Users className="w-6 h-6 text-primary" />
                <span className="font-semibold">{waitingCount}</span>
                <span className="text-muted-foreground">pessoas na fila</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl text-primary">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="p-8">
                    <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Toque aqui para selecionar
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToStart}
            className="mb-6"
          >
            ← Voltar às Categorias
          </Button>
          
          <h1 className="text-4xl font-bold text-primary mb-4">
            {categories.find(c => c.id === selectedCategory)?.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            Você tem direito a atendimento preferencial?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              isPriority === false ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
            }`}
            onClick={() => handlePrioritySelect(false)}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary flex items-center justify-center gap-3">
                <Users className="w-8 h-8" />
                Atendimento Normal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center p-8">
              <p className="text-lg text-muted-foreground mb-6">
                Atendimento por ordem de chegada
              </p>
              <div className="text-sm text-muted-foreground">
                Tempo estimado: 15-30 minutos
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              isPriority === true ? 'border-warning bg-warning/5' : 'hover:border-warning/50'
            }`}
            onClick={() => handlePrioritySelect(true)}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-warning flex items-center justify-center gap-3">
                <Star className="w-8 h-8" />
                Atendimento Preferencial
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center p-8">
              <p className="text-lg text-muted-foreground mb-4">
                Para idosos, gestantes, pessoas com deficiência
              </p>
              <Badge variant="secondary" className="mb-4">
                Prioridade na fila
              </Badge>
              <div className="text-sm text-muted-foreground">
                Tempo estimado: 5-15 minutos
              </div>
            </CardContent>
          </Card>
        </div>

        {(isPriority === true || isPriority === false) && (
          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={handleGenerateTicket}
              className="text-xl px-12 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              Gerar Senha de Atendimento
            </Button>
          </div>
        )}

        {showQRModal && generatedTicket && (
          <QRCodeModal 
            ticket={generatedTicket}
            onClose={handleBackToStart}
          />
        )}
      </div>
    </div>
  );
};

export default Totem;