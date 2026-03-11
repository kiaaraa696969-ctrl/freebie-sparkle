
-- Add slug column
ALTER TABLE public.accounts ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX accounts_slug_unique ON public.accounts (slug);

-- Generate slugs for existing rows
UPDATE public.accounts
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || left(id::text, 8);
