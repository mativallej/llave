-- Four example cars, so the channel has something to show before the real stock is loaded.
-- "(ejemplo)" goes in the model on purpose: no screenshot can be mistaken for real stock.
-- Prices are made up. They come down when the real stock goes up.

insert into public.auto (slug, marca, modelo, version, anio, km, precio, segmento, publicado) values
  ('toyota-corolla-xei-2019-ejemplo', 'Toyota', 'Corolla (ejemplo)', 'XEI', 2019, 95000, 24500000, 'sedan', true),
  ('volkswagen-amarok-highline-2020-ejemplo', 'Volkswagen', 'Amarok (ejemplo)', 'Highline', 2020, 82000, 41000000, 'pickup', true),
  ('renault-duster-privilege-2022-ejemplo', 'Renault', 'Duster (ejemplo)', 'Privilege', 2022, 45000, 27000000, 'suv', true),
  ('fiat-cronos-drive-2021-ejemplo', 'Fiat', 'Cronos (ejemplo)', 'Drive', 2021, 60000, 18500000, 'sedan', true)
on conflict (slug) do nothing;
