-- Two business values that were outside config: the week's capacity and the contact window's wording.

-- citas_por_semana: completed visits a week before the queue builds up. A whole number, changed without a deploy.
alter table public.config add constraint config_citas_por_semana_entero check (
  clave <> 'citas_por_semana' or valor ~ '^[1-9][0-9]{0,2}$'
);

insert into public.config (clave, valor, nota) values
  ('citas_por_semana', '15',
   'Cuántas citas cumplidas entran en una semana sin acumular cola. Cuando la semana llega a este número, el tablero avisa que hay que frenar los ads. Un número entero.')
on conflict (clave) do nothing;

-- plazo_contacto: written now, shown only with Falkenberg's guarantees on, because the 48 hours are one of the five.
update public.config
set nota = 'La frase del plazo de contacto. Va después de "Falkenberg lo revisa y te escribe por WhatsApp." en la pantalla de pedido enviado. Se muestra solo con las garantías de Falkenberg prendidas: el plazo de 48 horas es una de las cinco.'
where clave = 'plazo_contacto';

update public.config
set valor = 'Lo hace dentro de las 48 horas hábiles.'
where clave = 'plazo_contacto' and valor = '';
