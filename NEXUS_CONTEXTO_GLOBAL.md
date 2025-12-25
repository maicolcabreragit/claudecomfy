# NEXUS_CONTEXTO_GLOBAL.md

## Análisis Exhaustivo del Proyecto ComfyClaude OS / ComfyLink

**Fecha de análisis:** 25 de diciembre de 2025  
**Arquitecto:** Antigravity AI Senior Architect  
**Propósito:** Base para reestructuración masiva UI/UX - Diseño Absolutista

---

## 1. Estructura del Proyecto

### Árbol de Directorios

```
C:\APP_CHAT_CLAUDE\
│
├── 📁 src/                          # Código fuente principal
│   ├── 📁 app/                      # Next.js 15 App Router
│   │   ├── 📄 layout.tsx            # Root layout (Inter + JetBrains Mono)
│   │   ├── 📄 page.tsx              # Homepage - Business Cockpit
│   │   ├── 📄 globals.css           # Sistema de diseño (457 líneas)
│   │   │
│   │   ├── 📁 api/                  # API Routes (Backend)
│   │   │   ├── 📁 chat/             # Claude Opus streaming
│   │   │   ├── 📁 conversations/    # CRUD conversaciones
│   │   │   │   └── 📁 [id]/         # Detalle + mensajes
│   │   │   ├── 📁 extension/        # Chrome Extension APIs
│   │   │   │   ├── ocr/             # Google Cloud Vision
│   │   │   │   ├── screenshot/      # Captura pantalla
│   │   │   │   ├── verify/          # Verificación
│   │   │   │   └── verify-step/     # Gemini Flash
│   │   │   ├── 📁 projects/         # Agency Mode
│   │   │   ├── 📁 snippets/         # La Bóveda
│   │   │   └── 📁 trends/           # Trend Radar System
│   │   │       ├── audio/           # ElevenLabs TTS
│   │   │       ├── digest/          # Resumen semanal
│   │   │       ├── learn/           # Análisis profundo
│   │   │       └── to-chat/         # Curso → Chat
│   │   │
│   │   └── 📁 trends/               # Dashboard tendencias
│   │       └── page.tsx             # (~420 líneas)
│   │
│   ├── 📁 components/               # Componentes React
│   │   ├── 📁 chat/                 # Core UI
│   │   │   ├── ChatInterface.tsx    # 724 líneas - Principal
│   │   │   ├── ConversationList.tsx # Historial
│   │   │   ├── CourseProgress.tsx   # Progreso academia
│   │   │   ├── KnowledgeSidebar.tsx # Contexto
│   │   │   ├── LessonCard.tsx       # Lecciones
│   │   │   ├── MarkdownRenderer.tsx # Markdown
│   │   │   ├── ProgressBar.tsx      # Fases
│   │   │   ├── ProjectSelector.tsx  # Proyectos
│   │   │   ├── SnippetManager.tsx   # La Bóveda modal
│   │   │   ├── TaskCard.tsx         # Tarjetas tareas
│   │   │   ├── TaskList.tsx         # Lista tareas
│   │   │   └── ThinkingBlock.tsx    # Extended thinking
│   │   ├── 📁 sidebar/              # (Vacío)
│   │   └── 📁 ui/                   # (Vacío)
│   │
│   └── 📁 lib/                      # Utilidades
│       ├── parse-claude-export.ts   # Parser Claude exports
│       ├── parse-tasks.ts           # Extracción tareas
│       └── utils.ts                 # Helpers (cn)
│
├── 📁 prisma/                       # Base de datos
│   ├── schema.prisma                # 202 líneas - 9 modelos
│   └── seed.ts                      # Datos iniciales
│
├── 📁 comfylink-extension/          # Chrome Extension (Plasmo)
│   └── (18 archivos)                # Manifest V3
│
├── 📁 public/                       # Assets estáticos
├── 📁 secrets/                      # Credenciales GCP
├── 📄 docker-compose.yml            # PostgreSQL
├── 📄 Dockerfile                    # Contenedor producción
├── 📄 STATUS_REPORT.md              # Estado actual
└── 📄 package.json                  # Dependencias
```

