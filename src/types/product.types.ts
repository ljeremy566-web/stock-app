// Espejo de DTOs de Java para productos

export interface Product {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    cantidad: number;
    stock: number;
    talla: string;
    color: string;
    categoria?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateProductRequest {
    nombre: string;
    descripcion?: string;
    precio: number;
    cantidad: number;
    categoria?: string;
}
