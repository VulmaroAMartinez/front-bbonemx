# Guía de Migración a React + Vite

Este proyecto ha sido parcialmente refactorizado para migrar de Next.js a React + Vite.

## Estado Actual

### ✅ Completado

- [x] Estructura `/src` creada
- [x] `main.tsx` y `App.tsx` como entry points
- [x] `/src/lib/` migrado (types, utils, graphql)
- [x] `/src/contexts/` migrado (auth, notifications)
- [x] `/src/components/` parcialmente migrado (layout, ui principales)
- [x] `globals.css` copiado
- [x] Imports de Next.js eliminados en componentes core
- [x] Ejemplos de páginas: `HomePage.tsx` y `LoginPage.tsx`

### ⏳ Pendiente

1. **Migrar todas las páginas** de `app/(dashboard)/` a `src/pages/`:
   
   **Admin:**
   - `app/(dashboard)/admin/dashboard/page.tsx` → `src/pages/admin/DashboardPage.tsx`
   - `app/(dashboard)/admin/crear-ot/page.tsx` → `src/pages/admin/CrearOTPage.tsx`
   - `app/(dashboard)/admin/ordenes/page.tsx` → `src/pages/admin/OrdenesPage.tsx`
   - `app/(dashboard)/admin/ordenes/[id]/page.tsx` → `src/pages/admin/OrdenDetallePage.tsx`
   - `app/(dashboard)/admin/tecnicos/page.tsx` → `src/pages/admin/TecnicosPage.tsx`
   - `app/(dashboard)/admin/horarios/page.tsx` → `src/pages/admin/HorariosPage.tsx`
   - `app/(dashboard)/admin/asignar/page.tsx` → `src/pages/admin/AsignarPage.tsx`
   
   **Técnico:**
   - `app/(dashboard)/tecnico/asignaciones/page.tsx` → `src/pages/tecnico/AsignacionesPage.tsx`
   - `app/(dashboard)/tecnico/orden/[id]/page.tsx` → `src/pages/tecnico/OrdenDetallePage.tsx`
   - `app/(dashboard)/tecnico/horario/page.tsx` → `src/pages/tecnico/HorarioPage.tsx`
   - `app/(dashboard)/tecnico/pendientes/page.tsx` → `src/pages/tecnico/PendientesPage.tsx`
   
   **Solicitante:**
   - `app/(dashboard)/solicitante/crear-ot/page.tsx` → `src/pages/solicitante/CrearOTPage.tsx`
   - `app/(dashboard)/solicitante/mis-ordenes/page.tsx` → `src/pages/solicitante/MisOrdenesPage.tsx`
   
   **Común:**
   - `app/(dashboard)/perfil/page.tsx` → `src/pages/PerfilPage.tsx`
   - `app/(dashboard)/ordenes/[id]/page.tsx` → `src/pages/OrdenDetallePage.tsx`

2. **Actualizar imports en cada página:**
   - Eliminar `'use client'` directives (opcional en Vite)
   - Reemplazar `useRouter`, `usePathname`, `useSearchParams` de `next/navigation`
   - Reemplazar `Link` de `next/link` con `<a>` o botones (preparado para React Router)
   - Eliminar `Image` de `next/image`, usar `<img>` estándar
   - Exportar componente como default export con nombre descriptivo

3. **Copiar componentes UI restantes** a `/src/components/ui/`:
   - Todos los archivos de `components/ui/*.tsx` que aún no se copiaron

4. **Configurar React Router** en `App.tsx`:
   ```tsx
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
   
   function App() {
     return (
       <Providers>
         <BrowserRouter>
           <Routes>
             <Route path="/" element={<HomePage />} />
             <Route path="/login" element={<LoginPage />} />
             <Route path="/admin/dashboard" element={<DashboardPage />} />
             {/* ... más rutas */}
           </Routes>
         </BrowserRouter>
       </Providers>
     );
   }
   ```

5. **Configurar Vite:**
   ```bash
   npm create vite@latest . --template react-ts
   ```
   
   Luego ajustar `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';
   
   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });
   ```

6. **Actualizar `package.json`:**
   - Eliminar dependencias de Next.js
   - Añadir `react-router-dom`
   - Cambiar scripts:
     ```json
     {
       "scripts": {
         "dev": "vite",
         "build": "tsc && vite build",
         "preview": "vite preview"
       }
     }
     ```

7. **Crear `index.html`** en la raíz:
   ```html
   <!DOCTYPE html>
   <html lang="es" class="dark">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>BB Maintenance</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

8. **Limpiar archivos de Next.js:**
   - Eliminar `/app` directory
   - Eliminar `next.config.mjs`
   - Eliminar archivos de configuración de Next.js

## Patrón de Migración de Páginas

### Antes (Next.js):
```tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SomePage() {
  const router = useRouter();
  
  return (
    <div>
      <Link href="/other">Ir</Link>
      <button onClick={() => router.push('/back')}>Volver</button>
      <Image src="/logo.png" alt="Logo" width={100} height={100} />
    </div>
  );
}
```

### Después (React + Vite):
```tsx
import { useNavigate } from 'react-router-dom';

function SomePage() {
  const navigate = useNavigate();
  
  return (
    <div>
      <button onClick={() => navigate('/other')}>Ir</button>
      <button onClick={() => navigate('/back')}>Volver</button>
      <img src="/logo.png" alt="Logo" className="h-25 w-25" />
    </div>
  );
}

export default SomePage;
```

## Notas Importantes

- Todos los componentes en `/src/components/layout` usan `window.location` temporalmente
- Los comentarios `// TODO:` indican dónde integrar React Router cuando esté configurado
- El sistema GraphQL ya está preparado para trabajar con el backend real
- Los estilos de Tailwind CSS están listos en `/src/globals.css`

## Dependencias Necesarias

```bash
npm install react-router-dom
npm install -D @types/react-router-dom
npm install @vitejs/plugin-react
```

## Variables de Entorno

Crear archivo `.env` en la raíz:
```env
VITE_GRAPHQL_ENDPOINT=http://localhost:3000/graphql
```

Nota: En Vite, las variables deben tener prefijo `VITE_`
