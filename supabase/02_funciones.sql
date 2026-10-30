-- Che, on danse! · Paso 2: funciones que usa el formulario del sitio
-- Se puede volver a ejecutar sin problema (reemplaza las funciones).

-- Minúsculas y sin acentos, para buscar «lucia» y encontrar «Lucía».
create or replace function public.normalizar(t text) returns text
language sql immutable as $$
  select regexp_replace(lower(trim(translate(coalesce(t, ''),
    'ÁÀÂÄÃáàâäãÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÑñÇç',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'))), '\s+', ' ', 'g')
$$;

-- Búsqueda por nombre: devuelve solo el nombre a mostrar (con el apellido
-- únicamente si hay otra persona con el mismo nombre). Nunca DNI ni contacto.
-- p_para = 'clase' solo lista a quienes ya dieron DNI y fecha de nacimiento.
create or replace function public.buscar_personas(p_texto text, p_para text default 'clase')
returns table (id uuid, etiqueta text)
language sql stable security definer set search_path = public as $$
  with q as (select regexp_replace(normalizar(p_texto), '[^a-z ]', '', 'g') as t),
  base as (
    select p.id, p.nombre, p.apellido, normalizar(p.nombre) as nn
    from personas p
    where p_para = 'brunch' or (p.dni is not null and p.fecha_nacimiento is not null)
  ),
  dup as (select nn, count(*) as c from base group by nn)
  select b.id, case when d.c > 1 then b.nombre || ' ' || b.apellido else b.nombre end
  from base b join dup d using (nn), q
  where length(q.t) >= 2 and (b.nn like q.t || '%' or b.nn like '% ' || q.t || '%')
  order by 2
  limit 15
$$;

-- Reserva para una persona ya registrada.
create or replace function public.reservar(
  p_persona uuid, p_tipo text, p_fecha date,
  p_nivel text default null, p_cantidad int default 1)
returns json
language plpgsql security definer set search_path = public as $$
declare
  ahora timestamp := now() at time zone 'America/Argentina/Buenos_Aires';
  hoy   date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  p     personas%rowtype;
begin
  select * into p from personas where id = p_persona;
  if not found then raise exception 'No encontramos tu nombre.'; end if;
  if p_tipo is null or p_tipo not in ('prueba', 'clase', 'brunch', 'session') then
    raise exception 'Elegí una actividad.';
  end if;
  if p_fecha is null or p_fecha < hoy or p_fecha > hoy + 120 then
    raise exception 'Elegí una fecha de las próximas semanas.';
  end if;

  if p_tipo = 'brunch' then
    if extract(isodow from p_fecha) <> 7 then raise exception 'El Brunch & Bal es un domingo.'; end if;
    p_nivel := null;
    p_cantidad := least(greatest(coalesce(p_cantidad, 1), 1), 20);
  else
    if extract(isodow from p_fecha) <> 6 then raise exception 'Las clases son los sábados.'; end if;
    -- El sábado después de las 13 h la lista del seguro ya está cerrada.
    if p_fecha = hoy and extract(hour from ahora) >= 13 then raise exception 'CERRADO_HOY'; end if;
    if p.dni is null or p.fecha_nacimiento is null then
      raise exception 'Para el seguro necesitamos tu DNI: usá «Primera clase gratis».';
    end if;
    if p_tipo = 'clase' and (p_nivel is null or p_nivel not in ('principiantes', 'intermedios')) then
      raise exception 'Elegí tu nivel.';
    end if;
    if p_tipo <> 'clase' then p_nivel := null; end if;
    p_cantidad := 1;
  end if;

  insert into reservas (persona_id, tipo, nivel, fecha, cantidad)
  values (p_persona, p_tipo, p_nivel, p_fecha, p_cantidad)
  on conflict (persona_id, tipo, fecha)
  do update set nivel = excluded.nivel, cantidad = excluded.cantidad, creado = now();

  return json_build_object('ok', true, 'nombre', p.nombre);
end $$;

-- Primera vez: registra a la persona (o la reconoce por su DNI) y reserva.
create or replace function public.inscribir(
  p_nombre text, p_apellido text, p_dni text, p_fecha_nacimiento date, p_contacto text,
  p_tipo text, p_fecha date, p_nivel text default null, p_cantidad int default 1)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid;
  v_nombre   text := regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_apellido text := regexp_replace(trim(coalesce(p_apellido, '')), '\s+', ' ', 'g');
  v_contacto text := nullif(trim(coalesce(p_contacto, '')), '');
  v_dni      text := nullif(upper(regexp_replace(coalesce(p_dni, ''), '[^0-9A-Za-z]', '', 'g')), '');
begin
  if v_nombre = '' or v_apellido = '' then raise exception 'Completá tu nombre y tu apellido.'; end if;
  if length(v_nombre) > 60 or length(v_apellido) > 60 or length(coalesce(v_contacto, '')) > 120 then
    raise exception 'Algún dato es demasiado largo.';
  end if;
  if v_contacto is null then raise exception 'Dejanos tu WhatsApp o tu email.'; end if;
  if p_tipo <> 'brunch' then
    if v_dni is null or length(v_dni) not between 6 and 12 then raise exception 'Revisá tu DNI.'; end if;
    if p_fecha_nacimiento is null or p_fecha_nacimiento < date '1915-01-01'
       or p_fecha_nacimiento > current_date - 365 * 3 then
      raise exception 'Revisá tu fecha de nacimiento.';
    end if;
  else
    v_dni := null;
  end if;

  if v_dni is not null then
    select id into v_id from personas where dni = v_dni;
  end if;
  if v_id is null then
    -- Quien vino al Brunch sin DNI y ahora viene a clase: se completa su ficha.
    select id into v_id from personas
    where (v_dni is null or dni is null)
      and normalizar(nombre) = normalizar(v_nombre) and normalizar(apellido) = normalizar(v_apellido)
    order by dni nulls last limit 1;
  end if;

  if v_id is null then
    insert into personas (nombre, apellido, dni, fecha_nacimiento, contacto)
    values (v_nombre, v_apellido, v_dni, p_fecha_nacimiento, v_contacto)
    returning id into v_id;
  else
    update personas set
      dni = coalesce(dni, v_dni),
      fecha_nacimiento = coalesce(fecha_nacimiento, p_fecha_nacimiento),
      contacto = v_contacto
    where id = v_id;
  end if;

  return reservar(v_id, p_tipo, p_fecha, p_nivel, p_cantidad);
end $$;

-- Para participantes.html: solo nombre e inicial del apellido.
drop function if exists public.lista_inscriptos(date);
drop function if exists public.lista_inscriptos(text);
create function public.lista_inscriptos(p_fecha date)
returns table (nombre_apellido text)
language sql stable security definer set search_path = public as $$
  select distinct p.nombre || ' ' || left(p.apellido, 1) || '.'
  from reservas r join personas p on p.id = r.persona_id
  where r.fecha = p_fecha and r.tipo <> 'brunch'
$$;

grant execute on function
  public.buscar_personas(text, text),
  public.reservar(uuid, text, date, text, int),
  public.inscribir(text, text, text, date, text, text, date, text, int),
  public.lista_inscriptos(date)
to anon, authenticated;
