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

