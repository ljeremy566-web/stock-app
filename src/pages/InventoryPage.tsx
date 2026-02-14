import { useState } from 'react';
import { Plus, Search, Filter, X, ShoppingBag } from 'lucide-react'; // Iconos
import { useProducts, useDeleteProduct } from '@/hooks/useProducts'; // Hooks de productos
import { useCategoriasPrincipales } from '@/hooks/useCategories'; // [!code ++] Hook Categorías
import { useProveedores } from '@/hooks/useMasters'; // [!code ++] Hook Proveedores

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'; // [!code ++] Componentes Select
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox'; // [!code ++] Checkbox para stock bajo
import { Label } from '@/components/ui/label';

import { ProductTable } from '@/features/inventory/components/ProductTable';
import { ProductForm } from '@/features/inventory/components/ProductForm';
import { Producto, Categoria, Proveedor } from '@/types/inventory.types';
import { toast } from 'sonner';

export default function InventoryPage() {
    // 1. DATA
    const { data: products = [], isLoading } = useProducts();
    const deleteProduct = useDeleteProduct();

    // [!code ++] Cargamos listas para los filtros
    const { data: categorias = [] } = useCategoriasPrincipales();
    const { data: proveedores = [] } = useProveedores();

    // 2. ESTADOS DE FILTRO
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('ALL'); // 'ALL' o ID
    const [filterProvider, setFilterProvider] = useState<string>('ALL'); // 'ALL' o ID
    const [filterLowStock, setFilterLowStock] = useState<boolean>(false); // Solo bajo stock

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Producto | undefined>(undefined);

    // 3. LÓGICA DE FILTRADO MAESTRA
    const filteredProducts = products.filter((product) => {
        // A. Filtro por Texto (Nombre o Código)
        const matchSearch =
            product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.codigoIdentificacion.toLowerCase().includes(searchTerm.toLowerCase());

        // B. Filtro por Categoría
        const matchCategory =
            filterCategory === 'ALL' ||
            product.categoriaPadre?.idCategoria.toString() === filterCategory;

        // C. Filtro por Proveedor
        const matchProvider =
            filterProvider === 'ALL' ||
            product.proveedor?.idProveedor.toString() === filterProvider;

        // D. Filtro por Stock Bajo (Menor o igual a 5 unidades)
        // Nota: Si el producto tiene variantes, sumamos su stock total.
        const stockTotal = product.cantidad ?? 0;
        const matchStock = !filterLowStock || stockTotal <= 5;

        return matchSearch && matchCategory && matchProvider && matchStock;
    });

    // Manejadores de acciones
    const handleDelete = async (ids: number[]) => {
        if (confirm(`¿Estás seguro de eliminar ${ids.length} producto(s)? Esta acción no se puede deshacer.`)) {
            try {
                // Ejecutamos todas las eliminaciones en paralelo
                await Promise.all(ids.map(id => deleteProduct.mutateAsync(id)));
                toast.success('Productos eliminados correctamente');
            } catch (error) {
                toast.error('Error al eliminar', { description: 'Algunos productos no pudieron ser eliminados.' });
            }
        }
    };

    const handleEdit = (product: Producto) => {
        setEditingProduct(product);
        setIsCreateOpen(true);
    };

    // FUNCIÓN DE DUPLICACIÓN
    const handleDuplicate = (product: Producto) => {
        // Preparamos el producto para ser una "copia"
        const copy: Producto = {
            ...product,
            idProducto: undefined, // Importante: Sin ID para que sea uno nuevo
            codigoIdentificacion: `${product.codigoIdentificacion}-CP`, // Sugerencia de código
            nombre: `${product.nombre} (Copia)`,
            variantes: [], // Opcional: ¿Quieres copiar las variantes con stock 0? Mejor vacío por seguridad
            cantidad: 0 // Stock a 0
        };

        // Abrimos el modal con los datos precargados
        setEditingProduct(copy);
        setIsCreateOpen(true);
        toast.info("Modo Duplicación", { description: "Estás creando una copia. Revisa el código y stock." });
    };

    // [!code ++] Resetear filtros
    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('ALL');
        setFilterProvider('ALL');
        setFilterLowStock(false);
    };

    const hasActiveFilters = searchTerm || filterCategory !== 'ALL' || filterProvider !== 'ALL' || filterLowStock;

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario</h1>
                    <p className="text-slate-500">Gestión general de productos y existencias.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setEditingProduct(undefined); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
                            <DialogDescription>
                                Completa la información del producto. Los campos con * son obligatorios.
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            product={editingProduct}
                            onSuccess={() => setIsCreateOpen(false)}
                            onCancel={() => setIsCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* [!code ++] BARRA DE FILTROS AVANZADA */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-600">
                        <Filter className="h-4 w-4" /> Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                        {/* 1. Buscador (Ocupa más espacio) */}
                        <div className="md:col-span-4 space-y-2">
                            <Label className="text-xs font-semibold text-slate-500">BUSCAR</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Nombre, SKU o Código..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Filtro Categoría */}
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-semibold text-slate-500">CATEGORÍA</Label>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas las Categorías</SelectItem>
                                    {categorias.map((cat: Categoria) => (
                                        <SelectItem key={cat.idCategoria} value={cat.idCategoria.toString()}>
                                            {cat.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Filtro Proveedor */}
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-semibold text-slate-500">PROVEEDOR</Label>
                            <Select value={filterProvider} onValueChange={setFilterProvider}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los Proveedores</SelectItem>
                                    {proveedores.map((prov: Proveedor) => (
                                        <SelectItem key={prov.idProveedor} value={prov.idProveedor.toString()}>
                                            {prov.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. Filtro Stock Bajo + Reset */}
                        <div className="md:col-span-2 flex items-center justify-between gap-2 h-10">
                            <div className="flex items-center space-x-2 border p-2 rounded-md bg-white hover:bg-slate-50 cursor-pointer w-full justify-center" onClick={() => setFilterLowStock(!filterLowStock)}>
                                <Checkbox id="low-stock" checked={filterLowStock} onCheckedChange={(c) => setFilterLowStock(!!c)} />
                                <label
                                    htmlFor="low-stock"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-red-600"
                                >
                                    Stock Bajo
                                </label>
                            </div>

                            {hasActiveFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
                                    <X className="h-4 w-4 text-slate-500" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resultados y Tabla */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Cargando inventario...</div>
                    ) : (
                        <>
                            <div className="p-2 border-b bg-slate-50 text-xs text-right text-slate-500 px-4">
                                Mostrando <strong>{filteredProducts.length}</strong> productos
                                {hasActiveFilters && <span> (filtrado de {products.length})</span>}
                            </div>
                            <ProductTable
                                products={filteredProducts}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
