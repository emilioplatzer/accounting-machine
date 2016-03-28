CREATE TYPE estado_borrador as enum ('borrador');
-- ALTER type estados_borrador OWNER TO test_accounting_user;

CREATE TABLE asientos(
  asiento text primary key,
  fecha date not null,
  observaciones text,
  borrador estado_borrador unique DEFAULT 'borrador'::estado_borrador,
  modif timestamp default current_timestamp,
  modiu text default user,
  constraint "puede haber un solo asiento borrador" check (borrador='borrador'::estado_borrador)
);
-- ALTER TABLE asientos OWNER TO test_accounting_user;

CREATE TABLE cuentas(
  cuenta          text    primary key,
  con_actor       boolean default true,
  con_concepto    boolean default false,
  con_comprobante boolean default false,
  con_firmante    boolean default false,
  con_vencimiento boolean default true,
  con_porcentaje  boolean default false,
  modif timestamp default current_timestamp,
  modiu text default user
);

INSERT INTO cuentas 
  (cuenta           , con_actor, con_concepto, con_comprobante, con_firmante, con_vencimiento, con_porcentaje ) values
  ('CAJA'           , false    , false       , false          , false       , false          , false          ),
  ('BANCO'          , true     , false       , true           , false       , true           , false          ),
  ('CAPITAL'        , true     , false       , false          , false       , false          , false          ),
  ('CLIENTES'       , true     , false       , true           , false       , true           , false          ),
  ('INSUMOS'        , true     , true        , false          , false       , false          , false          ),
  ('IVA_COMPRAS'    , false    , false       , false          , false       , true           , true           ),
  ('IVA_VENTAS'     , false    , false       , false          , false       , true           , true           ),
  ('MERCADERIA'     , false    , true        , false          , false       , false          , false          ),
  ('PROVEEDORES'    , true     , false       , true           , false       , true           , false          ),
  ('VALORES'        , false    , false       , true           , true        , true           , false          ),
  ('VALOR_AGREGADO' , true     , true        , false          , false       , false          , true           ),
  ('INICIO'         , false    , false       , false          , false       , false          , false          );

CREATE TABLE movimientos(
  asiento text references asientos(asiento),
  id_movimiento text not null,
  fecha date  not null,
  subc text default '' not null,
  cuenta text not null references cuentas(cuenta) on update cascade,
  actor text,
  importe numeric not null, 
  concepto text,
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
-- ALTER TABLE movimientos OWNER TO test_accounting_user;

CREATE OR REPLACE FUNCTION id_movimientos_trg()
  RETURNS trigger 
  LANGUAGE plpgsql
  AS
$BODY$
DECLARE
  vCerrado boolean;
BEGIN
  SELECT borrador IS NULL INTO vCerrado
    FROM asientos
    WHERE asiento = new.asiento;
  IF vCerrado THEN
    RAISE 'El asiento % esta cerrado no se puede modificar', new.asiento;
  END IF;
  new.id_movimiento=new.cuenta
    ||coalesce('|a:'||new.actor,'')
    ||coalesce('|c:'||new.concepto,'')
    ||coalesce('|p:'||new.precio,'')
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
  IF new.borrador IS NULL THEN
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
