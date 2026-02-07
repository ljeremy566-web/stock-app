// src/services/auth.service.ts
import api from '@/api/axios';
import { SignInRequest, AuthenticationResponse } from '@/types/auth.types';
import { jwtDecode } from "jwt-decode"; // <--- IMPORTANTE

// Definimos qué trae tu token por dentro (Claims)
interface JwtPayload {
    sub: string;       // Usuario (subject)
    roles: string[];   // Lista de roles (Ej: ['ROLE_ADMIN'])
    exp: number;       // Fecha de expiración
    iat: number;       // Fecha de creación
}

export const authService = {

    login: async (credentials: SignInRequest): Promise<AuthenticationResponse> => {
        const response = await api.post<AuthenticationResponse>('/autenticacion/signin', credentials);

        if (response.data.status && response.data.jwt) {
            localStorage.setItem('token', response.data.jwt);
            localStorage.setItem('user', response.data.username);
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('token');
        // Simplificado: solo verificar que existe el token
        // El backend valida si expiró o no
        return !!token;
    },

    getCurrentUser: (): string | null => {
        return localStorage.getItem('user');
    },

    // --- NUEVO: OBTENER EL ROL ---
    getRoles: (): string[] => {
        const token = localStorage.getItem('token');
        if (!token) return [];
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            // Spring Boot suele devolver los roles en "authorities" o "roles"
            // Ajustaremos esto si tu backend usa otro nombre
            return decoded.roles || [];
        } catch (error) {
            return [];
        }
    },

    // Utilidad rápida para preguntar si es Admin
    isAdmin: (): boolean => {
        const roles = authService.getRoles();
        // Verifica si la lista incluye el rol exacto que tienes en Java
        return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
    }
};