import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { users, babies, sleepEvents, dailySummaries, userCredentials } from "../drizzle/schema";

/**
 * Script para poblar la base de datos con datos de prueba
 * 
 * Crea:
 * - 1 usuario administrador (admin@test.com)
 * - 1 usuario padre (padre@test.com)
 * - 1 bebé asociado al usuario padre
 * - Eventos de ejemplo de los últimos 2 días
 */

async function seedTestData() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Iniciando población de datos de prueba...\n");

  // IDs fijos para facilitar las pruebas
  const adminId = "test_admin_001";
  const parentId = "test_parent_001";
  const babyId = "test_baby_001";

  try {
    // 1. Crear usuario administrador
    console.log("👤 Creando usuario administrador...");
    await db.insert(users).values({
      id: adminId,
      name: "Administrador de Prueba",
      email: "admin@test.com",
      loginMethod: "oauth",
      role: "admin",
      createdAt: new Date(),
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        name: "Administrador de Prueba",
        email: "admin@test.com",
        role: "admin",
        lastSignedIn: new Date(),
      },
    });
    console.log("✅ Usuario administrador creado: admin@test.com\n");

    // 2. Crear usuario padre
    console.log("👤 Creando usuario padre...");
    await db.insert(users).values({
      id: parentId,
      name: "María García",
      email: "padre@test.com",
      loginMethod: "oauth",
      role: "user",
      createdAt: new Date(),
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        name: "María García",
        email: "padre@test.com",
        role: "user",
        lastSignedIn: new Date(),
      },
    });
    console.log("✅ Usuario padre creado: padre@test.com\n");

    // 2.1 Crear credenciales para admin
    console.log("🔑 Creando credenciales de administrador...");
    await db.insert(userCredentials).values({
      id: nanoid(),
      userId: adminId,
      username: "admin",
      password: "admin123",
      createdAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        password: "admin123",
      },
    });
    console.log("✅ Credenciales de admin creadas\n");

    // 2.2 Crear credenciales para padre
    console.log("🔑 Creando credenciales de padre...");
    await db.insert(userCredentials).values({
      id: nanoid(),
      userId: parentId,
      username: "padre",
      password: "padre123",
      createdAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        password: "padre123",
      },
    });
    console.log("✅ Credenciales de padre creadas\n");

    // 3. Crear bebé
    console.log("👶 Creando bebé de prueba...");
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(babies).values({
      id: babyId,
      userId: parentId,
      name: "Sofía",
      birthDate: new Date("2024-07-15"),
      ageMonths: 6,
      weightKg: 7500, // 7.5 kg en gramos
      heightCm: 67, // 67 cm
      initialRoutine: `RUTINA DE SUEÑO PERSONALIZADA - SOFÍA (6 MESES)

📋 OBJETIVO: Establecer un patrón de sueño saludable con despertares nocturnos mínimos.

🌅 RUTINA DIURNA:
• 07:00 - Despertar y alimentación matutina
• 09:30 - Primera siesta (45-60 min)
• 12:00 - Alimentación del mediodía
• 14:00 - Segunda siesta (60-90 min)
• 16:30 - Alimentación de la tarde
• 17:30 - Tercera siesta corta (30 min) - OPCIONAL

🌙 RUTINA NOCTURNA:
• 18:30 - Baño con agua tibia (relajante)
• 19:00 - Alimentación antes de dormir
• 19:30 - Ambiente tranquilo, luz tenue
• 20:00 - Acostar en cuna, arrullo suave
• 20:15 - Inicio del sueño nocturno

💡 RECOMENDACIONES:
- Mantener temperatura ambiente 20-22°C
- Usar ruido blanco si ayuda
- Evitar estimulación 1 hora antes de dormir
- Ser consistente con los horarios (±15 min)
- Si despierta, esperar 2-3 min antes de intervenir

📊 REGISTRO: Anotar todos los eventos para ajustar la rutina según necesidad.`,
      routineStartTime: "20:00",
      firstEventAt: twoDaysAgo,
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        name: "Sofía",
        ageMonths: 6,
        accountStatus: "active",
        updatedAt: new Date(),
      },
    });
    console.log("✅ Bebé creado: Sofía (6 meses)\n");

    // 4. Crear eventos de ejemplo (Día 1 - hace 2 días)
    console.log("📝 Creando eventos de ejemplo del Día 1...");
    const day1Events = [
      { time: "09:30", type: "siesta_inicio", comment: "Se durmió rápido" },
      { time: "10:15", type: "siesta_fin", comment: "Despertó tranquila" },
      { time: "14:00", type: "siesta_inicio", comment: "Siesta larga" },
      { time: "15:30", type: "siesta_fin", comment: "Buen descanso" },
      { time: "18:30", type: "baño", comment: "Baño relajante con agua tibia" },
      { time: "19:00", type: "alimento", comment: "180ml fórmula" },
      { time: "20:00", type: "noche_inicio", comment: "Rutina iniciada" },
      { time: "23:45", type: "despertar", comment: "Lloró, necesitó arrullo" },
      { time: "03:20", type: "despertar", comment: "Hambre, 90ml fórmula" },
      { time: "07:00", type: "noche_fin", comment: "Despertar definitivo, feliz" },
    ];

    for (const event of day1Events) {
      const eventDate = new Date(twoDaysAgo);
      const [hours, minutes] = event.time.split(":");
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await db.insert(sleepEvents).values({
        id: nanoid(),
        babyId: babyId,
        eventType: event.type as any,
        eventTime: eventDate,
        comments: event.comment,
        dayNumber: 1,
        createdAt: new Date(),
      });
    }
    console.log(`✅ ${day1Events.length} eventos del Día 1 creados\n`);

    // 5. Crear eventos de ejemplo (Día 2 - hace 1 día)
    console.log("📝 Creando eventos de ejemplo del Día 2...");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const day2Events = [
      { time: "09:45", type: "siesta_inicio", comment: "Tardó un poco en dormirse" },
      { time: "10:30", type: "siesta_fin", comment: "Siesta corta" },
      { time: "14:15", type: "siesta_inicio", comment: "Se durmió bien" },
      { time: "15:45", type: "siesta_fin", comment: "Despertó llorando" },
      { time: "18:30", type: "baño", comment: "Baño con juguetes" },
      { time: "19:00", type: "alimento", comment: "200ml fórmula" },
      { time: "20:00", type: "noche_inicio", comment: "Rutina nocturna iniciada" },
      { time: "22:30", type: "despertar", comment: "Lloró, solo necesitó chupón" },
      { time: "02:45", type: "despertar", comment: "Hambre, 100ml fórmula" },
      { time: "06:45", type: "noche_fin", comment: "Despertar final, contenta" },
    ];

    for (const event of day2Events) {
      const eventDate = new Date(yesterday);
      const [hours, minutes] = event.time.split(":");
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await db.insert(sleepEvents).values({
        id: nanoid(),
        babyId: babyId,
        eventType: event.type as any,
        eventTime: eventDate,
        comments: event.comment,
        dayNumber: 2,
        createdAt: new Date(),
      });
    }
    console.log(`✅ ${day2Events.length} eventos del Día 2 creados\n`);

    // 6. Crear resumen del Día 1
    console.log("📊 Creando resumen del Día 1...");
    await db.insert(dailySummaries).values({
      id: nanoid(),
      babyId: babyId,
      dayNumber: 1,
      summaryDate: twoDaysAgo,
      totalNaps: 2,
      totalNapDuration: 105, // 45 + 60 minutos
      longestNightSleep: 225, // 3h 45min
      nightWakeups: 2,
      finalWakeupTime: "07:00",
      parentObservations: "Primera noche de seguimiento. Dos despertares nocturnos.",
      detailedSummary: JSON.stringify({
        stats: {
          totalNaps: 2,
          totalNapDuration: 105,
          longestNightSleep: 225,
          nightWakeups: 2,
          finalWakeupTime: "07:00",
        },
      }),
      simpleSummary: "Día 1: 2 siestas, 105 min totales. Sueño nocturno más largo: 225 min. Despertares: 2. Despertar final: 07:00",
      createdAt: new Date(),
    });
    console.log("✅ Resumen del Día 1 creado\n");

    console.log("🎉 ¡Datos de prueba creados exitosamente!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("📋 CREDENCIALES DE PRUEBA:");
    console.log("═══════════════════════════════════════════════════");
    console.log("\n👨‍💼 ADMINISTRADOR:");
    console.log("   Usuario: admin");
    console.log("   Contraseña: admin123");
    console.log("   Email: admin@test.com");
    console.log("   ID: test_admin_001");
    console.log("   Rol: admin");
    console.log("\n👨‍👩‍👧 PADRE/MADRE:");
    console.log("   Usuario: padre");
    console.log("   Contraseña: padre123");
    console.log("   Email: padre@test.com");
    console.log("   ID: test_parent_001");
    console.log("   Rol: user");
    console.log("   Bebé asignado: Sofía (6 meses)");
    console.log("\n👶 BEBÉ:");
    console.log("   Nombre: Sofía");
    console.log("   Edad: 6 meses");
    console.log("   Eventos registrados: 20 eventos (2 días)");
    console.log("   Estado: Activa (7 días restantes)");
    console.log("\n═══════════════════════════════════════════════════");
    console.log("\n💡 NOTA: Para iniciar sesión como estos usuarios,");
    console.log("   necesitarás configurar el sistema de autenticación");
    console.log("   para aceptar estos IDs de usuario.");
    console.log("\n");

  } catch (error) {
    console.error("❌ Error al crear datos de prueba:", error);
    throw error;
  }
}

// Ejecutar el script
seedTestData()
  .then(() => {
    console.log("✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });

