# Controles

Este sistema hace algunos controles para intentar evitar errores. 
**Pero no controla todo, que el programa no avise no significa que el asiento esté bien cargado**.

# Ejemplos de errores

## Asiento que no balancea

Todos los asientos deben sumar 0. 

```asiento
fecha     asiento                   falla
4/1/2016  Conformación_se_sociedad  Asiento_desbalanceado
cuenta  actor importe
CAPITAL MARIA  -50000
CAJA      ¬    100000
```

### cancelación que no balancea dentro de un asiento que sí

Aunque el asiento esté balanceado, los renglones que refieren a las cancelaciones también deben balancear.

```asiento
fecha     asiento   falla
4/1/2016  Pago      Asiento_desbalanceado
cuenta      subc  actor     comprobante numero importe
PROVEEDORES CAN   AUDIO_SRL FAC-A-PROV  1-1       1000
PROVEEDORES CAN   AUDIO_SRL REC-PROV    1-1       -800
PROVEEDORES  ¬¬   AUDIO_SRL REC-PROV    1-1        800
CAJA         ¬¬       ¬        ¬         ¬       -1000
```

