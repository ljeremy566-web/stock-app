export interface Categoria {
    idCategoria: number;
    nombre: string;
    categoriaPadre?: Categoria | null;
    subCategorias?: Categoria[];
}

export interface Proveedor {
    idProveedor: number;
    nombre: string;
    ruc: string;
}

export interface Talla {
    idTalla: number;
    nombreTalla: string;
}

export interface Color {
    idColor: number;
    nombre: string;
    codigoHex?: string;
}

export interface ProductoVariante {
    idProductoVariante?: number;
    talla: Talla;
    color: Color;
    cantidad: number;
    codigoBarrasVariante?: string;
}

export interface Producto {
    idProducto?: number;
    codigoIdentificacion: string; // SKU o Código Interno
    codigoBarras?: string;
    nombre: string;
    marca: string;
    sexo: string; // 'HOMBRE', 'MUJER', 'UNISEX'
    tipoPublico: string; // 'ADULTO', 'NIÑO'

    // Precios
    precioUnitario: number;
    precioCuarto: number;    // 3 unidades
    precioMediaDocena: number; // 6 unidades
    precioDocena: number;    // 12 unidades

    // Relaciones
    categoria?: Categoria;      // Subcategoría
    subCategoria2?: Categoria;  // Segunda subcategoría (si usas 3 niveles)
    categoriaPadre?: Categoria; // Categoría Principal
    proveedor?: Proveedor;

    // Stock y Variantes
    cantidad?: number; // Stock general si no usa variantes
    variantes?: ProductoVariante[];
}

// Tipo para el árbol de categorías
export interface CategoriaTreeItem {
    id: number;
    nombre: string;
    subcategorias: CategoriaTreeItem[];
}
