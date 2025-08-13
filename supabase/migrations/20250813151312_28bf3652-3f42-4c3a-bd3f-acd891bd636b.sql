-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION get_queue_position(ticket_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;