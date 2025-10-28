import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Baby, Calendar, Clock, Download, LogOut, Plus, User, Users, Weight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    parentUsername: "",
    parentPassword: "",
    babyName: "",
    birthDate: "",
    ageMonths: "",
    weightKg: "",
    heightCm: "",
    initialRoutine: "",
    routineStartTime: "20:00",
  });

  const { data: babies, refetch: refetchBabies } = trpc.baby.getAll.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const createBabyMutation = trpc.baby.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Cuenta creada exitosamente para ${data.baby.name}`, {
        description: `Usuario: ${data.parentUsername} | Contraseña: ${data.parentPassword}`,
        duration: 10000,
      });
      setShowCreateForm(false);
      setFormData({
        parentUsername: "",
        parentPassword: "",
        babyName: "",
        birthDate: "",
        ageMonths: "",
        weightKg: "",
        heightCm: "",
        initialRoutine: "",
        routineStartTime: "20:00",
      });
      refetchBabies();
    },
    onError: (error) => {
      toast.error("Error al crear cuenta", {
        description: error.message,
      });
    },
  });

  const toggleSuspensionMutation = trpc.baby.toggleSuspension.useMutation({
    onSuccess: () => {
      toast.success("Estado de cuenta actualizado");
      refetchBabies();
    },
  });

  const handleCreateBaby = () => {
    if (!formData.parentUsername || !formData.parentPassword || !formData.babyName) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    createBabyMutation.mutate({
      parentUsername: formData.parentUsername,
      parentPassword: formData.parentPassword,
      name: formData.babyName,
      birthDate: formData.birthDate || undefined,
      ageMonths: formData.ageMonths ? parseInt(formData.ageMonths) : undefined,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
      initialRoutine: formData.initialRoutine || undefined,
      routineStartTime: formData.routineStartTime || undefined,
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">Solo los administradores pueden acceder a este panel.</p>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Panel de Administrador</h1>
              <p className="text-sm text-gray-500">{user.name}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Cuentas</p>
                <p className="text-3xl font-bold mt-1">{babies?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Cuentas Activas</p>
                <p className="text-3xl font-bold mt-1">
                  {babies?.filter(b => b.accountStatus === 'active').length || 0}
                </p>
              </div>
              <Baby className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Suspendidas</p>
                <p className="text-3xl font-bold mt-1">
                  {babies?.filter(b => b.accountStatus === 'suspended').length || 0}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showCreateForm ? "Cancelar" : "Crear Nueva Cuenta"}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6 mb-8 shadow-xl border-2 border-purple-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-600" />
              Nueva Cuenta de Padre
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credenciales */}
              <div className="space-y-4 md:col-span-2 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Credenciales de Acceso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentUsername">Usuario *</Label>
                    <Input
                      id="parentUsername"
                      value={formData.parentUsername}
                      onChange={(e) => setFormData({ ...formData, parentUsername: e.target.value })}
                      placeholder="ej: maria_garcia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPassword">Contraseña *</Label>
                    <Input
                      id="parentPassword"
                      type="text"
                      value={formData.parentPassword}
                      onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                      placeholder="ej: password123"
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Bebé */}
              <div className="space-y-4 md:col-span-2 bg-pink-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-pink-600" />
                  Datos del Bebé
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="babyName">Nombre del Bebé *</Label>
                    <Input
                      id="babyName"
                      value={formData.babyName}
                      onChange={(e) => setFormData({ ...formData, babyName: e.target.value })}
                      placeholder="ej: Sofía"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageMonths">Edad (meses)</Label>
                    <Input
                      id="ageMonths"
                      type="number"
                      value={formData.ageMonths}
                      onChange={(e) => setFormData({ ...formData, ageMonths: e.target.value })}
                      placeholder="ej: 6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Peso (kg)</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="ej: 7.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heightCm">Talla (cm)</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      step="0.1"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      placeholder="ej: 68"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routineStartTime">Hora de Inicio de Rutina</Label>
                    <Input
                      id="routineStartTime"
                      type="time"
                      value={formData.routineStartTime}
                      onChange={(e) => setFormData({ ...formData, routineStartTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Rutina Inicial */}
              <div className="md:col-span-2 space-y-2 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Rutina Inicial (Receta de Sueño)
                </h3>
                <Textarea
                  id="initialRoutine"
                  value={formData.initialRoutine}
                  onChange={(e) => setFormData({ ...formData, initialRoutine: e.target.value })}
                  placeholder="Escribe aquí la rutina personalizada para este bebé..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleCreateBaby}
                disabled={createBabyMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                {createBabyMutation.isPending ? "Creando..." : "✨ Crear Cuenta"}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                size="lg"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {/* Babies List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cuentas Registradas</h2>
          
          {!babies || babies.length === 0 ? (
            <Card className="p-12 text-center shadow-lg">
              <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay cuentas registradas aún</p>
              <p className="text-gray-400 text-sm mt-2">Crea la primera cuenta usando el botón de arriba</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {babies.map((baby) => (
                <Card key={baby.id} className="p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Baby className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{baby.name}</h3>
                        <p className="text-sm text-gray-500">
                          {baby.ageMonths ? `${baby.ageMonths} meses` : 'Edad no especificada'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        baby.accountStatus === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {baby.accountStatus === 'active' ? '✓ Activa' : '⏸ Suspendida'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {baby.weightKg && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Weight className="w-4 h-4" />
                        <span>Peso: {baby.weightKg} kg</span>
                      </div>
                    )}
                    {baby.heightCm && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">📏</span>
                        <span>Talla: {baby.heightCm} cm</span>
                      </div>
                    )}
                    {baby.routineStartTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Rutina: {baby.routineStartTime}</span>
                      </div>
                    )}
                  </div>

                  {baby.initialRoutine && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700 line-clamp-3">{baby.initialRoutine}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => setSelectedBabyId(baby.id)}
                      variant="outline"
                      className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      📊 Ver Eventos y Descargar
                    </Button>
                    <Button
                      onClick={() => toggleSuspensionMutation.mutate({ babyId: baby.id })}
                      variant={baby.accountStatus === 'active' ? 'destructive' : 'default'}
                      className="w-full"
                      disabled={toggleSuspensionMutation.isPending}
                    >
                      {baby.accountStatus === 'active' ? '⏸ Suspender Cuenta' : '▶ Activar Cuenta'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events Dialog */}
      {selectedBabyId && (
        <EventsDialog
          babyId={selectedBabyId}
          onClose={() => setSelectedBabyId(null)}
        />
      )}
    </div>
  );
}

// Events Dialog Component
function EventsDialog({ babyId, onClose }: { babyId: string; onClose: () => void }) {
  const { data: events, isLoading } = trpc.events.getByBaby.useQuery({ babyId });
  const { data: baby } = trpc.baby.getById.useQuery({ babyId });
  const exportCSVQuery = trpc.events.exportCSV.useQuery({ babyId }, { enabled: false });

  const handleDownload = async () => {
    const result = await exportCSVQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.data.filename;
      link.click();
      toast.success('Resumen descargado exitosamente');
    }
  };

  const formatEventType = (type: string) => {
    const types: Record<string, string> = {
      'siesta_inicio': '🛌 Siesta - Inicio',
      'siesta_fin': '☀️ Despertar - Siesta',
      'noche_inicio': '🌙 Dormir - Noche',
      'noche_fin': '☀️ Despertar - Mañana',
      'despertar': '🌟 Despertar Nocturno',
      'alimento': '🍼 Comida',
      'baño': '🛁 Baño',
      'cambio': '🧤 Cambio de Pañal',
      'llanto': '😢 Llanto',
      'juego': '🎲 Juego/Estimulación',
    };
    return types[type] || type;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>📊 Eventos de {baby?.name}</span>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100"
              disabled={exportCSVQuery.isFetching}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Cargando eventos...</p>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay eventos registrados aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-semibold text-blue-900">
                Total de eventos: {events.length}
              </p>
            </div>
            {events.map((event: any) => (
              <div
                key={event.id}
                className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {formatEventType(event.eventType)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.eventTime).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {event.comments && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        💬 {event.comments}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(event.eventTime).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.dayNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        Día {event.dayNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

