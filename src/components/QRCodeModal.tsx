import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueueTicket } from '@/store/queueStore';
import QRCode from 'qrcode';
import { QrCode, Clock, Hash, Star } from 'lucide-react';

interface QRCodeModalProps {
  ticket: QueueTicket;
  onClose: () => void;
}

export const QRCodeModal = ({ ticket, onClose }: QRCodeModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const ticketUrl = `${window.location.origin}/ticket/${ticket.id}`;
        const qrUrl = await QRCode.toDataURL(ticketUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1e40af',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    generateQRCode();
  }, [ticket.id]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-primary">
            Sua Senha de Atendimento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="text-5xl font-bold text-primary mb-2">
                  {ticket.number}
                </div>
                {ticket.isPriority && (
                  <Badge variant="secondary" className="bg-warning/10 text-warning">
                    <Star className="w-4 h-4 mr-1" />
                    Preferencial
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span>{ticket.category}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{ticket.createdAt.toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Escaneie o QR Code para acompanhar sua posição na fila
            </p>
            
            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <QrCode className="w-4 h-4" />
              <span>Use a câmera do seu celular</span>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full"
            size="lg"
          >
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};