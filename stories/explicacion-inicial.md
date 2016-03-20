# Introducción

Este sistema está diseñado para planificar escenarios de movimientos de caja, administrativos, de ventas y producción. 
No es un sistema contable ni debe usarse como tal. 

# Ejemplos de uso

## Ejemplo: Conformación de una empresa

La empresa se conforma con un aporte inicial societario. 

```asiento
fecha    cuenta actor importe
4/1/2016 APORTE PEDRO  -50000
    ”    APORTE MARIA  -50000
    ”    CAJA     ¬    100000
```

**Los signos de los importes** se determinan por convención respecto a la cuenta **caja**:
Cuando entra plata en la caja el importe es positivo 
y por lo tanto cuando hay plata en la caja el saldo es positivo. 
Las entradas de cuentas de activos son positivas y negativas sus salidas, 
las deudas son negativas (y sus cancelaciones positivas). 

**Los nombres de las cuentas** no son códigos como los que usan los programas contables (111000)
porque 

Después de este asiento los saldos por cuenta son:

```saldos:cuenta
cuenta   saldo
APORTE -100000
CAJA    100000
```

Y los saldos detallados por actores

```saldos:cuenta,actor
cuenta actor   saldo
APORTE PEDRO  -50000
APORTE MARIA  -50000
CAJA     ¬    100000
```

## Ejemplo: Ejercicio del comercio

Compremos mercadería para vender

```asiento
fecha      cuenta     importe  producto cantidad precio
11/1/2016  MERCADERIA   20000  SILLAS         10   2000
    ”      CAJA        -20000    ¬             ¬      ¬
```

los saldos son los esperados:

```saldos:cuenta
cuenta       saldo
APORTE     -100000
CAJA         80000
MERCADERIA   20000
```

Al registrar la venta de 5 sillas (que obviamente se hace a un precio mayor)
debe registrarse la salida de mercadería al valor al que fue comprada. 
El ingreso en la caja debe ser al valor real, la diferencia es el valor agregado

```asiento
fecha      cuenta         importe  producto cantidad precio porcentaje
11/1/2016  MERCADERIA       -4000  SILLAS         -2   2000          ¬
    ”      VALOR_AGREGADO    -800  SILLAS         -2   2000         20
    ”      CAJA              4400    ¬             ¬      ¬          ¬
```

Y los saldos quedan así:

```saldos:cuenta
cuenta           saldo
APORTE         -100000
CAJA             84400
MERCADERIA       16000
VALOR_AGREGADO    -800
```

**Los signos de las ganancias son negativos** (y de las pérdidas positivos). 
Si bien el Valor Agregado todavía no es una ganancia (porque deben descontarse impuestos y gastos)
va a conformar la cuenta que dé esa ganancia. 
**¿Por qué el signo es negativo?** Porque es "retirable hacia el exterior de la empresa", 
al momento de cerrar la empresa los activos (en este caso caja más mercadería) 
se usarán para devolver los aportes, el resto (800) se pueden retirar como ganancias.

Así como los aportes son negativos porque la empresa debe ese dinero a los socios,
las ganancias también son negativas porque la empresa debe ese dinero a los socios.

Podemos ver los saldos detallados hasta ahora:

```saldos:cuenta,actor,producto
cuenta         actor producto  saldo
APORTE         PEDRO    ¬     -50000
APORTE         MARIA    ¬     -50000
CAJA             ¬      ¬      84400
MERCADERIA       ¬   SILLAS    16000
VALOR_AGREGADO   ¬   SILLAS     -800
```
