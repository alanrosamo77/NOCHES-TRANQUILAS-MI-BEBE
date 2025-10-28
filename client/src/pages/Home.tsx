import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Moon, Sun, Clock, Utensils, Bath, Smile, ChevronRight, Calendar, Weight, Ruler,
  Frown, Heart, Hand, Sparkles, Baby as BabyIcon, Stars, CloudMoon, LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Eventos del DÍA (cuando NO está en rutina nocturna)
const DAY_EVENT_TYPES = [
  { 
    type: "siesta_inicio", 
    label: "Siesta", 
    sublabel: "Inicio",
    icon: Moon, 
    color: "from-indigo-400 to-indigo-600",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    placeholders: ["Se durmió rápido", "Costó trabajo dormir", "Durmió en brazos", "Durmió en cuna"]
  },
  { 
    type: "siesta_fin", 
    label: "Despertar", 
    sublabel: "Siesta",
    icon: Sun, 
    color: "from-amber-400 to-amber-600",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    placeholders: ["Despertó llorando", "Despertó tranquilo", "Despertó con hambre", "Despertó de buen humor"]
  },
  { 
    type: "alimento", 
    label: "Comida", 
    sublabel: "",
    icon: Utensils, 
    color: "from-green-400 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    placeholders: ["Comió bien", "No quiso comer", "Probó alimentos nuevos", "Comió poca cantidad"]
  },
  { 
    type: "baño", 
    label: "Baño", 
    sublabel: "",
    icon: Bath, 
    color: "from-cyan-400 to-cyan-600",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    placeholders: ["Baño relajante", "Le gustó el agua", "Lloró durante el baño", "Jugó en el agua"]
  },
  { 
    type: "juego", 
    label: "Juego", 
    sublabel: "Estimulación",
    icon: Smile, 
    color: "from-teal-400 to-teal-600",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    placeholders: ["Jugó activamente", "Estimulación sensorial", "Tiempo en el suelo", "Interacción social"]
  },
];

// Eventos de la NOCHE (cuando está en rutina nocturna)
const NIGHT_EVENT_TYPES = [
  { 
    type: "llanto", 
    label: "Llanto", 
    icon: Frown,
    color: "from-red-400 to-red-600",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    placeholders: ["Lloró fuerte", "Llanto suave", "Se calmó rápido", "Lloró por mucho tiempo"]
  },
  { 
    type: "comida_nocturna", 
    label: "Comida", 
    icon: Utensils,
    color: "from-green-400 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    placeholders: ["Tomó leche", "Comió bien", "No quiso comer", "Comió poca cantidad"]
  },
  { 
    type: "arrullo", 
    label: "Arrullo", 
    icon: Heart,
    color: "from-pink-400 to-pink-600",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
    placeholders: ["Se durmió con arrullo", "Necesitó mucho arrullo", "Se calmó rápido", "Costó trabajo"]
  },
  { 
    type: "estimulacion", 
    label: "Estimulación", 
    icon: Sparkles,
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    placeholders: ["Necesitó estimulación", "Muy activo", "Inquieto", "Difícil calmar"]
  },
  { 
    type: "panal", 
    label: "Pañal", 
    icon: BabyIcon,
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    placeholders: ["Cambio de pañal", "Pañal sucio", "Incomodidad", "Se despertó por pañal"]
  },
  { 
    type: "otro", 
    label: "Otro", 
    icon: Hand,
    color: "from-gray-400 to-gray-600",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    placeholders: ["Otro motivo", "Especificar en comentarios"]
  },
];

