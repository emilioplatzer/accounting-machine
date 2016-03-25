# Los comprobantes

Con el objetivo de:
  1. mejorar los controles
  2. registrar datos de facturas, recibos y demás comprobantes obligatorios según la regulación de la región
  3. agregar las cuestiones impositivas
  
se agrega el concepto de comprobante

# Ejemplos de uso

## Ejemplo: Continuación de la contabilidad de una empresa en funcionamiento

Cuando se desea empezar a controlar a partir de un punto una empresa que ya estaba funcionando
deben registrarse los saldos iniciales de las cuentas. 
 * Las cuentas como CAJA y BANCOS tienen un solo monetario. 
 * Las cuentas como MERCADERIA necesitan un renglón para cada producto. 
 * La cuenta de PROVEEDORES indican las facturas que se deben.
 * La cuenta de CLIENTES indican las facturas que emitieron y todavía no se cobraron.
 * La cuenta de VALORES contiene los cheques de tercero u otros valores no divisibles que pueden usarse para pagar o cancelar deudas

```asiento
fecha     asiento
1/1/2016  Balance_inicial_de_activos_y_pasivos
cuenta      actor     importe  comprobante numero vencimiento concepto cantidad precio  firmante
CAJA          ¬         25920     ¬          ¬        ¬         ¬             ¬      ¬     ¬
VALORES       ¬          8000  CHEQUE      3-333   4/1/2016     ¬             ¬      ¬  PEREZ
VALORES       ¬         20000  CHEQUE      7-777   4/1/2016     ¬             ¬      ¬  AGUIRRE
BANCO       GALICIA       452     ¬          ¬        ¬         ¬             ¬      ¬     ¬
MERCADERIA    ¬         36000     ¬          ¬        ¬       SILLA          18   2000     ¬
MERCADERIA    ¬         21000     ¬          ¬        ¬       MESA            7   3000     ¬
PROVEEDORES AUDIO_SRL  -10000  FAC-PROV    1-901  10/12/2015    ¬             ¬      ¬     ¬
PROVEEDORES AUDIO_SRL  -15000  FAC-PROV    1-922  20/12/2015    ¬             ¬      ¬     ¬
INICIO        ¬        -86372     ¬          ¬        ¬         ¬             ¬      ¬     ¬
```

La cuenta INICIO está para balancear y poder empezar a usar el programa lo antes posible,
luego hay que discriminar cómo está conformado ese INICIO. Por ejemplo:

```asiento
fecha     asiento
1/1/2016  Balance_inicial_de_conformación_del_capital_y_posición
cuenta         actor   importe
INICIO           ¬       86372
CAPITAL        MARIA    -40000
CAPITAL        PEDRO    -40000
VALOR_AGREGADO   ¬       -6372
```

## Ejemplo: El primer comprobante, una facutra de compra

```asiento
fecha     comprobante numero  asiento
11/1/2016 FAC-A-PROV  1-321   FAC-A-PROV_1-321_LA_MUEBLERIA_SA
cuenta      importe  actor           concepto cantidad precio porcentaje vencimiento
MERCADERIA    10000    ¬             SILLA           5   2000          ¬       ¬
MERCADERIA    10000    ¬             MESA            4   2500          ¬       ¬
IVA_COMPRAS    4200    ¬               ¬             ¬      ¬         21   31/1/2016
PROVEEDORES  -24200  LA_MUEBLERIA_SA   ¬             ¬      ¬          ¬   11/2/2016
```

El vencimiento de la factura es la fecha acordada para el pago,
cuando el proveedor no lo especifique se puede poner la fecha estimada o la misma fecha de emisión de la factura.
El vencimiento del renglón IVA_COMPRAS se refiere al momento en que debe liquidarse el renglón. 

Vamos a cargar un pago parcial en efectivo del 50%

```asiento
fecha      asiento
15/1/2016  REC-PROV_673_LA_MUEBLERIA_SAL
cuenta       subc importe  actor           comprobante numero
PROVEEDORES  CAN    12100  LA_MUEBLERIA_SA FAC-A-PROV  1-321
PROVEEDORES  CAN   -12100  LA_MUEBLERIA_SA REC-PROV    673
PROVEEDORES  ¬¬     12100  LA_MUEBLERIA_SA REC-PROV    673
CAJA         ¬¬    -12100        ¬         ¬           ¬
```

Complicado, veamos qué pasó acá y por qué se repite 4 veces el importe del pago. 
Analicemos cada uno de los renglones del asiento:
  1. El primer renglón corresponde a la cancelación de la factura, en un pago se podrían cancelar varias factura de distintos importes (en ese caso habría un renglón para cada factura cancelada)
  2. El segundo renglón tiene el importe total de la cancelación, suma todas las facturas canceladas
  3. El tercer renglón tiene el importe total del recibo (o sea el pago total) que podría ser mayor al importe de cancelación de facturas en el caso de que se dejara plata a cuenta
  4. El cuarto renglón indica el medio de pago (también podría haber varios renglones de distintos medios de pago)
  
Veamos un ejemplo de pago donde todos los importes son distintos. 
Vamos a registrar un pago a las facturas de AUDIO_SRL que suman 25000$ 
utilizando como medio de pago los dos cheques en cartera que suman 28000$.
Por lo tanto quedarán a cuenta 3000$, el proveedor habrá emitido un recibo por 28000 que indica que 3000$ quedan a cuenta:

```asiento
fecha      asiento
16/1/2016  REC-PROV_333_AUDIO_SRL
cuenta       subc importe  actor      comprobante numero  firmante
PROVEEDORES  CAN    10000  AUDIO_SRL  FAC-A-PROV  1-901     ¬
PROVEEDORES  CAN    15000  AUDIO_SRL  FAC-A-PROV  1-922     ¬
PROVEEDORES  CAN   -25000  AUDIO_SRL  REC-PROV    333       ¬
PROVEEDORES  ¬¬     28000  AUDIO_SRL  REC-PROV    333       ¬
VALORES      ¬¬     -8000      ¬      CHEQUE      3-333   PEREZ
VALORES      ¬¬    -20000      ¬      CHEQUE      7-777   AGUIRRE
```

Aquí se ven claramente las cuatro secciones:
  1. La cancelación de facturas (2 renglones)
  2. El importe total cancelado
  3. El importe total del recibo
  4. Los valores usados para pagar. Nótese que es necesario indicar el firmante para identificar el cheque 
  
La columna **subc** (subcuenta) indica cuando hay registros de cancelación

### los saldos por ahora son:

```saldos:cuenta,actor
cuenta         actor            saldo
CAJA             ¬              13820
BANCO          GALICIA            452
PROVEEDORES    LA_MUEBLERIA_SA -12100
PROVEEDORES    AUDIO_SRL         3000
MERCADERIA       ¬              77000
IVA_COMPRAS      ¬               4200       
CAPITAL        MARIA           -40000
CAPITAL        PEDRO           -40000
VALOR_AGREGADO   ¬              -6372
```

## Ejemplo: El primer comprobante, una facutra de compra
