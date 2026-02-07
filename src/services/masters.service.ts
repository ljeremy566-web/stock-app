import api from '@/api/axios';
import { Categoria, Color, Talla, Proveedor, CategoriaTreeItem } from '@/types/inventory.types';

export const mastersService = {
    // --- COLORES ---
    getColores: async () => (await api.get<Color[]>('/almacenero/colores')).data,
    createColor: async (data: Partial<Color>) => (await api.post<Color>('/almacenero/colores', data)).data,
    deleteColor: async (id: number) => await api.delete(`/almacenero/colores/${id}`),

    // --- TALLAS ---
    getTallas: async () => (await api.get<Talla[]>('/almacenero/tallas')).data,
    createTalla: async (data: Partial<Talla>) => (await api.post<Talla>('/almacenero/tallas', data)).data,
    deleteTalla: async (id: number) => await api.delete(`/almacenero/tallas/${id}`),

    // --- PROVEEDORES ---
    getProveedores: async () => (await api.get<Proveedor[]>('/almacenero/proveedores')).data,
    createProveedor: async (data: Partial<Proveedor>) => (await api.post<Proveedor>('/almacenero/proveedores', data)).data,
    deleteProveedor: async (id: number) => await api.delete(`/almacenero/proveedores/${id}`),
    // Integración con SUNAT
    consultaRuc: async (ruc: string) => (await api.get<Proveedor>(`/almacenero/proveedores/buscar/${ruc}`)).data,

    // --- CATEGORÍAS ---
    getCategorias: async () => (await api.get<Categoria[]>('/almacenero/categorias')).data,
    getCategoriasTree: async () => (await api.get<CategoriaTreeItem[]>('/almacenero/categorias-tree')).data,
    createCategoria: async (data: Partial<Categoria>) => (await api.post<Categoria>('/almacenero/categorias', data)).data,
    createSubCategoria: async (idPadre: number, data: Partial<Categoria>) => (await api.post<Categoria>(`/almacenero/categorias/${idPadre}/subcategorias`, data)).data,
    deleteCategoria: async (id: number) => await api.delete(`/almacenero/categorias/${id}`),
};
