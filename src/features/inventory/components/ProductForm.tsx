import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useColores, useTallas, useProveedores } from '@/hooks/useMasters';
import { useCategoriasPrincipales, useSubcategorias } from '@/hooks/useCategories';
import { Categoria, Talla, Color, Proveedor, Producto, ProductoVariante } from '@/types/inventory.types';
import { toast } from 'sonner';

interface ProductFormProps {
    product?: Producto; // Si se pasa, es modo edición
    onSuccess: () => void;
    onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const isEditMode = !!product;

    // --- React Query Hooks ---
    const { data: catsPrincipales = [] } = useCategoriasPrincipales();
    const { data: tallas = [] } = useTallas();
    const { data: colores = [] } = useColores();
    const { data: proveedores = [] } = useProveedores();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    // Estado para subcategorías (depende de la categoría seleccionada)
    const [selectedCatId, setSelectedCatId] = useState<number | undefined>(
        product?.categoriaPadre?.idCategoria
    );
    const { data: subCats = [] } = useSubcategorias(selectedCatId);

    // --- Estado del Formulario (pre-llenar si es edición) ---
    const [formData, setFormData] = useState<Partial<Producto>>(product || {
        nombre: '',
        codigoIdentificacion: '',
        marca: '',
        sexo: 'UNISEX',
        tipoPublico: 'ADULTO',
        precioUnitario: 0,
        precioCuarto: 0,
        precioMediaDocena: 0,
        precioDocena: 0,
        cantidad: 0
    });

    // --- Estado de Variantes (Tabla temporal) ---
    const [variantes, setVariantes] = useState<ProductoVariante[]>(product?.variantes || []);
    const [tempVariante, setTempVariante] = useState({ idTalla: '', idColor: '', cantidad: 0 });

    // Cargar subcategorías cuando cambia la principal
    const handleCategoriaChange = (idPadre: string) => {
        const id = parseInt(idPadre);
        setSelectedCatId(id);
        setFormData(prev => ({ ...prev, categoriaPadre: catsPrincipales.find((c: Categoria) => c.idCategoria === id) }));
    };

