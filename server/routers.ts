import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { nanoid } from "nanoid";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginSimple: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Check database credentials first
        const dbCredential = await db.getUserCredentialByUsername(input.username);
        
        if (dbCredential) {
          // Verify password (in production, use bcrypt)
          if (dbCredential.password !== input.password) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario o contraseña incorrectos' });
          }
          
          // Get user
          const user = await db.getUser(dbCredential.userId);
          
          if (!user) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Usuario no encontrado' });
          }
          
          // Create session token using SDK
          const cookieOptions = getSessionCookieOptions(ctx.req);
          const token = await sdk.createSessionToken(user.id, { name: user.name || '' });
          
          ctx.res.cookie(COOKIE_NAME, token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          return { success: true, user };
        }
        
        // Fallback to hardcoded credentials for admin and test users
        const credentials: Record<string, { userId: string; password: string; role: 'admin' | 'user' }> = {
          admin: { userId: 'test_admin_001', password: 'admin123', role: 'admin' },
          padre: { userId: 'test_parent_001', password: 'padre123', role: 'user' },
        };

        const credential = credentials[input.username];
        
        if (!credential || credential.password !== input.password) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuario o contraseña incorrectos' });
        }

        // Get or create user
        let user = await db.getUser(credential.userId);
        
        if (!user) {
          await db.upsertUser({
            id: credential.userId,
            name: input.username === 'admin' ? 'Administrador de Prueba' : 'María García',
            email: input.username === 'admin' ? 'admin@test.com' : 'padre@test.com',
            loginMethod: 'simple',
            role: credential.role,
            lastSignedIn: new Date(),
          });
          user = await db.getUser(credential.userId);
        }

        if (!user) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear usuario' });
        }

        // Create session token using SDK
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const token = await sdk.createSessionToken(user.id, { name: user.name || '' });
        
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { success: true, user };
      }),
  }),

  // Baby management router
  baby: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const baby = await db.getBabyByUserId(ctx.user.id);
      
      // Check if account should be suspended (9 days after first event)
      if (baby && baby.firstEventAt && baby.accountStatus === 'active') {
        const daysSinceFirstEvent = Math.floor(
          (Date.now() - new Date(baby.firstEventAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceFirstEvent >= 9) {
          await db.updateBaby(baby.id, { accountStatus: 'suspended' });
          baby.accountStatus = 'suspended';
        }
      }
      
      return baby;
    }),

    getById: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .query(async ({ input }) => {
        return await db.getBabyById(input.babyId);
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllBabies();
    }),

    create: adminProcedure
      .input(
        z.object({
          parentUsername: z.string(),
          parentPassword: z.string(),
          name: z.string(),
          birthDate: z.string().optional(),
          ageMonths: z.number().optional(),
          weightKg: z.number().optional(),
          heightCm: z.number().optional(),
          initialRoutine: z.string().optional(),
          routineStartTime: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const babyId = nanoid();
        const userId = nanoid();
        
        // Create user account for parent
        await db.upsertUser({
          id: userId,
          name: input.parentUsername,
          email: `${input.parentUsername}@noches-tranquilas.app`,
          loginMethod: 'simple',
          role: 'user',
          lastSignedIn: new Date(),
        });
        
        // Store credentials in database
        await db.createUserCredential({
          id: nanoid(),
          userId: userId,
          username: input.parentUsername,
          password: input.parentPassword, // In production, hash this with bcrypt
        });
        
        const baby = await db.createBaby({
          id: babyId,
          userId: userId,
          name: input.name,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
          ageMonths: input.ageMonths,
          weightKg: input.weightKg,
          heightCm: input.heightCm,
          initialRoutine: input.initialRoutine,
          routineStartTime: input.routineStartTime,
          accountStatus: 'active',
        });
        
        // Notify admin about new account
        await db.createAdminNotification({
          id: nanoid(),
          babyId: baby.id,
          babyName: baby.name,
          notificationType: 'account_created',
          message: `Nueva cuenta creada para ${baby.name}`,
        });

        return { baby, parentUsername: input.parentUsername, parentPassword: input.parentPassword };
      }),

    toggleSuspension: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .mutation(async ({ input }) => {
        const baby = await db.getBabyById(input.babyId);
        
        if (!baby) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Baby not found' });
        }
        
        const newStatus = baby.accountStatus === 'active' ? 'suspended' : 'active';
        
        await db.updateBaby(input.babyId, { accountStatus: newStatus });
        
        return { accountStatus: newStatus };
      }),

    update: adminProcedure
      .input(
        z.object({
          babyId: z.string(),
          name: z.string().optional(),
          birthDate: z.string().optional(),
          ageMonths: z.number().optional(),
          initialRoutine: z.string().optional(),
          routineStartTime: z.string().optional(),
          accountStatus: z.enum(['active', 'suspended']).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { babyId, ...updates } = input;
        
        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.birthDate) updateData.birthDate = new Date(updates.birthDate);
        if (updates.ageMonths !== undefined) updateData.ageMonths = updates.ageMonths;
        if (updates.initialRoutine !== undefined) updateData.initialRoutine = updates.initialRoutine;
        if (updates.routineStartTime !== undefined) updateData.routineStartTime = updates.routineStartTime;
        if (updates.accountStatus) updateData.accountStatus = updates.accountStatus;
        
        await db.updateBaby(babyId, updateData);
        
        return { success: true };
      }),
  }),

  // Events router
  events: router({
    register: protectedProcedure
      .input(
        z.object({
          eventType: z.enum([
            'siesta_inicio',
            'siesta_fin',
            'noche_inicio',
            'noche_fin',
            'despertar',
            'alimento',
            'baño',
            'cambio',
            'llanto',
            'juego',
            'comida_nocturna',
            'arrullo',
            'estimulacion',
            'panal',
            'otro',
          ]),
          eventTime: z.date().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const baby = await db.getBabyByUserId(ctx.user.id);
        
        if (!baby) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No baby account found' });
        }

        if (baby.accountStatus === 'suspended') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is suspended' });
        }

        const eventTime = input.eventTime || new Date();
        
        // If this is the first event, set firstEventAt
        if (!baby.firstEventAt) {
          await db.updateBaby(baby.id, { firstEventAt: eventTime });
        }

        // Calculate day number
        const firstEventDate = baby.firstEventAt ? new Date(baby.firstEventAt) : eventTime;
        const dayNumber = Math.floor(
          (eventTime.getTime() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        const event = await db.createSleepEvent({
          id: nanoid(),
          babyId: baby.id,
          eventType: input.eventType,
          eventTime: eventTime,
          comments: input.comments,
          dayNumber,
        });

        return event;
      }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
      const baby = await db.getBabyByUserId(ctx.user.id);
      
      if (!baby) return [];
      
      return await db.getTodayEvents(baby.id);
    }),

    getByBaby: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .query(async ({ input }) => {
        return await db.getEventsByBabyId(input.babyId);
      }),

    getByDay: adminProcedure
      .input(z.object({ babyId: z.string(), dayNumber: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventsByBabyAndDay(input.babyId, input.dayNumber);
      }),

    exportCSV: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .query(async ({ input }) => {
        const events = await db.getEventsByBabyId(input.babyId);
        const baby = await db.getBabyById(input.babyId);
        
        if (!baby) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Baby not found' });
        }
        
        // Create CSV content
        const headers = ['Fecha', 'Hora', 'Tipo de Evento', 'Día', 'Comentarios'];
        const rows = events.map(event => [
          new Date(event.eventTime).toLocaleDateString('es-MX'),
          new Date(event.eventTime).toLocaleTimeString('es-MX'),
          event.eventType,
          event.dayNumber?.toString() || '',
          event.comments || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return {
          filename: `eventos_${baby.name}_${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent
        };
      }),
  }),

  // Routine control router
  routine: router({
    start: protectedProcedure.mutation(async ({ ctx }) => {
      const baby = await db.getBabyByUserId(ctx.user.id);
      
      if (!baby) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No baby account found' });
      }

      if (baby.accountStatus === 'suspended') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is suspended' });
      }

      // Register routine start event
      const now = new Date();
      const firstEventDate = baby.firstEventAt ? new Date(baby.firstEventAt) : now;
      const dayNumber = Math.floor(
        (now.getTime() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      await db.createSleepEvent({
        id: nanoid(),
        babyId: baby.id,
        eventType: 'noche_inicio',
        eventTime: now,
        comments: 'Rutina iniciada',
        dayNumber,
      });

      return { success: true };
    }),

    end: protectedProcedure.mutation(async ({ ctx }) => {
      const baby = await db.getBabyByUserId(ctx.user.id);
      
      if (!baby) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No baby account found' });
      }

      if (baby.accountStatus === 'suspended') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is suspended' });
      }

      const now = new Date();
      const firstEventDate = baby.firstEventAt ? new Date(baby.firstEventAt) : now;
      const dayNumber = Math.floor(
        (now.getTime() - firstEventDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      // Register routine end event
      await db.createSleepEvent({
        id: nanoid(),
        babyId: baby.id,
        eventType: 'noche_fin',
        eventTime: now,
        comments: 'Rutina finalizada - despertar definitivo',
        dayNumber,
      });

      // Generate daily summary
      const todayEvents = await db.getTodayEvents(baby.id);
      
      // Calculate summary statistics
      let totalNaps = 0;
      let totalNapDuration = 0;
      let longestNightSleep = 0;
      let nightWakeups = 0;
      
      let lastSiestaInicio: Date | null = null;
      let lastNocheInicio: Date | null = null;
      
      for (const event of todayEvents) {
        if (event.eventType === 'siesta_inicio') {
          lastSiestaInicio = new Date(event.eventTime);
        } else if (event.eventType === 'siesta_fin' && lastSiestaInicio) {
          totalNaps++;
          const duration = (new Date(event.eventTime).getTime() - lastSiestaInicio.getTime()) / (1000 * 60);
          totalNapDuration += duration;
          lastSiestaInicio = null;
        } else if (event.eventType === 'noche_inicio') {
          lastNocheInicio = new Date(event.eventTime);
        } else if (event.eventType === 'despertar' && lastNocheInicio) {
          nightWakeups++;
          const sleepDuration = (new Date(event.eventTime).getTime() - lastNocheInicio.getTime()) / (1000 * 60);
          longestNightSleep = Math.max(longestNightSleep, sleepDuration);
          lastNocheInicio = new Date(event.eventTime);
        }
      }

      const finalWakeupTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      // Create detailed summary
      const detailedSummary = JSON.stringify({
        events: todayEvents.map(e => ({
          time: new Date(e.eventTime).toLocaleTimeString('es-MX'),
          type: e.eventType,
          comments: e.comments,
        })),
        stats: {
          totalNaps,
          totalNapDuration: Math.round(totalNapDuration),
          longestNightSleep: Math.round(longestNightSleep),
          nightWakeups,
          finalWakeupTime,
        },
      });

      const simpleSummary = `Día ${dayNumber}: ${totalNaps} siesta(s), ${Math.round(totalNapDuration)} min totales. Sueño nocturno más largo: ${Math.round(longestNightSleep)} min. Despertares: ${nightWakeups}. Despertar final: ${finalWakeupTime}`;

      await db.createDailySummary({
        id: nanoid(),
        babyId: baby.id,
        dayNumber,
        summaryDate: now,
        totalNaps,
        totalNapDuration: Math.round(totalNapDuration),
        longestNightSleep: Math.round(longestNightSleep),
        nightWakeups,
        finalWakeupTime,
        detailedSummary,
        simpleSummary,
      });

      // Notify admin
      await db.createAdminNotification({
        id: nanoid(),
        babyId: baby.id,
        babyName: baby.name,
        notificationType: 'routine_finalized',
        message: `Rutina finalizada para ${baby.name} - Día ${dayNumber}`,
      });

      await notifyOwner({
        title: `Rutina finalizada - ${baby.name}`,
        content: simpleSummary,
      });

      return { success: true, summary: simpleSummary };
    }),
  }),

  // Admin router
  admin: router({
    getNotifications: adminProcedure.query(async () => {
      return await db.getAllNotifications();
    }),

    getSummaries: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .query(async ({ input }) => {
        return await db.getSummariesByBabyId(input.babyId);
      }),

    exportData: adminProcedure
      .input(z.object({ babyId: z.string() }))
      .query(async ({ input }) => {
        const baby = await db.getBabyById(input.babyId);
        const events = await db.getEventsByBabyId(input.babyId);
        const summaries = await db.getSummariesByBabyId(input.babyId);

        // Format data for CSV export
        const csvData = events.map(event => ({
          fecha: new Date(event.eventTime).toLocaleDateString('es-MX'),
          hora: new Date(event.eventTime).toLocaleTimeString('es-MX'),
          tipo_evento: event.eventType,
          comentarios: event.comments || '',
          dia_numero: event.dayNumber,
        }));

        return {
          baby,
          events: csvData,
          summaries: summaries.map(s => ({
            dia: s.dayNumber,
            fecha: new Date(s.summaryDate).toLocaleDateString('es-MX'),
            siestas: s.totalNaps,
            duracion_siestas: s.totalNapDuration,
            sueno_nocturno_mas_largo: s.longestNightSleep,
            despertares: s.nightWakeups,
            despertar_final: s.finalWakeupTime,
            resumen: s.simpleSummary,
          })),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

