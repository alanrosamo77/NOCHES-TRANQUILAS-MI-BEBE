# Noches Tranquilas BB - Guía de Uso

## Descripción General

**Noches Tranquilas BB** es una aplicación web profesional diseñada para ayudar a los padres a registrar las rutinas de sueño de sus bebés durante 7 noches. La aplicación permite un registro simple y ordenado de eventos diarios, visualización de rutinas iniciales personalizadas, y exportación de datos para análisis profesional.

---

## Características Principales

### Para Padres (Usuarios)

1. **Registro de Eventos**: Captura rápida de eventos con timestamp automático
   - Inicio/fin de siestas
   - Inicio/fin de noche
   - Despertares
   - Alimentación
   - Baño
   - Cambio de pañal
   - Llanto/intento de dormir
   - Juego/estimulación

2. **Rutina Inicial**: Visualización permanente de la rutina personalizada proporcionada por el especialista

3. **Control de Rutina**: Botones para iniciar y finalizar la rutina diaria

4. **Historial del Día**: Vista en tiempo real de todos los eventos registrados durante el día

5. **Ciclo de Vida de la Cuenta**: 9 días de acceso desde el primer registro (7 días de seguimiento + 2 días adicionales)

### Para Administradores

1. **Gestión de Cuentas**: Crear y administrar cuentas de bebés
   - Asignar usuarios (padres)
   - Definir nombre del bebé, edad, rutina inicial
   - Configurar hora de inicio de rutina
   - Activar/suspender cuentas

2. **Notificaciones**: Recepción automática cuando se finaliza una rutina diaria

3. **Visualización de Datos**: Ver resúmenes diarios de cada bebé

4. **Exportación**: Descargar datos completos en formato CSV para análisis externo

---

## Acceso a la Aplicación

### URL Principal
```
https://3000-isedxvap4jnj95l71rdpw-a6dc7325.manus.computer
```

### Panel de Administrador
```
https://3000-isedxvap4jnj95l71rdpw-a6dc7325.manus.computer/admin
```

---

## Guía de Uso para Administradores

### 1. Acceso Inicial

1. Accede a la URL del panel de administrador
2. Inicia sesión con tu cuenta de administrador
3. Serás redirigido automáticamente al panel de administración

### 2. Crear una Nueva Cuenta de Bebé

1. Haz clic en el botón **"Crear Bebé"** en la esquina superior derecha
2. Completa el formulario:
   - **ID de Usuario (Padre/Madre)**: El ID único del usuario padre/madre (obtenido del sistema de autenticación)
   - **Nombre del Bebé**: Nombre del bebé (requerido)
   - **Edad en Meses**: Edad actual del bebé (opcional)
   - **Hora de Inicio de Rutina**: Hora sugerida para iniciar la rutina nocturna (formato 24h, ej: 20:00)
   - **Rutina Inicial**: Texto libre con las instrucciones personalizadas tipo "receta médica" (opcional)
3. Haz clic en **"Crear Bebé"**

### 3. Gestionar Cuentas Existentes

- **Ver Datos**: Haz clic en "Ver Datos" para expandir la información de un bebé
  - Visualiza la rutina inicial
  - Revisa los resúmenes diarios generados
  - Accede a la opción de exportación

- **Suspender/Activar Cuenta**: 
  - Haz clic en "Suspender" para desactivar temporalmente una cuenta
  - Haz clic en "Activar" para reactivar una cuenta suspendida

### 4. Exportar Datos

1. Selecciona un bebé y haz clic en "Ver Datos"
2. Desplázate hacia abajo hasta encontrar el botón **"Exportar Datos a CSV"**
3. Haz clic para descargar un archivo CSV con todos los eventos registrados
4. El archivo incluye: fecha, hora, tipo de evento, comentarios y número de día

### 5. Revisar Notificaciones

- Las notificaciones aparecen en la parte superior del panel
- Recibirás notificaciones cuando:
  - Se crea una nueva cuenta de bebé
  - Un padre finaliza una rutina diaria

---

## Guía de Uso para Padres

### 1. Acceso Inicial

1. El administrador te proporcionará acceso a la aplicación
2. Accede a la URL principal
3. Inicia sesión con tu cuenta
4. Verás la pantalla principal con el nombre de tu bebé

### 2. Visualizar la Rutina Inicial

1. En la pantalla principal, haz clic en el botón **"Ver Rutina"**
2. Se desplegará la rutina personalizada proporcionada por el especialista
3. Esta rutina estará disponible en todo momento para consulta

### 3. Iniciar la Rutina del Día

1. Al comenzar la rutina nocturna, presiona el botón **"Iniciar Rutina"**
2. Esto registrará automáticamente el evento "Inicio de Noche" con la hora actual

### 4. Registrar Eventos

1. Durante el día/noche, cuando ocurra un evento:
   - Selecciona el **tipo de evento** tocando el botón correspondiente
   - (Opcional) Añade **comentarios** en el campo de texto (ej: "Se calmó con arrullo", "Despertó con hambre")
   - Presiona **"Registrar Evento"**
