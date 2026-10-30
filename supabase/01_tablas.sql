-- Che, on danse! · Paso 1: tablas de reservas
-- Se ejecuta una sola vez, en Supabase > SQL Editor.

-- Personas: los datos que pide el seguro del Liceo.
create table if not exists public.personas (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  apellido         text not null,
  dni              text unique,            -- vacío para quienes solo vienen al Brunch & Bal
  fecha_nacimiento date,
  contacto         text,                   -- WhatsApp o email
  creado           timestamptz not null default now()
);

-- Reservas: una fila por persona, actividad y fecha.
create table if not exists public.reservas (
  id         bigint generated always as identity primary key,
  persona_id uuid not null references public.personas(id) on delete cascade,
  tipo       text not null check (tipo in ('prueba', 'clase', 'brunch', 'session')),
  nivel      text check (nivel in ('principiantes', 'intermedios')),
  fecha      date not null,
  cantidad   int  not null default 1 check (cantidad between 1 and 20),
  creado     timestamptz not null default now(),
  unique (persona_id, tipo, fecha)
);
create index if not exists reservas_fecha_idx on public.reservas (fecha);

-- Quién puede ver la lista del seguro (página admin.html).
create table if not exists public.admins (
  email text primary key
);
insert into public.admins (email) values ('cheondanse@gmail.com') on conflict do nothing;

-- Nadie lee ni escribe estas tablas directamente desde el sitio:
-- todo pasa por las funciones del paso 2.
alter table public.personas enable row level security;
alter table public.reservas enable row level security;
alter table public.admins   enable row level security;
revoke all on public.personas, public.reservas, public.admins from anon, authenticated;
