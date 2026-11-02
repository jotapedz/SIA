BEGIN;

-- caminho da foto no storage; discentes sem foto permanecem com null
ALTER TABLE public."Discente"
    ADD COLUMN IF NOT EXISTS foto_path text;

COMMIT;
