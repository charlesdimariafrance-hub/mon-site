-- Che, on danse! · Paso 3: funciones de la página admin.html
-- Solo responden a una cuenta conectada cuyo email está en la tabla admins.

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- Fechas con reservas, para el menú de la página admin.
create or replace function public.admin_fechas()
returns table (fecha date, brunch boolean, personas bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  return query
    select r.fecha, r.tipo = 'brunch', count(distinct r.persona_id)
    from reservas r
    group by r.fecha, r.tipo = 'brunch'
    order by r.fecha desc;
end $$;

-- Lista de un sábado (seguro) o de un domingo (Brunch & Bal).
create or replace function public.admin_lista(p_fecha date)
returns table (nombre text, apellido text, dni text, fecha_nacimiento date,
               contacto text, actividad text, cantidad int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'No autorizado.'; end if;
  return query
    select p.nombre, p.apellido, p.dni, p.fecha_nacimiento, p.contacto,
           string_agg(case r.tipo
                        when 'prueba'  then 'Primera clase'
                        when 'clase'   then 'Clase ' || coalesce(r.nivel, '')
                        when 'session' then 'SessionTradBA'
                        else 'Brunch & Bal' end, ', ' order by r.tipo),
           max(r.cantidad)
    from reservas r join personas p on p.id = r.persona_id
    where r.fecha = p_fecha
    group by p.id
    order by public.normalizar(p.apellido), public.normalizar(p.nombre);
end $$;

revoke execute on function public.es_admin(), public.admin_fechas(), public.admin_lista(date) from public, anon;
grant execute on function public.es_admin(), public.admin_fechas(), public.admin_lista(date) to authenticated;
