import api from '@/api/axios';
import { Producto } from '@/types/inventory.types';

export const productService = {
    // Obtener todos los productos del almacén
    getAll: async (): Promise<Producto[]> => {
        const response = await api.get<Producto[]>('/almacenero/productos');
        return response.data;
    },

    // Crear producto completo (con variantes si las tiene)
    create: async (producto: Producto): Promise<Producto> => {
        const response = await api.post<Producto>('/almacenero/productos', producto);
        return response.data;
    },

    // Actualizar producto
    update: async (id: number, producto: Producto): Promise<Producto> => {
        const response = await api.put<Producto>(`/almacenero/productos/${id}`, producto);
        return response.data;
    },

    // Eliminar producto
    delete: async (id: number): Promise<void> => {
        await api.delete(`/almacenero/productos/${id}`);
    }
};

