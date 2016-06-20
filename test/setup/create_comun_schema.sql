CREATE SCHEMA comun;

GRANT USAGE ON SCHEMA comun TO public;

CREATE OR REPLACE FUNCTION comun.es_numero(valor text)
  RETURNS boolean AS
$BODY$
DECLARE
  valor_numerico double precision;
BEGIN
  valor_numerico:=valor::double precision;
  RETURN true;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN false;  
  -- WHEN others THEN     return false;
END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE;
