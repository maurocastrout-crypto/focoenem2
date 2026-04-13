-- FocoENEM 2.0 — Schema completo
-- Cole no SQL Editor do Supabase e clique em Run

create extension if not exists "uuid-ossp";

-- Tabela de usuários
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text not null,
  sobrenome text not null,
  role text not null check (role in ('aluno', 'responsavel')),
  aluno_id uuid references public.users(id),
  responsavel_id uuid references public.users(id),
  codigo_convite text unique default substr(md5(random()::text), 1, 8),
  meta_horas_dia integer default 3,
  horario_resumo text default '20:00',
  telefone text,
  plano_ativo boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  device_id text,
  created_at timestamptz default now()
);

-- Sessões de estudo
create table if not exists public.sessoes (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  area text not null,
  topico text not null,
  status text default 'em_andamento' check (status in ('em_andamento', 'pausada', 'valida', 'invalida')),
  inicio timestamptz default now(),
  fim timestamptz,
  duracao_segundos integer default 0,
  created_at timestamptz default now()
);

-- Mini-provas
create table if not exists public.mini_provas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  sessao_id uuid references public.sessoes(id),
  total_questoes integer not null,
  acertos integer not null,
  percentual_acerto integer not null,
  respostas jsonb default '[]',
  created_at timestamptz default now()
);

-- Questões do ENEM
create table if not exists public.questoes (
  id uuid primary key default uuid_generate_v4(),
  area text not null,
  topico text not null,
  enunciado text not null,
  opcao_a text not null,
  opcao_b text not null,
  opcao_c text not null,
  opcao_d text not null,
  opcao_e text,
  resposta_correta text not null,
  ano integer,
  dificuldade text default 'medio',
  created_at timestamptz default now()
);

-- Progresso geral
create table if not exists public.progresso_geral (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid unique references public.users(id) on delete cascade,
  streak_atual integer default 0,
  streak_maximo integer default 0,
  total_horas numeric default 0,
  total_sessoes integer default 0,
  ultimo_estudo date,
  updated_at timestamptz default now()
);

-- Progresso por área
create table if not exists public.progresso_areas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  area text not null,
  percentual integer default 0,
  total_questoes integer default 0,
  acertos integer default 0,
  updated_at timestamptz default now(),
  unique(aluno_id, area)
);

-- Alertas de sessão
create table if not exists public.alertas_sessao (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  sessao_id uuid references public.sessoes(id),
  tipo text not null,
  descricao text,
  timestamp timestamptz default now()
);

-- Diagnósticos da IA
create table if not exists public.diagnosticos (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  areas_fracas text[] default '{}',
  mensagem_aluno text,
  mensagem_responsavel text,
  plano_recuperacao jsonb,
  created_at timestamptz default now()
);

-- Guia para pais
create table if not exists public.guia_pais (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  mensagem text,
  elogiar text,
  abordar_com_cuidado text,
  created_at timestamptz default now()
);

-- Redações corrigidas
create table if not exists public.redacoes (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references public.users(id) on delete cascade,
  tema text not null,
  texto text not null,
  nota_total integer,
  competencias jsonb,
  feedback_geral text,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.sessoes enable row level security;
alter table public.mini_provas enable row level security;
alter table public.questoes enable row level security;
alter table public.progresso_geral enable row level security;
alter table public.progresso_areas enable row level security;
alter table public.alertas_sessao enable row level security;
alter table public.diagnosticos enable row level security;
alter table public.guia_pais enable row level security;
alter table public.redacoes enable row level security;

-- Policies
create policy "users_own" on public.users for all using (auth.uid() = id);
create policy "users_linked" on public.users for select using (
  auth.uid() = id or 
  auth.uid() = aluno_id or 
  auth.uid() = responsavel_id
);

create policy "sessoes_own" on public.sessoes for all using (auth.uid() = aluno_id);
create policy "sessoes_resp" on public.sessoes for select using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = sessoes.aluno_id)
);