2. La fecha y hora se capturan automáticamente
3. El evento aparecerá inmediatamente en la sección "Eventos de Hoy"

### 5. Finalizar la Rutina

1. Cuando el bebé despierte definitivamente por la mañana, presiona **"Finalizar Rutina"**
2. Esto:
   - Registra el despertar final
   - Genera automáticamente el resumen del día
   - Notifica al administrador
3. Recibirás una confirmación de que el resumen ha sido enviado

### 6. Revisar Eventos del Día

- La sección "Eventos de Hoy" muestra todos los eventos registrados
- Cada evento incluye:
  - Icono del tipo de evento
  - Hora exacta
  - Comentarios (si los añadiste)

---

## Formato de Datos

### Estructura de Eventos

Cada evento se almacena internamente en el formato:
```
[fecha - hora] | [tipo_evento] | [detalle]
```

**Ejemplo:**
```
2025-01-19 18:05 | siesta_inicio | Se quedó dormido en brazos
2025-01-19 18:45 | siesta_fin | Despertó llorando
2025-01-19 19:30 | baño | Baño con agua tibia
2025-01-19 20:00 | alimento | 120 ml fórmula
2025-01-19 22:15 | despertar | Solo necesitó arrullo
```

### Resumen Diario

Al finalizar cada rutina, se genera un resumen que incluye:

- **Total de siestas** y duración acumulada (en minutos)
- **Horas de sueño nocturno continuo más largo** (en minutos)
- **Número de despertares nocturnos**
- **Hora del despertar final**
- **Observaciones importantes** de los padres

---

## Ciclo de Vida de la Cuenta

1. **Día 0**: El administrador crea la cuenta del bebé
2. **Día 1**: El padre registra el primer evento → se activa el contador de 9 días
3. **Días 2-7**: Período principal de seguimiento (7 noches)
4. **Días 8-9**: Días adicionales de gracia
5. **Día 10+**: La cuenta se **suspende automáticamente**
6. **Reactivación**: El administrador puede reactivar la cuenta manualmente si es necesario

---

## Tipos de Eventos Disponibles

| Tipo de Evento | Descripción | Icono |
|---|---|---|
| **siesta_inicio** | Inicio de una siesta diurna | 🌙 |
| **siesta_fin** | Fin de una siesta diurna | ☀️ |
| **noche_inicio** | Inicio del sueño nocturno | 🌙 |
| **noche_fin** | Fin del sueño nocturno / despertar definitivo | ☀️ |
| **despertar** | Despertar temporal durante la noche | ⏰ |
| **alimento** | Alimentación (leche, fórmula, comida) | 🍽️ |
| **baño** | Baño del bebé | 🛁 |
| **cambio** | Cambio de pañal | 👶 |
| **llanto** | Llanto o intento de dormir | 😢 |
| **juego** | Juego o estimulación | 😊 |

---

## Modelos de Servicio

### Modelo 1: Servicio Completo (Predeterminado)
1. Consulta inicial con el especialista
2. Creación de la rutina inicial personalizada
3. 7 días de registro en la aplicación
4. Evaluación final y rutina ajustada

### Modelo 2: Solo Aplicación
- Los padres pueden adquirir acceso a la aplicación sin consulta previa
- Útil para familias que solo necesitan la herramienta de registro
- La aplicación se adapta a este modelo (rutina inicial opcional)

---

## Soporte Técnico

Para cualquier problema técnico o pregunta sobre el uso de la aplicación:

1. **Padres**: Contacta al administrador que te proporcionó el acceso
2. **Administradores**: Revisa la documentación técnica en el repositorio del proyecto

---

## Notas Importantes

- **Privacidad**: Todos los datos se almacenan de forma segura en la nube
- **Acceso Móvil**: La aplicación está optimizada para dispositivos móviles (iOS/Android)
- **Notificaciones**: El administrador recibe notificaciones automáticas al finalizar rutinas
- **Exportación**: Los datos se pueden exportar en formato CSV/Excel para análisis externo
- **Zona Horaria**: Todos los timestamps se registran en la zona horaria local del usuario

---

## Preguntas Frecuentes

**P: ¿Qué pasa si olvido registrar un evento?**  
R: Puedes registrar eventos en cualquier momento. La hora se captura automáticamente al momento del registro.

**P: ¿Puedo editar o eliminar eventos ya registrados?**  
R: Actualmente no se pueden editar eventos registrados. Asegúrate de verificar antes de confirmar.

**P: ¿Qué pasa después de los 9 días?**  
R: La cuenta se suspende automáticamente. El administrador puede reactivarla si es necesario para seguimiento adicional.

**P: ¿Puedo ver resúmenes de días anteriores?**  
R: Los resúmenes están disponibles para el administrador en el panel de administración.

**P: ¿La aplicación funciona sin conexión a internet?**  
R: No, la aplicación requiere conexión a internet para registrar eventos y sincronizar datos.

---

**Versión de la Aplicación**: 1.0  
**Última Actualización**: Enero 2025

