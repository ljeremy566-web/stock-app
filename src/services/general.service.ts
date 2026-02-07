import api from '@/api/axios';
import { Categoria, Talla, Color, Proveedor } from '@/types/inventory.types';

export const generalService = {
    getCategorias: async () => (await api.get<Categoria[]>('/almacenero/categorias')).data,

    getCategoriasPrincipales: async () => (await api.get<Categoria[]>('/almacenero/categorias/principales')).data,

    getSubcategorias: async (idPadre: number) => (await api.get<Categoria[]>(`/almacenero/categorias/${idPadre}/subcategorias`)).data,

    getTallas: async () => (await api.get<Talla[]>('/almacenero/tallas')).data,

    getColores: async () => (await api.get<Color[]>('/almacenero/colores')).data,

    getProveedores: async () => (await api.get<Proveedor[]>('/almacenero/proveedores')).data,
};
