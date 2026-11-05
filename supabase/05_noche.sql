-- ===== Paso 5 · Bloque A: tabla de reservas de la Noche de Danzas Francesas =====
-- Una fila por reserva (una persona puede reservar varios lugares).
create table if not exists public.noche_reservas (
  id      bigint generated always as identity primary key,
  nombre  text not null,
  tel     text not null,
  lugares int  not null default 1 check (lugares between 1 and 20),
  pagado  boolean not null default false,
  medio   text check (medio in ('transferencia', 'mercadopago')),
  creado  timestamptz not null default now()
);
alter table public.noche_reservas enable row level security;
revoke all on public.noche_reservas from anon, authenticated;

-- ===== Paso 5 · Bloque B: funciones públicas (formulario y contadores) =====
create or replace function public.noche_reservar(p_nombre text, p_tel text, p_lugares int)
returns bigint language plpgsql security definer set search_path = public as $$
declare nuevo bigint;
begin
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_tel), '') = '' then
    raise exception 'Faltan el nombre o el teléfono.';
  end if;
  insert into noche_reservas (nombre, tel, lugares)
  values (left(trim(p_nombre), 120), left(trim(p_tel), 60), greatest(1, least(coalesce(p_lugares, 1), 20)))
  returning id into nuevo;
  return nuevo;
end $$;

-- Solo números: nadie ve nombres ni teléfonos.
create or replace function public.noche_contadores()
returns table (reservados bigint, pagados bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(lugares), 0), coalesce(sum(lugares) filter (where pagado), 0)
  from noche_reservas
$$;

revoke execute on function public.noche_reservar(text, text, int), public.noche_contadores() from public;
grant execute on function public.noche_reservar(text, text, int), public.noche_contadores() to anon, authenticated;

-- ===== Paso 5 · Bloque C: funciones de Charles (página noche-admin.html) =====
create or replace function public.admin_noche_lista()
returns table (id bigint, nombre text, tel text, lugares int, pagado boolean, medio text, creado timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  return query select n.id, n.nombre, n.tel, n.lugares, n.pagado, n.medio, n.creado
    from noche_reservas n order by n.creado desc;
end $$;

create or replace function public.admin_noche_pago(p_id bigint, p_pagado boolean, p_medio text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  update noche_reservas set pagado = p_pagado, medio = case when p_pagado then p_medio end where id = p_id;
end $$;

create or replace function public.admin_noche_borrar(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  delete from noche_reservas where id = p_id;
end $$;

revoke execute on function public.admin_noche_lista(), public.admin_noche_pago(bigint, boolean, text), public.admin_noche_borrar(bigint) from public, anon;
grant execute on function public.admin_noche_lista(), public.admin_noche_pago(bigint, boolean, text), public.admin_noche_borrar(bigint) to authenticated;