// Eventos especiales de rutina (inicio/fin de noche)
const ROUTINE_EVENT_TYPES = [
  { 
    type: "noche_inicio", 
    label: "Rutina Iniciada", 
    icon: Moon,
    color: "from-purple-500 to-indigo-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700"
  },
  { 
    type: "noche_fin", 
    label: "Rutina Finalizada", 
    icon: Sun,
    color: "from-orange-400 to-yellow-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
];

// Combinar todos los tipos para búsqueda en el timeline
const ALL_EVENT_TYPES = [...DAY_EVENT_TYPES, ...NIGHT_EVENT_TYPES, ...ROUTINE_EVENT_TYPES];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [showRoutine, setShowRoutine] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showRoutineDialog, setShowRoutineDialog] = useState(false);
  const [routineAction, setRoutineAction] = useState<'start' | 'end' | null>(null);
  const [eventTime, setEventTime] = useState("");
  const [routineTime, setRoutineTime] = useState("");
  const [isNightMode, setIsNightMode] = useState(() => {
    // Cargar el estado del modo nocturno desde localStorage
    const saved = localStorage.getItem('isNightMode');
    return saved === 'true';
  });
  const [hasActiveSiesta, setHasActiveSiesta] = useState(false);
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Redirect admin users to admin panel
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      setLocation("/admin");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const utils = trpc.useUtils();
  
  // Get baby data for the current user
  const { data: baby, isLoading: babyLoading } = trpc.baby.getCurrent.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get today's events
  const { data: todayEvents } = trpc.events.getToday.useQuery(
    undefined,
    { enabled: !!baby?.id }
  );

  // Detect night mode and active siesta on initial load
  useEffect(() => {
    if (todayEvents && todayEvents.length > 0) {
      const hasStartRoutine = todayEvents.some((e: any) => e.eventType === 'noche_inicio');
      const hasEndRoutine = todayEvents.some((e: any) => e.eventType === 'noche_fin');
      
      // Determinar el modo basado en los eventos del día
      const shouldBeNightMode = hasStartRoutine && !hasEndRoutine;
      
      // Obtener el último evento de rutina nocturna
      const routineEvents = todayEvents.filter((e: any) => 
        e.eventType === 'noche_inicio' || e.eventType === 'noche_fin'
      ).sort((a: any, b: any) => 
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
      );
      
      // Si hay eventos de rutina, usar el último para determinar el modo
      if (routineEvents.length > 0) {
        const lastRoutineEvent = routineEvents[0];
        const correctMode = lastRoutineEvent.eventType === 'noche_inicio';
        
        if (correctMode !== isNightMode) {
          setIsNightMode(correctMode);
          localStorage.setItem('isNightMode', correctMode.toString());
        }
      }
      
      // Detectar si hay una siesta activa (inicio sin fin)
      const siestaEvents = todayEvents.filter((e: any) => 
        e.eventType === 'siesta_inicio' || e.eventType === 'siesta_fin'
      ).sort((a: any, b: any) => 
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
      );
      
      if (siestaEvents.length > 0) {
        const lastSiestaEvent = siestaEvents[0];
        const siestaActive = lastSiestaEvent.eventType === 'siesta_inicio';
        setHasActiveSiesta(siestaActive);
      } else {
        setHasActiveSiesta(false);
      }
    }
  }, [todayEvents]);
  
  // Guardar en localStorage cuando cambie el modo manualmente
  useEffect(() => {
    localStorage.setItem('isNightMode', isNightMode.toString());
  }, [isNightMode]);

  // Mutations
  const registerEvent = trpc.events.register.useMutation({
    onSuccess: () => {
      toast.success("✅ Evento registrado exitosamente");
      utils.events.getToday.invalidate();
      setShowEventDialog(false);
      setSelectedEvent(null);
      setComments("");
      setEventTime("");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleEventClick = (eventType: string) => {
    setSelectedEvent(eventType);
    setEventTime(new Date().toTimeString().slice(0, 5));
    setShowEventDialog(true);
  };

  const handleRoutineClick = (action: 'start' | 'end') => {
    setRoutineAction(action);
    setRoutineTime(new Date().toTimeString().slice(0, 5));
    setShowRoutineDialog(true);
  };

  const handleRegisterEvent = () => {
    if (!selectedEvent) return;

    const [hours, minutes] = eventTime.split(':');
    const now = new Date();
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));

    registerEvent.mutate({
      eventType: selectedEvent as any,
      eventTime: eventDate,
      comments: comments || undefined,
    });
  };

  const handleRegisterRoutine = async () => {
    if (!routineAction) return;

    // Guardar el valor de routineAction antes de limpiarlo
    const action = routineAction;
    const time = routineTime;

    // Cambiar el modo INMEDIATAMENTE antes de hacer la petición
    if (action === 'start') {
      setIsNightMode(true);
    } else {
      setIsNightMode(false);
    }

    // Cerrar el diálogo inmediatamente
    setShowRoutineDialog(false);
    setRoutineAction(null);
    setRoutineTime("");

    const [hours, minutes] = time.split(':');
    const now = new Date();
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));

    const eventType = action === 'start' ? 'noche_inicio' : 'noche_fin';

    try {
      await registerEvent.mutateAsync({
        eventType: eventType as any,
        eventTime: eventDate,
        comments: undefined,
      });

      // Invalidar queries para recargar datos
      await utils.events.getToday.invalidate();

      toast.success("✅ Rutina registrada exitosamente");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      // Si hay error, revertir el cambio de modo
      if (action === 'start') {
        setIsNightMode(false);
      } else {
        setIsNightMode(true);
      }
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlaceholder = () => {
    const eventConfig = ALL_EVENT_TYPES.find((e) => e.type === selectedEvent);
    if (eventConfig && 'placeholders' in eventConfig) {
      const placeholders = eventConfig.placeholders as string[];
      return placeholders[Math.floor(Math.random() * placeholders.length)];
    }
    return "Agrega un comentario...";
  };

  if (loading || babyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!baby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <BabyIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No tienes una cuenta de bebé asignada
            </h2>
            <p className="text-gray-600 mb-6">
              Por favor contacta al administrador para que te asigne una cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar el fondo según el modo
  const backgroundClass = isNightMode 
    ? "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900" 
    : "bg-gradient-to-br from-background via-primary/5 to-secondary/5";

  const textColorClass = isNightMode ? "text-white" : "text-slate-900";
  const cardBgClass = isNightMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen transition-all duration-1000 ${backgroundClass}`}>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Baby Profile Card with decorative elements */}
        <Card className={`mb-6 shadow-baby-soft hover:shadow-baby-hover transition-all duration-1000 relative overflow-hidden ${cardBgClass}`}>
          {/* Decorative stars for night mode */}
          {isNightMode && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <Stars className="absolute top-4 right-8 w-6 h-6 text-purple-300 opacity-40 animate-twinkle" style={{ animationDelay: '0s' }} />
              <Stars className="absolute top-12 right-20 w-4 h-4 text-indigo-300 opacity-30 animate-twinkle" style={{ animationDelay: '0.5s' }} />
              <Stars className="absolute top-8 right-32 w-5 h-5 text-purple-200 opacity-35 animate-twinkle" style={{ animationDelay: '1s' }} />
            </div>
          )}
          
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-1000">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 ${
                    isNightMode 
                      ? "bg-purple-400 border-slate-800" 
                      : "bg-green-400 border-white"
                  } animate-pulse`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-3xl font-bold transition-all duration-1000 ${
                      isNightMode 
                        ? "bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent" 
                        : "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    }`}>
                      {baby.name}
                    </h1>
                    {/* Status badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-1000 ${
                      isNightMode 
                        ? "bg-purple-900/50 text-purple-200 border border-purple-600" 
                        : "bg-green-100 text-green-700 border border-green-300"
                    }`}>
                      {isNightMode ? '🌙 Durmiendo' : '☀️ Despierto'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-4 mt-1 text-sm transition-all duration-1000 ${
                    isNightMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {baby.ageMonths} meses
                    </span>
                    {baby.weightKg && (
                      <span className="flex items-center gap-1">
                        <Weight className="w-4 h-4" />
                        {baby.weightKg} kg
                      </span>
                    )}
                    {baby.heightCm && (
                      <span className="flex items-center gap-1">
                        <Ruler className="w-4 h-4" />
                        {baby.heightCm} cm
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowRoutine(true)}
                  className={`transition-all duration-1000 ${
                    isNightMode 
                      ? "bg-purple-900/50 hover:bg-purple-800/50 border-purple-600 text-purple-200" 
                      : "bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-primary/30"
                  }`}
                >
                  Ver Rutina
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('token');
                    setLocation('/login');
                    toast.success('¡Hasta pronto! 👋');
                  }}
                  className={`transition-all duration-1000 ${
                    isNightMode 
                      ? "bg-red-900/50 hover:bg-red-800/50 border-red-600 text-red-200" 
                      : "bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-red-300"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routine Control Buttons - Grandes y destacados */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {!isNightMode ? (
            <Button
              onClick={() => handleRoutineClick('start')}
              disabled={baby.accountStatus === "suspended"}
              className="h-24 text-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 shadow-2xl disabled:opacity-50 transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <Moon className="w-8 h-8" />
                  <Stars className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Iniciar Rutina de Sueño Nocturno</p>
                  <p className="text-sm opacity-90">Comenzar la noche</p>
                </div>
              </div>
            </Button>
          ) : (
            <Button
              onClick={() => handleRoutineClick('end')}
              disabled={baby.accountStatus === "suspended"}
              className="h-24 text-xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 hover:from-orange-600 hover:via-yellow-600 hover:to-orange-700 shadow-2xl disabled:opacity-50 transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2">
                <Sun className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-bold">Finalizar Rutina - Despertar Mañana</p>
                  <p className="text-sm opacity-90">Terminar la noche y generar resumen</p>
                </div>
              </div>
            </Button>
          )}
        </div>

        {/* Event Registration */}
        <Card className={`mb-6 shadow-xl transition-all duration-1000 ${cardBgClass}`}>
          <CardContent className="pt-6">
            <h2 className={`text-xl font-bold mb-4 transition-all duration-1000 ${textColorClass}`}>
              {isNightMode ? "🌙 Eventos Nocturnos" : "☀️ Registrar Evento del Día"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(isNightMode ? NIGHT_EVENT_TYPES : (hasActiveSiesta ? DAY_EVENT_TYPES.filter(e => e.type === 'siesta_fin') : DAY_EVENT_TYPES)).map(({ type, label, icon: Icon, color, bgColor, textColor }) => (
                <button
                  key={type}
                  onClick={() => handleEventClick(type)}
                  disabled={baby.accountStatus === "suspended"}
                  className={`${bgColor} p-4 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-slate-300`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className={`font-semibold text-sm ${textColor}`}>{label}</p>
                  {'sublabel' in { type, label, icon: Icon, color, bgColor, textColor } && (
                    <p className="text-xs text-slate-500 mt-0.5">{(DAY_EVENT_TYPES.find(e => e.type === type) as any)?.sublabel}</p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline de eventos del día */}
        {todayEvents && todayEvents.length > 0 && (
          <Card className={`shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all duration-1000 ${cardBgClass}`}>
            <CardContent className="pt-6">
              {/* Header con estadísticas */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-2xl font-bold flex items-center gap-2 transition-all duration-1000 ${
                    isNightMode 
                      ? "bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent" 
                      : "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  }`}>
                    <Clock className={`w-6 h-6 ${isNightMode ? "text-purple-300" : "text-primary"}`} />
                    Timeline de Hoy
                  </h2>
                  <div className={`px-4 py-2 rounded-full border transition-all duration-1000 ${
                    isNightMode 
                      ? "bg-purple-900/50 border-purple-600" 
                      : "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
                  }`}>
                    <span className={`text-sm font-bold transition-all duration-1000 ${
                      isNightMode ? "text-purple-200" : "text-primary"
                    }`}>
                      {todayEvents.length} eventos
                    </span>
                  </div>
                </div>
                
                {/* Barra de progreso del día */}
                <div className={`h-2 rounded-full overflow-hidden transition-all duration-1000 ${
                  isNightMode ? "bg-slate-700" : "bg-slate-200"
                }`}>
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      isNightMode 
                        ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600" 
                        : "bg-gradient-to-r from-primary via-purple-500 to-secondary"
                    }`}
                    style={{ width: `${Math.min((todayEvents.length / 15) * 100, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-right transition-all duration-1000 ${
                  isNightMode ? "text-slate-400" : "text-slate-500"
                }`}>
                  {todayEvents.length} / 15 eventos recomendados
                </p>
              </div>

              {/* Timeline con línea conectora */}
              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className={`absolute left-6 top-0 bottom-0 w-0.5 transition-all duration-1000 ${
                  isNightMode 
                    ? "bg-gradient-to-b from-purple-500 via-indigo-400 to-purple-600" 
                    : "bg-gradient-to-b from-primary via-purple-300 to-secondary"
                }`} />
                
                <div className="space-y-4">
                  {todayEvents.map((event: any, index: number) => {
                    const eventConfig = ALL_EVENT_TYPES.find((e) => e.type === event.eventType);
                    const Icon = eventConfig?.icon || Clock;
                    
                    return (
                      <div
                        key={event.id}
                        className="relative animate-in fade-in slide-in-from-left-4 duration-500"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Punto en la línea del timeline */}
                        <div className="absolute left-6 top-6 w-3 h-3 -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className={`w-full h-full rounded-full bg-gradient-to-br ${eventConfig?.color} animate-pulse shadow-lg`} />
                        </div>
                        
                        {/* Tarjeta del evento */}
                        <div className="ml-14 group">
                          <div className={`${eventConfig?.bgColor} rounded-2xl p-5 shadow-baby-soft hover:shadow-baby-hover transition-all duration-300 border border-slate-200/50 hover:border-slate-300 hover:scale-[1.02] cursor-pointer`}>
                            <div className="flex items-start gap-4">
                              {/* Icono grande animado */}
                              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${eventConfig?.color} flex items-center justify-center shadow-xl flex-shrink-0 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                              
                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className={`font-bold text-lg ${eventConfig?.textColor}`}>
                                      {eventConfig?.label}
                                    </p>
                                    {(eventConfig as any)?.sublabel && (
                                      <p className="text-sm text-slate-600 font-medium">
                                        {(eventConfig as any).sublabel}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xl font-bold text-slate-700">
                                      {formatTime(event.eventTime)}
                                    </span>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      hace {Math.floor((new Date().getTime() - new Date(event.eventTime).getTime()) / (1000 * 60))} min
                                    </p>
                                  </div>
                                </div>
                                {event.comments && (
                                  <div className="mt-3 p-3 bg-white/60 rounded-lg border border-slate-200/50">
                                    <p className="text-sm text-slate-700 italic">💬 {event.comments}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialog para registrar evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Evento</DialogTitle>
            <DialogDescription>
              {ALL_EVENT_TYPES.find((e) => e.type === selectedEvent)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eventTime">Hora del Evento</Label>
              <Input
                id="eventTime"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                🕒 Puedes modificar la hora si el evento ocurrió antes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comentarios (opcional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={getPlaceholder()}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRegisterEvent}
              disabled={registerEvent.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              ✨ Registrar Evento
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEventDialog(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para iniciar/finalizar rutina */}
      <Dialog open={showRoutineDialog} onOpenChange={setShowRoutineDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {routineAction === 'start' ? '🌙 Iniciar Rutina de Sueño' : '☀️ Finalizar Rutina'}
            </DialogTitle>
            <DialogDescription>
              {routineAction === 'start' 
                ? 'Registra la hora en que comienza la rutina nocturna' 
                : 'Registra la hora en que el bebé despertó por la mañana'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routineTime">Hora</Label>
              <Input
                id="routineTime"
                type="time"
                value={routineTime}
                onChange={(e) => setRoutineTime(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                🕒 Ajusta la hora si no la registraste en el momento exacto
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRegisterRoutine}
              disabled={registerEvent.isPending}
              className={`flex-1 ${
                routineAction === 'start' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-orange-500 to-yellow-500'
              }`}
            >
              {routineAction === 'start' ? '🌙 Iniciar Rutina' : '☀️ Finalizar Rutina'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRoutineDialog(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver rutina */}
      <Dialog open={showRoutine} onOpenChange={setShowRoutine}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">📋 Rutina de Sueño</DialogTitle>
            <DialogDescription>
              Rutina personalizada para {baby.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {baby.initialRoutine || "No hay rutina definida"}
              </p>
            </div>
            {baby.routineStartTime && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900">
                  ⏰ Hora de inicio de rutina: {baby.routineStartTime}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

