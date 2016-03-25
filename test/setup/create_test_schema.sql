drop schema if exists test cascade;
create schema test authorization test_accounting_user;
grant all on schema test to test_accounting_user;

SET search_path = test;

CREATE TYPE estados as enum ('vacio','pendiente','ingresado');
ALTER type estados OWNER TO test_accounting_user;

CREATE TABLE asientos(
  asiento text primary key,
  fecha date not null,
  borrador boolean unique DEFAULT true,
  constraint "puede haber un solo asiento borrador" check (borrador=true)
);
ALTER TABLE asientos OWNER TO test_accounting_user;

CREATE TABLE movimientos(
  asiento text references asientos(asiento),
  id_movimiento text not null,
  fecha date  not null,
  subc text default '' not null,
  cuenta text not null,
  actor text,
  importe numeric not null, 
  producto text,
  cantidad numeric,
  precio numeric,
  porcentaje numeric,
  comprobante text,
  numero text,
  vencimiento date,
  firmante text,
  modif timestamp default current_timestamp,
  modiu text default user,
  primary key (asiento, id_movimiento)
);
ALTER TABLE movimientos OWNER TO test_accounting_user;

CREATE OR REPLACE FUNCTION id_movimientos_trg()
  RETURNS trigger 
  LANGUAGE plpgsql
  AS
$BODY$
DECLARE
  vCerrado boolean;
BEGIN
  SELECT borrador IS NOT TRUE INTO vCerrado
    FROM asientos
    WHERE asiento = new.asiento;
  IF vCerrado THEN
    RAISE 'El asiento % esta cerrado no se puede modificar', new.asiento;
  END IF;
  new.id_movimiento=new.cuenta
    ||coalesce('|a:'||new.actor,'')
    ||coalesce('|p:'||new.producto,'')
    ||coalesce('|$:'||new.precio,'')
    ||coalesce('|s:'||new.subc,'')
    ||coalesce('|c:'||new.comprobante,'')
    ||coalesce('|n:'||new.numero,'')
    ||coalesce('|f:'||new.firmante,'');
  RETURN new;
END;
$BODY$;
 
CREATE TRIGGER id_movimientos_trg
  BEFORE INSERT OR UPDATE
  ON movimientos
  FOR EACH ROW
  EXECUTE PROCEDURE id_movimientos_trg();

CREATE OR REPLACE FUNCTION balance_trg()
  RETURNS trigger 
  LANGUAGE plpgsql
  AS
$BODY$
DECLARE
  vAsientosDesbalanceados record;
  vMalos numeric;
BEGIN
  IF new.borrador THEN
  else
    FOR vAsientosDesbalanceados IN 
      SELECT asiento, NULLIF(subc,'')||':'||cuenta as cancelacion, sum(importe) as diferencia
        FROM movimientos
        WHERE asiento = new.asiento
        GROUP BY asiento, NULLIF(subc,'')||':'||cuenta
        HAVING sum(importe)<>0
    LOOP
      raise 'Asiento desbalanceado % % %', vAsientosDesbalanceados.asiento, vAsientosDesbalanceados.cancelacion, vAsientosDesbalanceados.diferencia;
    END LOOP;
  END IF;
  RETURN null;
END;
$BODY$;

CREATE TRIGGER balance_trg
  AFTER INSERT OR UPDATE
  ON asientos
  FOR EACH ROW
  EXECUTE PROCEDURE balance_trg();

-- insert into movimientos(asiento, cuenta, importe, fecha) values ('1', 'INICIO', 2, '2016/1/1');