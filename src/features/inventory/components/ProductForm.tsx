import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Loader2, Printer, RefreshCw } from 'lucide-react';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useColores, useTallas, useProveedores } from '@/hooks/useMasters';
import { useCategoriasPrincipales, useSubcategorias } from '@/hooks/useCategories';
import { Categoria, Talla, Color, Proveedor, Producto, ProductoVariante, SexoType, TipoPublicoType } from '@/types/inventory.types';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';

interface ProductFormProps {
    product?: Producto;
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

    // --- Estado del Formulario ---
    const [formData, setFormData] = useState<Partial<Producto>>(product || {
        nombre: '',
        codigoIdentificacion: '',
        marca: '',
        sexo: 'UNISEX' as SexoType,
        tipoPublico: 'ADULTO' as TipoPublicoType,
        precioUnitario: 0,
        precioCuarto: 0,
        precioMediaDocena: 0,
        precioDocena: 0,
        cantidad: 0
    });

    // --- Estado de Precios para Validación Visual ---
    const [prices, setPrices] = useState({
        unit: product?.precioUnitario || 0,
        quarter: product?.precioCuarto || 0,
        half: product?.precioMediaDocena || 0,
        dozen: product?.precioDocena || 0
    });

    // --- Estado de Variantes ---
    const [variantes, setVariantes] = useState<ProductoVariante[]>(product?.variantes || []);
    const [tempVariante, setTempVariante] = useState({ idTalla: '', idColor: '', cantidad: 0 });

    // --- Estado de Código de Barras ---
    const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
    const [barcodeLoading, setBarcodeLoading] = useState(false);

