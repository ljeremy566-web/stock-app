import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Producto } from '@/types/inventory.types';
import { ProductForm } from '@/features/inventory/components/ProductForm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, RefreshCw, Search, Box, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
    const { data: products = [], isLoading, refetch } = useProducts();
    const deleteProduct = useDeleteProduct();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Producto | null }>({
        open: false,
        product: null
    });

    // Filtrar productos
    const filteredProducts = products.filter((p: Producto) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigoIdentificacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Callback cuando se crea un producto exitosamente
    const handleSuccessCreate = () => {
        setIsCreateOpen(false);
    };

    // Callback cuando se edita un producto exitosamente
    const handleSuccessEdit = () => {
        setIsEditOpen(false);
        setSelectedProduct(null);
    };

    // Abrir modal de edición
    const openEditModal = (product: Producto) => {
        setSelectedProduct(product);
        setIsEditOpen(true);
    };

    // Confirmar eliminación
    const confirmDelete = async () => {
        if (deleteDialog.product?.idProducto) {
            try {
                await deleteProduct.mutateAsync(deleteDialog.product.idProducto);
                toast.success('Producto eliminado', {
                    description: `"${deleteDialog.product.nombre}" ha sido eliminado.`
                });
            } catch (error) {
                toast.error('Error al eliminar', {
                    description: 'No se pudo eliminar el producto. Intenta de nuevo.'
                });
            }
        }
        setDeleteDialog({ open: false, product: null });
    };

    return (
        <div className="space-y-6">
            {/* AlertDialog para confirmar eliminación */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar <strong>"{deleteDialog.product?.nombre}"</strong>.
                            Esta acción no se puede deshacer y eliminará todo el historial de stock asociado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteProduct.isPending}
                        >
                            {deleteProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario</h1>
                    <p className="text-slate-500">Gestión total del stock del almacén.</p>
                </div>

                {/* --- BOTÓN NUEVO PRODUCTO CON MODAL --- */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Registrar Nuevo Producto</DialogTitle>
                            <DialogDescription>
                                Completa la información del producto, sus precios y variantes (tallas/colores).
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            onSuccess={handleSuccessCreate}
                            onCancel={() => setIsCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* --- MODAL DE EDICIÓN --- */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                            <DialogDescription>
                                Modifica la información del producto "{selectedProduct?.nombre}".
                            </DialogDescription>
                        </DialogHeader>
                        {selectedProduct && (
                            <ProductForm
                                product={selectedProduct}
                                onSuccess={handleSuccessEdit}
                                onCancel={() => setIsEditOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-lg font-semibold">Listado de Productos</CardTitle>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar por nombre, código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">Código</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Precios (Unit / Doc)</TableHead>
                                        <TableHead className="text-right">Stock Total</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="w-[80px] text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Box className="h-8 w-8 mb-2 opacity-20" />
                                                    No se encontraron productos.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product: Producto) => (
                                            <TableRow key={product.idProducto} className="hover:bg-slate-50">
                                                <TableCell className="font-mono text-xs font-medium text-slate-500">
                                                    {product.codigoIdentificacion}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-900">{product.nombre}</div>
                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                        <span>{product.marca}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{product.sexo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal text-slate-600">
                                                        {product.categoria?.nombre || product.categoriaPadre?.nombre || 'General'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700">S/. {product.precioUnitario?.toFixed(2)}</span>
                                                        <span className="text-xs text-slate-400">Doc: S/. {product.precioDocena?.toFixed(2)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-700 text-base">
                                                    {product.cantidad ?? 0}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(product.cantidad || 0) > 10 ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Stock Alto</Badge>
                                                    ) : (product.cantidad || 0) > 0 ? (
                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Stock Bajo</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Agotado</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditModal(product)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteDialog({ open: true, product })}
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