### Descripción de Carpetas Principales

| Carpeta                | Función                        | Estado             |
| ---------------------- | ------------------------------ | ------------------ |
| `src/app/`             | Next.js App Router - SSR + API | ✅ Activa          |
| `src/components/chat/` | 12 componentes UI principales  | ⚠️ Sin modularizar |
| `src/lib/`             | Utilidades compartidas         | ⚠️ Mínima          |
| `prisma/`              | ORM + Schema PostgreSQL        | ✅ 9 modelos       |
| `comfylink-extension/` | Chrome Extension Plasmo        | ✅ Funcional       |

---

## 2. Stack Tecnológico Actual

### Frontend

| Tecnología         | Versión | Uso                              |
| ------------------ | ------- | -------------------------------- |
| **Next.js**        | 15.1.3  | Framework principal (App Router) |
| **React**          | 19.0.0  | UI Library                       |
| **TypeScript**     | ^5      | Tipado estático                  |
| **Tailwind CSS**   | 3.4.1   | Estilos utility-first            |
| **Radix UI**       | Latest  | Collapsible, Dialog, Slot        |
| **Lucide React**   | 0.562.0 | Iconos                           |
| **React Markdown** | 10.1.0  | Renderizado MD                   |

### Backend / APIs

| Tecnología                | Versión | Uso              |
| ------------------------- | ------- | ---------------- |
| **Prisma**                | 6.1.0   | ORM PostgreSQL   |
| **Vercel AI SDK**         | 3.4.33  | Streaming Claude |
| **@ai-sdk/anthropic**     | 0.0.56  | Provider Claude  |
| **@google-cloud/vision**  | 5.3.4   | OCR screenshots  |
| **@google/generative-ai** | 0.24.1  | Gemini Flash/Pro |
| **@tavily/core**          | 0.6.3   | Web search       |
| **Zod**                   | 3.23.8  | Validación       |

### Base de Datos

| Sistema           | Detalles                                                                              |
| ----------------- | ------------------------------------------------------------------------------------- |
| **PostgreSQL**    | Via Docker Compose                                                                    |
| **Prisma Client** | 6.1.0                                                                                 |
| **Modelos**       | User, Project, Conversation, Message, KnowledgeBase, Snippet, Workflow, ApiKey, Trend |

### Servicios Externos Configurados

| Servicio                | API Key | Uso                 |
| ----------------------- | ------- | ------------------- |
| Anthropic (Claude Opus) | ✅      | Chat principal      |
| Google Cloud Vision     | ✅      | OCR screenshots     |
| Google Gemini           | ✅      | Análisis trends     |
| Google Custom Search    | ✅      | Trend Radar         |
| Tavily                  | ✅      | Web search fallback |
| ElevenLabs              | ✅      | Audio podcasts      |

---

## 3. Análisis de UI/UX Actual

### Flujo de Usuario Principal

```
1. Usuario abre / (Homepage)
   ├── Ve sidebar izquierdo (ConversationList)
   ├── Ve chat vacío o conversación existente
   └── Puede: Nueva conversación, seleccionar existente, abrir Bóveda

2. Usuario escribe mensaje
   ├── Input con soporte drag-and-drop imágenes
   ├── Envío → Streaming Claude
   ├── Renderizado Markdown + Thinking blocks
   └── Persistencia automática en DB

3. Usuario navega a /trends
   ├── Sidebar con filtros (fecha, categoría)
   ├── Lista de tendencias con heat score
   ├── Botones: Aprender, Podcast, Buscar
   └── Audio player sticky cuando genera podcast
```

### Componentes Visuales Principales