    // Sincronizar precios con formData
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            precioUnitario: prices.unit,
            precioCuarto: prices.quarter,
            precioMediaDocena: prices.half,
            precioDocena: prices.dozen
        }));
    }, [prices]);

    // Cargar código de barras si estamos editando
    useEffect(() => {
        if (isEditMode && product?.idProducto) {
            setBarcodeLoading(true);
            productService.getBarcodeImage(product.idProducto)
                .then(url => setBarcodeUrl(url))
                .finally(() => setBarcodeLoading(false));
        }
        // Cleanup: revocar URL al desmontar
        return () => {
            if (barcodeUrl) URL.revokeObjectURL(barcodeUrl);
        };
    }, [product?.idProducto]);

    // --- Validación de Precios Escalonados ---
    const priceErrors = useMemo(() => {
        const errors: string[] = [];
        const unitP = prices.unit;
        const quarterUnitP = prices.quarter / 3;
        const halfUnitP = prices.half / 6;
        const dozenUnitP = prices.dozen / 12;

        if (prices.quarter > 0 && quarterUnitP > unitP) {
            errors.push("El precio unitario por 1/4 (x3) es mayor al precio individual.");
        }
        if (prices.half > 0 && halfUnitP > quarterUnitP && prices.quarter > 0) {
            errors.push("El precio unitario por 1/2 (x6) es mayor al de 1/4.");
        }
        if (prices.dozen > 0 && dozenUnitP > halfUnitP && prices.half > 0) {
            errors.push("El precio unitario por docena es mayor al de 1/2.");
        }

        return errors;
    }, [prices]);

    // Helper para verificar si un campo de precio tiene error
    const hasPriceError = (field: 'quarter' | 'half' | 'dozen'): boolean => {
        const unitP = prices.unit;
        if (field === 'quarter' && prices.quarter > 0) {
            return (prices.quarter / 3) > unitP;
        }
        if (field === 'half' && prices.half > 0 && prices.quarter > 0) {
            return (prices.half / 6) > (prices.quarter / 3);
        }
        if (field === 'dozen' && prices.dozen > 0 && prices.half > 0) {
            return (prices.dozen / 12) > (prices.half / 6);
        }
        return false;
    };

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

    // Regenerar código de barras
    const handleRegenerateBarcode = async () => {
        if (!product?.idProducto) return;
        setBarcodeLoading(true);
        try {
            const url = await productService.getBarcodeImage(product.idProducto);
            if (barcodeUrl) URL.revokeObjectURL(barcodeUrl);
            setBarcodeUrl(url);
            toast.success('Código regenerado');
        } catch {
            toast.error('Error al regenerar código');
        } finally {
            setBarcodeLoading(false);
        }
    };

    // Imprimir código de barras
    const handlePrintBarcode = () => {
        if (!barcodeUrl) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Código de Barras - ${product?.nombre}</title></head>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
                    <img src="${barcodeUrl}" style="max-width:80%;" />
                    <p style="font-family:monospace;font-size:18px;letter-spacing:4px;">${product?.codigoBarras || ''}</p>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Bloquear envío si hay errores de precio
        if (priceErrors.length > 0) {
            toast.error('Corrige los errores de precios', {
                description: 'Los precios escalonados deben disminuir según el volumen.'
            });
            return;
        }

        try {
            const cantidadTotal = variantes.length > 0
                ? variantes.reduce((sum, v) => sum + v.cantidad, 0)
                : formData.cantidad || 0;

            const productoFinal = {
                ...formData,
                cantidad: cantidadTotal,
                variantes: variantes.length > 0 ? variantes : undefined
            } as Producto;

            if (isEditMode && product?.idProducto) {
                await updateProduct.mutateAsync({ id: product.idProducto, producto: productoFinal });
                toast.success('Producto actualizado', { description: `"${formData.nombre}" ha sido actualizado correctamente.` });
            } else {
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

    const isPending = createProduct.isPending || updateProduct.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* === COLUMNA IZQUIERDA/CENTRAL: Datos y Precios === */}
                <div className="md:col-span-2 space-y-6">

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
                            <Select
                                value={formData.sexo}
                                onValueChange={v => setFormData({ ...formData, sexo: v as SexoType })}
                            >
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
                            <Select
                                value={formData.proveedor?.idProveedor?.toString()}
                                onValueChange={v => setFormData({ ...formData, proveedor: proveedores.find((p: Proveedor) => p.idProveedor === parseInt(v)) })}
                            >
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
                            <Select
                                value={selectedCatId?.toString()}
                                onValueChange={handleCategoriaChange}
                            >
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
                                value={formData.categoria?.idCategoria?.toString()}
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

                    {/* 3. Precios Escalonados con Validación Visual */}
                    <div className="border p-4 rounded-lg bg-slate-50">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            Precios Escalonados
                            {priceErrors.length > 0 && (
                                <span className="text-red-500 text-xs font-normal">(Revisar inconsistencias)</span>
                            )}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label>Unitario (S/.)</Label>
                                <Input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    value={prices.unit || ''}
                                    onChange={e => setPrices({ ...prices, unit: parseFloat(e.target.value) || 0 })}
                                    className="border-blue-200 focus:border-blue-400"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>x3 (1/4)</Label>
                                <Input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    value={prices.quarter || ''}
                                    onChange={e => setPrices({ ...prices, quarter: parseFloat(e.target.value) || 0 })}
                                    className={hasPriceError('quarter') ? "border-red-500 bg-red-50" : ""}
                                />
                                <span className="text-xs text-slate-500">c/u: S/. {(prices.quarter / 3).toFixed(2)}</span>
                            </div>
                            <div className="space-y-1">
                                <Label>x6 (1/2)</Label>
                                <Input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    value={prices.half || ''}
                                    onChange={e => setPrices({ ...prices, half: parseFloat(e.target.value) || 0 })}
                                    className={hasPriceError('half') ? "border-red-500 bg-red-50" : ""}
                                />
                                <span className="text-xs text-slate-500">c/u: S/. {(prices.half / 6).toFixed(2)}</span>
                            </div>
                            <div className="space-y-1">
                                <Label>x12 (Docena)</Label>
                                <Input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    value={prices.dozen || ''}
                                    onChange={e => setPrices({ ...prices, dozen: parseFloat(e.target.value) || 0 })}
                                    className={hasPriceError('dozen') ? "border-red-500 bg-red-50" : ""}
                                />
                                <span className="text-xs text-slate-500">c/u: S/. {(prices.dozen / 12).toFixed(2)}</span>
                            </div>
                        </div>

                        {priceErrors.length > 0 && (
                            <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
                                {priceErrors.map((e, i) => <div key={i}>• {e}</div>)}
                            </div>
                        )}
                    </div>

                    {/* 4. Gestión de Stock y Variantes */}
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

                            {/* Stock Simple */}
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
                                        value={tempVariante.cantidad || ''}
                                        onChange={e => setTempVariante({ ...tempVariante, cantidad: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <Button type="button" onClick={agregarVariante} size="icon" className="bg-green-600 hover:bg-green-700">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Tabla de Variantes */}
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
                </div>

                {/* === COLUMNA DERECHA: Código de Barras === */}
                <div className="md:col-span-1 space-y-6">
                    <div className="border rounded-lg p-4 shadow-sm bg-white">
                        <Label className="mb-3 block font-semibold">Código de Barras</Label>

                        {isEditMode ? (
                            <div className="space-y-4">
                                {/* Información del Producto */}
                                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                    <div>
                                        <span className="text-xs text-slate-500">Producto</span>
                                        <p className="font-medium text-slate-800 truncate" title={product?.nombre}>
                                            {product?.nombre || 'Sin nombre'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500">Código / SKU</span>
                                        <p className="font-mono text-sm text-blue-600">
                                            {product?.codigoIdentificacion || 'N/A'}
                                        </p>
                                    </div>
                                    {/* Colores de las variantes */}
                                    {variantes.length > 0 && (
                                        <div>
                                            <span className="text-xs text-slate-500">Colores</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {[...new Map(variantes.map(v => [v.color.idColor, v.color])).values()].map((color) => (
                                                    <div
                                                        key={color.idColor}
                                                        className="flex items-center gap-1 bg-white border rounded-full px-2 py-0.5"
                                                        title={color.nombre}
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full border"
                                                            style={{ backgroundColor: color.codigoHex || '#ccc' }}
                                                        />
                                                        <span className="text-xs text-slate-600">{color.nombre}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Imagen del código de barras con info del producto */}
                                {barcodeLoading ? (
                                    <div className="h-32 bg-slate-100 flex items-center justify-center rounded">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    </div>
                                ) : barcodeUrl ? (
                                    <div className="flex flex-col items-center p-4 bg-white border-2 border-slate-300 rounded-lg">
                                        {/* Nombre del producto */}
                                        <p className="font-bold text-sm text-center text-slate-800 mb-1 leading-tight">
                                            {product?.nombre || 'Sin nombre'}
                                        </p>
                                        {/* SKU + Colores */}
                                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
                                            <span className="font-mono">{product?.codigoIdentificacion}</span>
                                            {variantes.length > 0 && (
                                                <>
                                                    <span className="text-slate-400">|</span>
                                                    <div className="flex items-center gap-1">
                                                        {[...new Map(variantes.map(v => [v.color.idColor, v.color])).values()].slice(0, 3).map((color) => (
                                                            <div
                                                                key={color.idColor}
                                                                className="w-3 h-3 rounded-full border border-slate-400"
                                                                style={{ backgroundColor: color.codigoHex || '#ccc' }}
                                                                title={color.nombre}
                                                            />
                                                        ))}
                                                        {[...new Map(variantes.map(v => [v.color.idColor, v.color])).values()].length > 3 && (
                                                            <span className="text-slate-400">+{[...new Map(variantes.map(v => [v.color.idColor, v.color])).values()].length - 3}</span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {/* Imagen del código de barras */}
                                        <img src={barcodeUrl} alt="Código de Barras" className="max-w-full h-auto" />
                                        {/* Número EAN */}
                                        <span className="text-sm font-mono mt-1 tracking-widest text-slate-700">
                                            {product?.codigoBarras || 'Sin código'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-sm rounded">
                                        No disponible
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintBarcode}
                                        disabled={!barcodeUrl}
                                    >
                                        <Printer className="h-4 w-4 mr-1" />
                                        Imprimir
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleRegenerateBarcode}
                                        disabled={barcodeLoading}
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-1 ${barcodeLoading ? 'animate-spin' : ''}`} />
                                        Regenerar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded text-center border border-dashed border-slate-300">
                                El código de barras (EAN-8) se generará automáticamente al guardar el producto.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Botones Finales */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 w-32"
                    disabled={isPending || priceErrors.length > 0}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isEditMode ? 'Actualizar' : 'Guardar'}
                </Button>
            </div>
        </form>
    );
}