    // Agregar variante a la lista temporal
    const agregarVariante = () => {
        const talla = tallas.find((t: Talla) => t.idTalla === parseInt(tempVariante.idTalla));
        const color = colores.find((c: Color) => c.idColor === parseInt(tempVariante.idColor));

        if (talla && color && tempVariante.cantidad > 0) {
            setVariantes([...variantes, { talla, color, cantidad: tempVariante.cantidad }]);
            setTempVariante({ idTalla: '', idColor: '', cantidad: 0 });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Calcular cantidad total: suma de variantes o cantidad simple
            const cantidadTotal = variantes.length > 0
                ? variantes.reduce((sum, v) => sum + v.cantidad, 0)
                : formData.cantidad || 0;

            const productoFinal = {
                ...formData,
                cantidad: cantidadTotal,
                variantes: variantes.length > 0 ? variantes : undefined
            } as Producto;

            if (isEditMode && product?.idProducto) {
                // Modo edición: actualizar producto existente
                await updateProduct.mutateAsync({ id: product.idProducto, producto: productoFinal });
                toast.success('Producto actualizado', { description: `"${formData.nombre}" ha sido actualizado correctamente.` });
            } else {
                // Modo creación: crear nuevo producto
                await createProduct.mutateAsync(productoFinal);
                toast.success('Producto creado', { description: `"${formData.nombre}" ha sido registrado correctamente.` });
            }
            onSuccess();
        } catch (error) {
            console.error("Error guardando producto:", error);
            toast.error("Error al guardar", {
                description: "Revisa que todos los campos obligatorios estén llenos e intenta de nuevo."
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10">

            {/* 1. Datos Generales */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nombre del Producto</Label>
                    <Input
                        required
                        placeholder="Ej: Polo Estampado Oversize"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Código Interno / SKU</Label>
                    <Input
                        required
                        placeholder="Ej: POL-001"
                        value={formData.codigoIdentificacion}
                        onChange={e => setFormData({ ...formData, codigoIdentificacion: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input
                        value={formData.marca}
                        onChange={e => setFormData({ ...formData, marca: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select onValueChange={v => setFormData({ ...formData, sexo: v })} defaultValue="UNISEX">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HOMBRE">Hombre</SelectItem>
                            <SelectItem value="MUJER">Mujer</SelectItem>
                            <SelectItem value="UNISEX">Unisex</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Select onValueChange={v => setFormData({ ...formData, proveedor: proveedores.find((p: Proveedor) => p.idProveedor === parseInt(v)) })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                            {proveedores.map((p: Proveedor) => (
                                <SelectItem key={p.idProveedor} value={p.idProveedor.toString()}>{p.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 2. Categorización */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div className="space-y-2">
                    <Label>Categoría Principal</Label>
                    <Select onValueChange={handleCategoriaChange}>
                        <SelectTrigger><SelectValue placeholder="Ej: Ropa Superior" /></SelectTrigger>
                        <SelectContent>
                            {catsPrincipales.map((c: Categoria) => (
                                <SelectItem key={c.idCategoria} value={c.idCategoria.toString()}>{c.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Subcategoría</Label>
                    <Select
                        disabled={subCats.length === 0}
                        onValueChange={v => setFormData({ ...formData, categoria: subCats.find((c: Categoria) => c.idCategoria === parseInt(v)) })}
                    >
                        <SelectTrigger><SelectValue placeholder="Ej: Polos" /></SelectTrigger>
                        <SelectContent>
                            {subCats.map((c: Categoria) => (
                                <SelectItem key={c.idCategoria} value={c.idCategoria.toString()}>{c.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 3. Precios Escalonados */}
            <div className="grid grid-cols-4 gap-2">
                <div className="space-y-2">
                    <Label>P. Unitario</Label>
                    <Input type="number" step="0.01" onChange={e => setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                    <Label>P. x 3 (1/4)</Label>
                    <Input type="number" step="0.01" onChange={e => setFormData({ ...formData, precioCuarto: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                    <Label>P. x 6 (1/2)</Label>
                    <Input type="number" step="0.01" onChange={e => setFormData({ ...formData, precioMediaDocena: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                    <Label>P. Docena</Label>
                    <Input type="number" step="0.01" onChange={e => setFormData({ ...formData, precioDocena: parseFloat(e.target.value) })} />
                </div>
            </div>

            {/* 4. Gestión de Stock */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Stock y Variantes</Label>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className={variantes.length === 0 ? 'text-blue-600 font-medium' : ''}>Stock Simple</span>
                            <span>/</span>
                            <span className={variantes.length > 0 ? 'text-blue-600 font-medium' : ''}>Por Variantes</span>
                        </div>
                    </div>

                    {/* Stock Simple (cuando no hay variantes) */}
                    {variantes.length === 0 && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 max-w-xs space-y-2">
                                    <Label>Cantidad en Stock</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Ej: 50"
                                        value={formData.cantidad || ''}
                                        onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                                        className="text-lg font-medium"
                                    />
                                </div>
                                <p className="text-sm text-slate-500 flex-1">
                                    Ingresa la cantidad total si el producto no varía por talla o color.
                                    <br />O agrega variantes abajo para stock detallado.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Controles para agregar variante */}
                    <div className="flex gap-2 items-end">
                        <div className="w-32">
                            <Label className="text-xs">Talla</Label>
                            <Select value={tempVariante.idTalla} onValueChange={v => setTempVariante({ ...tempVariante, idTalla: v })}>
                                <SelectTrigger><SelectValue placeholder="Talla" /></SelectTrigger>
                                <SelectContent>
                                    {tallas.map((t: Talla) => <SelectItem key={t.idTalla} value={t.idTalla.toString()}>{t.nombreTalla}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Label className="text-xs">Color</Label>
                            <Select value={tempVariante.idColor} onValueChange={v => setTempVariante({ ...tempVariante, idColor: v })}>
                                <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                                <SelectContent>
                                    {colores.map((c: Color) => <SelectItem key={c.idColor} value={c.idColor.toString()}>{c.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-24">
                            <Label className="text-xs">Cantidad</Label>
                            <Input
                                type="number"
                                value={tempVariante.cantidad}
                                onChange={e => setTempVariante({ ...tempVariante, cantidad: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <Button type="button" onClick={agregarVariante} size="icon" className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>


                    {/* Tabla de Variantes Agregadas */}
                    {variantes.length > 0 && (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Talla</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {variantes.map((v, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{v.talla.nombreTalla}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: v.color.codigoHex || '#ccc' }} />
                                                    {v.color.nombre}
                                                </div>
                                            </TableCell>
                                            <TableCell>{v.cantidad}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setVariantes(variantes.filter((_, i) => i !== idx))}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Botones Finales */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-32" disabled={createProduct.isPending}>
                    {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Guardar
                </Button>
            </div>
        </form>
    );
}
