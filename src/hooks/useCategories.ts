import { useQuery } from '@tanstack/react-query';
import { generalService } from '@/services/general.service';

// Query keys
export const categoryKeys = {
    all: ['categorias'] as const,
    principales: ['categorias', 'principales'] as const,
    subcategorias: (idPadre: number) => ['categorias', 'sub', idPadre] as const,
};

export function useCategoriasPrincipales() {
    return useQuery({
        queryKey: categoryKeys.principales,
        queryFn: generalService.getCategoriasPrincipales,
    });
}

export function useSubcategorias(idPadre: number | undefined) {
    return useQuery({
        queryKey: categoryKeys.subcategorias(idPadre!),
        queryFn: () => generalService.getSubcategorias(idPadre!),
        enabled: !!idPadre, // Solo ejecutar si hay idPadre
    });
}
