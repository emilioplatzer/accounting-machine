create user test_accounting_user password 'test_accounting_3948812bdz';
create database test_accounting_db owner test_accounting_user;
\c test_accounting_db

drop schema if exists test cascade;
create schema test authorization test_accounting_user;
grant all on schema test to test_accounting_user;

CREATE TYPE test.estados as enum ('vacio','pendiente','ingresado');
ALTER type test.estados OWNER TO test_accounting_user;

CREATE TABLE test.movimientos(
  id serial primary key,
  fecha date,
  cuenta text,
  actor text,
  importe numeric, 
  numero text,
  producto text,
  cantidad numeric,
  precio numeric,
  porcentaje numeric,
  modif timestamp default current_timestamp,
  modiu text default user
);
ALTER TABLE test.movimientos 
  OWNER TO test_accounting_user;
