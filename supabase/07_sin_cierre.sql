-- ===== Paso 7 · Un solo bloque: la inscripción del sábado ya no se cierra a las 13 h =====
-- Se puede reservar a cualquier hora; el sitio solo muestra un aviso después de las 13:30.
create or replace function public.reservar(p_persona uuid, p_tipo text, p_fecha date,
  p_nivel text default null, p_cantidad int default 1)
returns json language plpgsql security definer set search_path = public as $$
declare
  ahora timestamp := now() at time zone 'America/Argentina/Buenos_Aires';
  hoy   date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  p     personas%rowtype;
begin
  select * into p from personas where id = p_persona;
  if not found then raise exception 'No encontramos tu nombre.'; end if;
  if p_tipo is null or p_tipo not in ('prueba', 'clase', 'brunch', 'session') then raise exception 'Elegí una actividad.'; end if;
  if p_fecha is null or p_fecha < hoy or p_fecha > hoy + 120 then raise exception 'Elegí una fecha de las próximas semanas.'; end if;
  if p_tipo = 'brunch' then
    if extract(isodow from p_fecha) <> 7 then raise exception 'El Brunch & Bal es un domingo.'; end if;
    p_nivel := null;
    p_cantidad := least(greatest(coalesce(p_cantidad, 1), 1), 20);
  else
    if extract(isodow from p_fecha) <> 6 then raise exception 'Las clases son los sábados.'; end if;
    if p.dni is null or p.fecha_nacimiento is null then
      raise exception 'Para el seguro necesitamos tu DNI: usá «Primera clase gratis».';
    end if;
    if p_tipo in ('clase', 'prueba') and (p_nivel is null or p_nivel not in ('principiantes', 'intermedios')) then
      raise exception 'Elegí tu nivel.';
    end if;
    if p_tipo = 'session' then p_nivel := null; end if;
    p_cantidad := 1;
  end if;
  insert into reservas (persona_id, tipo, nivel, fecha, cantidad)
  values (p_persona, p_tipo, p_nivel, p_fecha, p_cantidad)
  on conflict (persona_id, tipo, fecha)
  do update set nivel = excluded.nivel, cantidad = excluded.cantidad, creado = now();
  return json_build_object('ok', true, 'nombre', p.nombre);
end $$;

grant execute on function public.reservar(uuid, text, date, text, int) to anon, authenticated;