create policy "provas_own" on public.mini_provas for all using (auth.uid() = aluno_id);
create policy "provas_resp" on public.mini_provas for select using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = mini_provas.aluno_id)
);

create policy "questoes_public" on public.questoes for select using (true);

create policy "progresso_own" on public.progresso_geral for all using (auth.uid() = aluno_id);
create policy "progresso_resp" on public.progresso_geral for select using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = progresso_geral.aluno_id)
);

create policy "areas_own" on public.progresso_areas for all using (auth.uid() = aluno_id);
create policy "alertas_own" on public.alertas_sessao for all using (auth.uid() = aluno_id);
create policy "alertas_resp" on public.alertas_sessao for select using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = alertas_sessao.aluno_id)
);

create policy "diag_own" on public.diagnosticos for all using (auth.uid() = aluno_id);
create policy "diag_resp" on public.diagnosticos for select using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = diagnosticos.aluno_id)
);

create policy "guia_resp" on public.guia_pais for all using (
  exists (select 1 from public.users where id = auth.uid() and aluno_id = guia_pais.aluno_id)
);

create policy "redacoes_own" on public.redacoes for all using (auth.uid() = aluno_id);

-- Seed: 10 questões do ENEM
insert into public.questoes (area, topico, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, ano, dificuldade) values
('Matemática', 'Funções', 'Uma função f(x) = 2x + 3. Qual é o valor de f(4)?', '8', '10', '11', '12', '14', 'C', 2022, 'facil'),
('Matemática', 'Geometria', 'Um quadrado tem lado de 5 cm. Qual é a sua área?', '10 cm²', '20 cm²', '25 cm²', '30 cm²', '15 cm²', 'C', 2022, 'facil'),
('Matemática', 'Probabilidade', 'Num saco com 3 bolas vermelhas e 2 azuis, qual a probabilidade de sortear uma azul?', '1/5', '2/5', '3/5', '2/3', '1/3', 'B', 2021, 'medio'),
('Linguagens', 'Interpretação de Texto', 'A norma culta da língua portuguesa é aquela:', 'falada por todos os brasileiros', 'utilizada em situações formais e acadêmicas', 'exclusiva da literatura clássica', 'imposta pelo governo federal', 'usada apenas em Portugal', 'B', 2022, 'facil'),
('Linguagens', 'Gramática', 'Em "Os alunos foram à escola", a palavra "à" é resultado de:', 'Crase obrigatória', 'Crase facultativa', 'Crase proibida', 'Erro gramatical', 'Hífen', 'A', 2021, 'medio'),
('Ciências da Natureza', 'Biologia', 'A fotossíntese é o processo pelo qual as plantas:', 'respiram e liberam CO2', 'convertem luz solar em energia química', 'absorvem água pelo caule', 'reproduzem-se assexuadamente', 'eliminam toxinas', 'B', 2022, 'facil'),
('Ciências da Natureza', 'Química', 'O número atômico de um elemento indica:', 'o número de nêutrons', 'o número de prótons', 'a massa atômica', 'o número de elétrons na camada externa', 'a valência', 'B', 2021, 'facil'),
('Ciências da Natureza', 'Física', 'Segundo a 1ª Lei de Newton, um corpo em repouso:', 'acelera naturalmente', 'permanece em repouso se não houver força resultante', 'sempre se move em círculos', 'perde massa ao longo do tempo', 'atrai outros corpos', 'B', 2022, 'facil'),
('Ciências Humanas', 'História', 'A Revolução Industrial iniciou-se no século XVIII em:', 'França', 'Alemanha', 'Inglaterra', 'Estados Unidos', 'Itália', 'C', 2021, 'facil'),
('Ciências Humanas', 'Geografia', 'O fenômeno El Niño é causado pelo aquecimento anômalo das águas do:', 'Oceano Atlântico Norte', 'Oceano Índico', 'Oceano Pacífico', 'Mar do Caribe', 'Oceano Ártico', 'C', 2022, 'medio');
