# Los presupuestos de proyectos

Se puede utilizar para presupuestos de obras (construcción) de proyectos de producción, etc

# Ejemplos de uso para un presupuesto de obra

## Asiento de presupuesto

Se necesita registrar los costos de cada una de las etapas y rubros

```asiento
fecha     asiento
1/1/2016  Presupuesto_de_obra
cuenta         importe vencimiento cantidad  precio  concepto   
PRE_COSTO      -200000 1/2/2016          1  -200000  Compra_de_Terreno
PRE_COSTO      -130000 1/3/2016          1  -130000  Hormigon_piso_1
PRE_COSTO      -130000 1/4/2016          1  -130000  Hormigon_piso_2
PRE_COSTO      -130000 1/5/2016          1  -130000  Hormigon_piso_3
PRE_COSTO      -340000 1/6/2016          1  -340000  Revestimiento
PRE_COSTO      -140000 1/7/2016          1  -140000  Pintura
PRE_COSTO      -440000 1/8/2016          1  -440000  Otros_Costos
PRE_RESULTADO  1510000 1/8/2016          1  1510000  Edificio_Terminado
```

El resultado es el edificio terminado (y se registra su costo)

Luego debe anotarse el plan de ventas, 
el edificio terminado es convertido en departamentos con un precio estimado
según la fecha de compra

```asiento
fecha     asiento
1/1/2016  Presupuesto_de_ventas
cuenta         importe  vencimiento cantidad   precio  concepto   
PRE_RESULTADO -1510000  1/7/2016        1     1510000  Edificio_Terminado
PRE_VENTA       600000  1/1/2016        2      300000  Venta_depto_pozo
PRE_VENTA      1350000  1/9/2016        3      450000  Venta_depto_listo
PRE_RESULTADO  -440000  1/10/2016       1     -440000  Resultado_bruto
```

## Registro de gastos durante la construcción

Compra del terreno (versión simplificada, sin considerar los impuestos, 
costos de transferencia, etc, que pueden cargarse en un asiento aparte). 

```asiento
fecha      asiento
28/1/2016  Compra_del_terreno_a_valor_presupuestado
cuenta         importe  vencimiento  concepto          cantidad  precio
INSUMOS         200000  28/1/2016    Compra_de_Terreno       1  -200000
CAJA           -200000     ¬              ¬                  ¬     ¬
```

Luego registramos la factura del hormigón correspondiente al primer piso. 
En este caso el costo fue menor al presupuestado. 
La diferencia se registra sobre una nueva cuenta porque representa un resultado estimado en función del presupuesto.
Para saber si resulta en ganancia o pérdida habrá que esperar al final del resultado, mientras tanto es ganancia (y por lo tanto de signo negativo).

```asiento
fecha      asiento
15/2/2016  Hormigón_del_primer_piso
cuenta          importe  vencimiento  cantidad  precio  concepto         comprobante  numero
INSUMOS          130000   1/3/2016          1  -130000  Hormigon_piso_1      ¬          ¬
DIF_COSTO        -20000      ¬              0  -130000  Hormigon_piso_1      ¬          ¬
PROVEEDORES     -110000  28/3/2016          ¬      ¬          ¬          FAC-A-PROV   1-230
```

Si hubiera sido un mayor costo se pone en positivo en la cuenta "DIF_COSTO". 
Lo importante es que la cuenta de INSUMOS debe tener el mismo valor que el costo presupuestado.
El valor contable de los insumos tiene que estar en referencia al presupuesto, 
para de ese modo poder controlar:
  * Lo que falta hacer = `PRE_COSTO - INSUMOS` (a valor presupuestado)
  * Lo hecho a valores reales = `INSUMOS + DIF_COSTO`
  * Lo hecho a valores presupuestados = `INSUMOS`
  * Lo que falta a valores reales = `?` (imposible de saber)
  
### Factura parcial

El hormigón del segundo piso se hizo en dos mitades, la primera mitad al valor presupuestado:

```asiento
fecha      asiento
10/3/2016  Hormigón_del_segundo_piso_primera_parte
cuenta          importe  vencimiento  cantidad  precio  concepto         comprobante  numero
INSUMOS           65000   1/4/2016        0.5  -130000  Hormigon_piso_2      ¬          ¬
PROVEEDORES      -65000  28/4/2016          ¬      ¬          ¬          FAC-A-PROV   1-235
```

Hagamos el pago de ambas facturas

```asiento
fecha         asiento
31/3/2016     Pago_ambas_facturas
cuenta       actor           subc importe  vencimiento  comprobante  numero
PROVEEDORES  HORMIGONERA_SA  CAN   110000  28/3/2016    FAC-A-PROV   1-230
PROVEEDORES  HORMIGONERA_SA  CAN    65000  28/4/2016    FAC-A-PROV   1-235
PROVEEDORES  HORMIGONERA_SA  CAN  -175000  31/3/2016    REC-PROV     1-122
PROVEEDORES  HORMIGONERA_SA   ¬¬   175000  31/3/2016    REC-PROV     1-122
BANCO        RIO              ¬¬  -175000  31/4/2016    CH           393939321
```

Con las ventas es igual. Vendamos a la señora García un departamento en cuotas a valor de pozo
(un poco más por las cuotas). 

```asiento
fecha         asiento
31/3/2016     Venta_en_cuotas_del_primero_A
cuenta     actor    importe  vencimiento cantidad   precio  concepto          comprobante  numero
PRODUCTOS    ¬       -300000  1/1/2016        1      300000  Venta_depto_pozo       ¬          ¬
DIF_VENTA    ¬        -30000  31/3/2016       0      300000  Venta_depto_pozo       ¬          ¬
CLIENTES   GARCIA     110000  31/1/2016       ¬         ¬           ¬           CUOTA       1A-1
CLIENTES   GARCIA     110000  28/2/2016       ¬         ¬           ¬           CUOTA       1A-2
CLIENTES   GARCIA     110000  31/3/2016       ¬         ¬           ¬           CUOTA       1A-3
```

Los saldos quedan así:

```saldos:cuenta
cuenta            saldo
CAJA            -200000
BANCO           -175000
CLIENTES         330000
PRE_COSTO      -1510000
INSUMOS          395000
DIF_COSTO        -20000
PRE_VENTA       1950000
PRODUCTOS       -300000
DIF_VENTA        -30000
PRE_RESULTADO   -440000
```

El plan de seguimiento de obra así:
```matriz:concepto,precio,cuenta
concepto             PRE_COSTO  PRODUCTO  pendiente  DIF_COSTO  gastado
Compra_de_Terreno      -200000    200000          0          0   200000
Hormigon_piso_1        -130000    130000          0     -20000   120000
Hormigon_piso_2        -130000     65000     -65000          0    65000
Hormigon_piso_3        -130000              -130000
Revestimiento          -340000              -340000
Pintura                -140000              -140000
Otros_Costos           -440000              -440000
```
