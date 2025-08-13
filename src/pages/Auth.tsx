import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const ADMIN_EMAIL = 'admin@sistema.com';
const ADMIN_PASSWORD = 'admin123';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/attendant');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      toast({
        title: 'Erro de Login',
        description: 'Email ou senha incorretos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error) {
        // If user doesn't exist, sign them up
        if (error.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
              emailRedirectTo: `${window.location.origin}/attendant`
            }
          });

          if (signUpError) {
            toast({
              title: 'Erro',
              description: signUpError.message,
              variant: 'destructive',
            });
            return;
          }

          toast({
            title: 'Sucesso',
            description: 'Admin criado com sucesso! Fazendo login...',
          });

          // Try to sign in again
          const { error: secondLoginError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          });

          if (secondLoginError) {
            toast({
              title: 'Erro',
              description: secondLoginError.message,
              variant: 'destructive',
            });
            return;
          }
        } else {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!',
      });

      navigate('/attendant');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado durante o login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Fila</CardTitle>
          <CardDescription>
            Acesso para Atendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold">Credenciais de Admin:</p>
            <p>Email: admin@sistema.com</p>
            <p>Senha: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}