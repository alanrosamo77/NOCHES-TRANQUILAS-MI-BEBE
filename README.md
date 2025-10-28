# 🌙 Noches Tranquilas BB

Aplicación web para consultores de sueño infantil y padres. Permite registrar eventos diurnos y nocturnos del bebé, con timeline visual y rutinas personalizadas.

## 🚀 Despliegue Rápido en Vercel (Gratis)

### 1. Crear cuenta en Vercel
Ve a https://vercel.com/signup y regístrate con GitHub (gratis)

### 2. Subir código a GitHub
```bash
# Crear repositorio en https://github.com/new
# Luego ejecutar:
git remote add origin https://github.com/TU-USUARIO/noches-tranquilas-bb.git
git push -u origin master
```

### 3. Conectar con Vercel
1. En Vercel, haz clic en "Add New Project"
2. Selecciona tu repositorio `noches-tranquilas-bb`
3. Vercel detectará la configuración automáticamente
4. Haz clic en "Deploy"

### 4. Configurar Base de Datos
1. Crea una base de datos PostgreSQL gratis en https://neon.tech
2. Copia la Connection String
3. En Vercel → Settings → Environment Variables, agrega:
   - `DATABASE_URL`: tu connection string de Neon
   - `NODE_ENV`: `production`

### 5. ¡Listo!
Tu aplicación estará en: `https://noches-tranquilas-bb.vercel.app`

---

## 💻 Desarrollo Local

### Requisitos
- Node.js 18+
- pnpm
- PostgreSQL

### Instalación
```bash
# Instalar dependencias
pnpm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Ejecutar migraciones
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará en http://localhost:3000

---

## 📱 Credenciales por Defecto

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Padre de Prueba:**
- Usuario: `padre`
- Contraseña: `padre123`

---

## 🎨 Características

### Para Padres
- ✅ Registro de 5 eventos diurnos (Siesta, Despertar, Comida, Baño, Juego)
- ✅ Registro de 6 eventos nocturnos (Llanto, Comida, Arrullo, Estimulación, Pañal, Otro)
- ✅ Timeline visual con iconos coloridos
- ✅ Modo día/noche automático
- ✅ Perfil del bebé con badge de estado
- ✅ Ver rutina personalizada

### Para Consultores (Admin)
- ✅ Crear cuentas de padres
- ✅ Ver todos los eventos registrados
- ✅ Exportar reportes CSV
- ✅ Gestionar suspensiones (7 días + 2 de gracia)
- ✅ Panel de administración completo

### Diseño Premium
- ✅ Animaciones suaves y profesionales
- ✅ Colores pastel apropiados para bebés
- ✅ Tipografía amigable (Quicksand, Nunito)
- ✅ Estrellas decorativas en modo nocturno
- ✅ Responsive mobile-first
- ✅ Logo personalizado integrado

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express + tRPC
- **Base de Datos:** PostgreSQL + Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui
- **Autenticación:** Wouter + Context API
- **Despliegue:** Vercel (frontend + backend)

---

## 📖 Documentación

Ver `GUIA_DESPLIEGUE_VERCEL.md` para instrucciones detalladas de despliegue.

---

## 💰 Costo

**$0/mes** usando:
- Vercel (Plan Hobby - Gratis)
- Neon (Plan Free - Gratis)

Suficiente para miles de usuarios.

---

## 📞 Soporte

Para problemas o preguntas:
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs

---

**Desarrollado con ❤️ para consultores de sueño infantil**

