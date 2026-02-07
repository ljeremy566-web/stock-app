import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersService } from '@/services/masters.service';
import { Color, Talla, Proveedor } from '@/types/inventory.types';

// Query keys
export const masterKeys = {
    colores: ['colores'] as const,
    tallas: ['tallas'] as const,
    proveedores: ['proveedores'] as const,
};

// === COLORES ===

export function useColores() {
    return useQuery({
        queryKey: masterKeys.colores,
        queryFn: mastersService.getColores,
    });
}

export function useCreateColor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Color>) => mastersService.createColor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.colores });
        },
    });
}

export function useDeleteColor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => mastersService.deleteColor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.colores });
        },
    });
}

// === TALLAS ===

export function useTallas() {
    return useQuery({
        queryKey: masterKeys.tallas,
        queryFn: mastersService.getTallas,
    });
}

export function useCreateTalla() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Talla>) => mastersService.createTalla(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.tallas });
        },
    });
}

export function useDeleteTalla() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => mastersService.deleteTalla(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.tallas });
        },
    });
}

// === PROVEEDORES ===

export function useProveedores() {
    return useQuery({
        queryKey: masterKeys.proveedores,
        queryFn: mastersService.getProveedores,
    });
}

export function useCreateProveedor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Proveedor>) => mastersService.createProveedor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.proveedores });
        },
    });
}

export function useDeleteProveedor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => mastersService.deleteProveedor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: masterKeys.proveedores });
        },
    });
}

export function useSearchRuc() {
    return useMutation({
        mutationFn: (ruc: string) => mastersService.consultaRuc(ruc),
    });
}
