import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tablet, Smartphone, Monitor, UserCheck } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Sistema de Fila de Atendimento
          </h1>
          <p className="text-xl text-muted-foreground">
            Escolha o módulo desejado para acessar o sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Tablet className="w-16 h-16 mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl text-primary">Totem</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Interface para clientes entrarem na fila de atendimento
              </p>
              <Button asChild className="w-full">
                <Link to="/totem">
                  Acessar Totem
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Smartphone className="w-16 h-16 mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl text-primary">Cliente Mobile</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Visualização da posição na fila via QR Code
              </p>
              <div className="text-sm text-muted-foreground">
                Escaneie o QR Code do seu ticket
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <Monitor className="w-16 h-16 mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl text-primary">Painel</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Painel para visualizar chamadas e fila em tempo real
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/display">
                  Ver Painel
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <UserCheck className="w-16 h-16 mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-xl text-primary">Atendente</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Interface para atendentes gerenciarem os atendimentos
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/auth">
                  Login Atendente
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Como usar o sistema?
              </h3>
              <div className="text-left space-y-2 text-muted-foreground">
                <p><strong>1.</strong> Clientes usam o <strong>Totem</strong> para gerar sua senha</p>
                <p><strong>2.</strong> Escaneiam o QR Code para acompanhar a fila no celular</p>
                <p><strong>3.</strong> O <strong>Painel</strong> exibe as chamadas em tempo real</p>
                <p><strong>4.</strong> <strong>Atendentes</strong> fazem login e gerenciam os atendimentos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
