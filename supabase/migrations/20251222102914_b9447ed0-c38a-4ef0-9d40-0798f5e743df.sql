-- Add status column to track diagnostic progress
ALTER TABLE public.diagnostics 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'started';

-- Add index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_diagnostics_status ON public.diagnostics(status);

-- Update existing rows to have 'completed' status (they were saved at the end)
UPDATE public.diagnostics SET status = 'completed' WHERE status IS NULL OR status = 'started';