| Componente             | Líneas | Complejidad | Estado            |
| ---------------------- | ------ | ----------- | ----------------- |
| `ChatInterface.tsx`    | 724    | 🔴 Alta     | Monolítico        |
| `trends/page.tsx`      | 420    | 🟡 Media    | Denso             |
| `ConversationList.tsx` | ~200   | 🟢 Baja     | OK                |
| `ThinkingBlock.tsx`    | ~100   | 🟢 Baja     | OK                |
| `globals.css`          | 457    | 🟡 Media    | Bien estructurado |

### Puntos de Dolor Actuales

#### 🔴 Críticos

1. **ChatInterface.tsx (724 líneas)** - Monolítico

   - Mezcla estado, efectos y UI
   - Debe dividirse en: ChatContainer, MessageList, InputArea

2. **Carpetas UI vacías** - `src/components/ui/` vacío

   - No hay Button, Input, Card reutilizables

3. **Sin estado global**
   - Prop drilling severo
   - No hay Context ni Zustand

#### 🟡 Importantes

4. **Sin navegación visible** - Solo conociendo URLs
5. **trends/page.tsx** - Lógica inline
6. **Responsive parcial** - Sidebar 264px fijo

---

## 4. Lógica y Seguridad

### Autenticación - Estado Actual

```typescript
// ⚠️ CRÍTICO: Sin autenticación real
const DEFAULT_USER_ID = "default-user-id";
```

**Problemas:**

- Todos los usuarios comparten mismo ID
- No hay login/logout
- No hay protección de rutas

### Seguridad de APIs

| Endpoint             | Protección | Riesgo   |
| -------------------- | ---------- | -------- |
| `/api/chat`          | ❌ Ninguna | 🔴 Alto  |
| `/api/conversations` | ❌ Ninguna | 🟡 Medio |
| `/api/trends`        | ❌ Ninguna | 🟢 Bajo  |

### Datos Sensibles

| Dato            | Ubicación    | Estado           |
| --------------- | ------------ | ---------------- |
| API Keys        | `.env.local` | ✅ No versionado |
| DB Password     | `.env.local` | ✅ No versionado |
| GCP Credentials | `secrets/`   | ⚠️ Local         |

---

## 5. Objetivos de Código - Diseño Totalitario

### Refactorizaciones Prioritarias

#### Fase 1: Componentes UI Base

```
src/components/ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── Badge.tsx
└── Skeleton.tsx
```

#### Fase 2: Dividir ChatInterface

```
src/components/chat/
├── ChatContainer.tsx  # Estado + lógica
├── MessageList.tsx    # Solo renderizado
├── MessageBubble.tsx  # Individual
└── InputArea.tsx      # Input + attachments
```

#### Fase 3: Estado Global (Zustand)

```typescript
interface AppState {
  userId: string | null;
  conversationId: string | null;
  sidebarOpen: boolean;
  activeView: "chat" | "trends" | "vault";
}
```

#### Fase 4: Design Tokens Absolutistas

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 32px;

  --bg-base: #09090b;
  --bg-elevated: #18181b;
  --accent: #a855f7;

  --radius-sm: 6px;
  --radius-lg: 12px;

  --transition: 150ms ease-out;
}
```

### Prioridades de Implementación

| Sprint | Objetivo                        | Duración |
| ------ | ------------------------------- | -------- |
| 1      | Componentes UI base + Navbar    | 1 semana |
| 2      | Dividir ChatInterface + Zustand | 1 semana |
| 3      | Autenticación NextAuth/Supabase | 1 semana |
| 4      | Performance + Lighthouse        | 1 semana |

---

## Conclusión

El proyecto necesita:

1. **Modularización urgente** - ChatInterface.tsx es el mayor pain point
2. **Sistema de diseño formal** - Componentes UI base inexistentes
3. **Autenticación real** - DEFAULT_USER_ID inaceptable
4. **Estado global** - Prop drilling excesivo
5. **Performance audit** - Sin métricas actuales

---

_Documento generado para planificación de reestructuración masiva._
_No realizar cambios hasta aprobación del plan._
