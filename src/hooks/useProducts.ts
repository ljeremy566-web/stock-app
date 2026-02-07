import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Producto } from '@/types/inventory.types';

// Query keys
export const productKeys = {
    all: ['products'] as const,
    detail: (id: number) => ['products', id] as const,
};

// === QUERIES ===

export function useProducts() {
    return useQuery({
        queryKey: productKeys.all,
        queryFn: productService.getAll,
    });
}

// === MUTATIONS ===

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (producto: Producto) => productService.create(producto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, producto }: { id: number; producto: Producto }) =>
            productService.update(id, producto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}
