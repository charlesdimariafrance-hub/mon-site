-- ===== Paso 6 · Bloque A: tabla de las clases online de los lunes =====
-- Una fila por persona, lunes y horario.
create table if not exists public.online_reservas (
  id      bigint generated always as identity primary key,
  grupo   uuid not null,                -- las filas enviadas juntas en un mismo formulario
  nombre  text not null,
  tel     text not null,
  perfil  text not null check (perfil in ('alumno', 'profe')),
  fecha   date not null,
  hora    text not null,
  pagado  boolean not null default false,
  medio   text check (medio in ('transferencia', 'mercadopago', 'revolut')),
  creado  timestamptz not null default now()
);
create index if not exists online_fecha_idx on public.online_reservas (fecha, hora);
alter table public.online_reservas enable row level security;
revoke all on public.online_reservas from anon, authenticated;

-- ===== Paso 6 · Bloque B: funciones públicas (formulario y contadores) =====
create or replace function public.online_reservar(p_nombre text, p_tel text, p_perfil text, p_celdas jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare g uuid := gen_random_uuid(); c jsonb; n int := 0;
begin
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_tel), '') = '' then raise exception 'Faltan el nombre o el teléfono.'; end if;
  if jsonb_array_length(p_celdas) > 16 then raise exception 'Demasiados lunes.'; end if;
  for c in select * from jsonb_array_elements(p_celdas) loop
    if extract(isodow from (c->>'fecha')::date) <> 1 or (c->>'fecha')::date < current_date then continue; end if;
    insert into online_reservas (grupo, nombre, tel, perfil, fecha, hora)
    values (g, left(trim(p_nombre), 120), left(trim(p_tel), 60), case when p_perfil = 'profe' then 'profe' else 'alumno' end,
            (c->>'fecha')::date, left(c->>'hora', 5));
    n := n + 1;
  end loop;
  return n;
end $$;

-- Solo números por lunes y horario: nadie ve nombres ni teléfonos.
create or replace function public.online_contadores()
returns table (fecha date, hora text, reservados bigint, pagados bigint)
language sql stable security definer set search_path = public as $$
  select fecha, hora, count(*), count(*) filter (where pagado)
  from online_reservas where fecha >= current_date group by fecha, hora
$$;

revoke execute on function public.online_reservar(text, text, text, jsonb), public.online_contadores() from public;
grant execute on function public.online_reservar(text, text, text, jsonb), public.online_contadores() to anon, authenticated;

-- ===== Paso 6 · Bloque C: funciones de Charles (página online-admin.html) =====
create or replace function public.admin_online_lista()
returns table (id bigint, grupo uuid, nombre text, tel text, perfil text, fecha date, hora text, pagado boolean, medio text, creado timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  return query select o.id, o.grupo, o.nombre, o.tel, o.perfil, o.fecha, o.hora, o.pagado, o.medio, o.creado
    from online_reservas o where o.fecha >= current_date - 7 order by o.fecha, o.hora, o.nombre;
end $$;

create or replace function public.admin_online_pago(p_grupo uuid, p_pagado boolean, p_medio text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  update online_reservas set pagado = p_pagado, medio = case when p_pagado then p_medio end where grupo = p_grupo;
end $$;

create or replace function public.admin_online_borrar(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  delete from online_reservas where id = p_id;
end $$;

revoke execute on function public.admin_online_lista(), public.admin_online_pago(uuid, boolean, text), public.admin_online_borrar(bigint) from public, anon;
grant execute on function public.admin_online_lista(), public.admin_online_pago(uuid, boolean, text), public.admin_online_borrar(bigint) to authenticated;
