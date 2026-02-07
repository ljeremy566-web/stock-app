// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { PropsWithChildren } from 'react';

/**
 * Wrapper que protege rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige al login.
 */
export default function ProtectedRoute({ children }: PropsWithChildren) {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Redirigir al login si no hay sesión válida
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
