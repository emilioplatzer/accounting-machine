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
Las cuentas como CAJA y BANCOS tienen un solo monetario. 
Las cuentas como MERCADERIA necesitan un renglón para cada producto. 

```asiento
fecha
1/1/2016
cuenta     actor   importe  producto cantidad precio
CAJA         ¬        8920    ¬             ¬      ¬
BANCO      GALICIA     452    ¬             ¬      ¬
MERCADERIA   ¬       36000  SILLA          18   2000
MERCADERIA   ¬       21000  MESA            7   3000
INICIO       ¬      -66372    ¬             ¬      ¬
```

La cuenta INICIO está para balancear y poder empezar a usar el programa lo antes posible,
luego hay que discriminar cómo está conformado ese INICIO. Por ejemplo:

```asiento
fecha
1/1/2016
cuenta         actor   importe  producto cantidad precio
INICIO           ¬       66372    ¬             ¬      ¬
CAPITAL        MARIA    -30000    ¬             ¬      ¬
CAPITAL        PEDRO    -30000    ¬             ¬      ¬
VALOR_AGREGADO   ¬       -6372    ¬             ¬      ¬
```

