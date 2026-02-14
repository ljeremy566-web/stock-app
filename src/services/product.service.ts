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
    },

    // --- Códigos de Barras ---

    // Obtener la IMAGEN del código de barras (PNG blob)
    getBarcodeImage: async (idProducto: number): Promise<string> => {
        try {
            // Pedimos responseType 'blob' + Accept header para imagen PNG
            const response = await api.get(`/almacenero/codigobarras/generar/${idProducto}`, {
                responseType: 'blob',
                headers: {
                    'Accept': 'image/png'
                }
            });
            // Creamos una URL local para mostrar la imagen
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('Error fetching barcode:', error);
            return '';
        }
    },

    // Obtener la IMAGEN del código de barras de una VARIANTE
    getVariantBarcodeImage: async (idVariante: number): Promise<string> => {
        try {
            const response = await api.get(`/almacenero/codigobarras/generar-variante/${idVariante}`, {
                responseType: 'blob',
                headers: {
                    'Accept': 'image/png'
                }
            });
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('Error fetching variant barcode:', error);
            return '';
        }
    }
};
