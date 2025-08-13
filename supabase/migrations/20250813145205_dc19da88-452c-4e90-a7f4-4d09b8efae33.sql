-- Create queue system tables
CREATE TYPE public.category_type AS ENUM ('geral', 'preferencial', 'prioritario');
CREATE TYPE public.ticket_status AS ENUM ('waiting', 'called', 'being_served', 'completed', 'cancelled');
CREATE TYPE public.attendant_status AS ENUM ('available', 'busy', 'offline');

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type category_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendants/Desks table
CREATE TABLE public.attendants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  desk_number INTEGER NOT NULL UNIQUE,
  status attendant_status NOT NULL DEFAULT 'offline',
  current_ticket_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  is_preferential BOOLEAN NOT NULL DEFAULT false,
  status ticket_status NOT NULL DEFAULT 'waiting',
  attendant_id UUID REFERENCES public.attendants(id),
  called_at TIMESTAMP WITH TIME ZONE,
  served_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Queue position function
CREATE OR REPLACE FUNCTION get_queue_position(ticket_id UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
  ticket_record RECORD;
BEGIN
  -- Get ticket details
  SELECT * INTO ticket_record FROM public.tickets WHERE id = ticket_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Count tickets ahead in queue
  SELECT COUNT(*) + 1 INTO position
  FROM public.tickets t
  WHERE t.status = 'waiting'
    AND t.created_at < ticket_record.created_at
    AND (
      -- Preferential tickets go first
      (ticket_record.is_preferential = false AND t.is_preferential = true)
      OR 
      -- Same priority, earlier creation time
      (ticket_record.is_preferential = t.is_preferential AND t.created_at < ticket_record.created_at)
    );
  
  RETURN position;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO public.categories (name, type) VALUES
  ('Atendimento Geral', 'geral'),
  ('Atendimento Preferencial', 'preferencial'),
  ('Atendimento Prioritário', 'prioritario');

-- Insert sample attendants/desks
INSERT INTO public.attendants (name, desk_number) VALUES
  ('Mesa 1', 1),
  ('Mesa 2', 2),
  ('Mesa 3', 3),
  ('Mesa 4', 4);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and attendants (needed for totem)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Attendants are viewable by everyone" ON public.attendants FOR SELECT USING (true);
CREATE POLICY "Tickets are viewable by everyone" ON public.tickets FOR SELECT USING (true);

-- Allow inserts for tickets (totem needs to create tickets)
CREATE POLICY "Anyone can create tickets" ON public.tickets FOR INSERT WITH CHECK (true);

-- Allow updates for attendants and tickets (for attendant operations)
CREATE POLICY "Anyone can update attendants" ON public.attendants FOR UPDATE USING (true);
CREATE POLICY "Anyone can update tickets" ON public.tickets FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_attendants_updated_at
  BEFORE UPDATE ON public.attendants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();