-- A tabela public."Perfil" ja existe e permanece como fonte dos dados do usuario.
-- O Supabase Auth armazena as credenciais; senha_hash nao deve ser usado para login.
ALTER TABLE public."Perfil"
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS perfil_auth_user_id_idx
  ON public."Perfil" (auth_user_id);

COMMENT ON COLUMN public."Perfil".auth_user_id IS
  'Identificador do usuario correspondente em auth.users.';

COMMENT ON COLUMN public."Perfil".senha_hash IS
  'Campo legado. As credenciais sao gerenciadas exclusivamente pelo Supabase Auth.';
