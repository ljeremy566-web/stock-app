import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Sparkles, SaveAll, ArrowRight, Search, ScanBarcode, Wand2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { ScrollArea } from '@/components/ui/scroll-area'; // Asegúrate de tener este componente o usa div con overflow
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useColores, useTallas, useProveedores } from '@/hooks/useMasters';
import { useCategoriasPrincipales, useSubcategorias } from '@/hooks/useCategories';
import { Categoria, Talla, Color, Proveedor, Producto, ProductoVariante, SexoType } from '@/types/inventory.types';
import { toast } from 'sonner';

interface ProductFormProps {
    product?: Producto;
    onSuccess: () => void;
    onCancel: () => void;
}

const INITIAL_FORM_STATE: Partial<Producto> = {
    nombre: '',
    codigoIdentificacion: '',
    marca: '',
    sexo: 'UNISEX',
    tipoPublico: 'ADULTO',
    precioUnitario: 0,
    precioCuarto: 0,
    precioMediaDocena: 0,
    precioDocena: 0,
    cantidad: 0,
    codigoBarras: ''
};

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const isEditMode = !!product;

    // --- Hooks de Datos ---
    const { data: catsPrincipales = [] } = useCategoriasPrincipales();
    const { data: tallas = [] } = useTallas();
    const { data: colores = [] } = useColores();
    const { data: proveedores = [] } = useProveedores();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    // --- Estados ---
    const [selectedCatId, setSelectedCatId] = useState<number | undefined>(product?.categoriaPadre?.idCategoria);
    const { data: subCats = [] } = useSubcategorias(selectedCatId);

    const [formData, setFormData] = useState<Partial<Producto>>(product || INITIAL_FORM_STATE);
    const [variantes, setVariantes] = useState<ProductoVariante[]>(product?.variantes || []);

    // --- Matriz Rápida (Estados de Selección y Filtro) ---
    const [fastTallas, setFastTallas] = useState<number[]>([]);
    const [fastColores, setFastColores] = useState<number[]>([]);

    // Filtros para manejar muchas opciones
    const [tallaFilter, setTallaFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');

    const handleCategoriaChange = (idPadre: string) => {
        const id = parseInt(idPadre);
        setSelectedCatId(id);
        setFormData(prev => ({ ...prev, categoriaPadre: catsPrincipales.find((c: Categoria) => c.idCategoria === id) }));
    };

    const updatePrice = (field: keyof Producto, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateSKU = () => {
        // Lógica simple: 3 letras del nombre (o "GEN") + Timestamp corto + Random
        const prefix = formData.nombre ? formData.nombre.substring(0, 3).toUpperCase() : 'PRO';
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        // Ejemplo de resultado: PAN-482
        const sku = `${prefix}-${random}`;

        setFormData(prev => ({ ...prev, codigoIdentificacion: sku }));
        toast.info("Código generado", { description: `Se asignó el SKU: ${sku}` });
    };

    // --- Lógica de Matriz ---
    const toggleFastTalla = (id: number) => {
        setFastTallas(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const toggleFastColor = (id: number) => {
        setFastColores(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const generarMatriz = () => {
        if (fastTallas.length === 0 || fastColores.length === 0) {
            toast.warning("Faltan datos", { description: "Selecciona al menos una talla y un color." });
            return;
        }

        const nuevasVariantes: ProductoVariante[] = [];
        fastTallas.forEach(idTalla => {
            const talla = tallas.find((t: Talla) => t.idTalla === idTalla);
            fastColores.forEach(idColor => {
                const color = colores.find((c: Color) => c.idColor === idColor);
                if (talla && color) {
                    const existe = variantes.some(v => v.talla.idTalla === idTalla && v.color.idColor === idColor);
                    if (!existe) nuevasVariantes.push({ talla, color, cantidad: 0 });
                }
            });
        });

        setVariantes(prev => [...prev, ...nuevasVariantes]);
        setFastTallas([]);
        setFastColores([]);
        setTallaFilter('');
        setColorFilter('');
        toast.success("Variantes generadas", { description: "Ingresa las cantidades en la tabla." });
    };

    // --- Filtrado de Opciones ---
    // Ordenamos: Primero números (menor a mayor), luego letras
    const filteredTallas = tallas
        .filter((t: Talla) => t.nombreTalla.toLowerCase().includes(tallaFilter.toLowerCase()))
        .sort((a: Talla, b: Talla) => {
            const numA = parseFloat(a.nombreTalla);
            const numB = parseFloat(b.nombreTalla);
            const isNumA = !isNaN(numA);
            const isNumB = !isNaN(numB);

            if (isNumA && isNumB) return numA - numB; // Ambos números
            if (isNumA) return -1; // Números primero
            if (isNumB) return 1;
            return a.nombreTalla.localeCompare(b.nombreTalla); // Ambos letras
        });

    const filteredColores = colores.filter((c: Color) => c.nombre.toLowerCase().includes(colorFilter.toLowerCase()));

    const submitForm = async (keepOpen: boolean) => {
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
                toast.success('Producto actualizado');
                onSuccess();
            } else {
                await createProduct.mutateAsync(productoFinal);
                toast.success('Producto registrado', { description: `${formData.nombre} guardado exitosamente.` });

                if (keepOpen) {
                    setFormData(INITIAL_FORM_STATE);
                    setVariantes([]);
                    setFastTallas([]);
                    setFastColores([]);
                    // Mantenemos la categoría para agilizar
                } else {
                    onSuccess();
                }
            }
        } catch (error) {
            toast.error("Error al guardar", { description: "Verifica los datos obligatorios (*)" });
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); submitForm(false); }} className="space-y-6">

            {/* 1. Datos Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                    <Label>Nombre del Producto <span className="text-red-500">*</span></Label>
                    <Input autoFocus required placeholder="Ej: Pantalón Jeans Slim" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Código / SKU <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                        <Input required placeholder="Ej: PAN-002" value={formData.codigoIdentificacion} onChange={e => setFormData({ ...formData, codigoIdentificacion: e.target.value })} />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={generateSKU}
                            title="Generar código automático"
                            className="shrink-0"
                        >
                            <Wand2 className="h-4 w-4 text-indigo-600" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input placeholder="Genérica" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                </div>
                {/* Código de Barras - fila completa */}
                <div className="md:col-span-2 space-y-2">
                    <Label className="flex items-center gap-2">
                        <ScanBarcode size={16} className="text-slate-500" /> Código de Barras
                    </Label>
                    <Input
                        placeholder="Escanear..."
                        value={formData.codigoBarras || ''}
                        onChange={e => setFormData({ ...formData, codigoBarras: e.target.value })}
                    />
                </div>
            </div>

            {/* Previsualización de Código de Barras (Opcional, si hay datos) */}
            {(formData.codigoBarras || formData.codigoIdentificacion) && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed rounded-lg">
                    <Label className="mb-2 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                        Previsualización de Etiqueta
                    </Label>
                    <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
                        <Barcode
                            value={formData.codigoBarras || formData.codigoIdentificacion || ''}
                            format="CODE128"
                            width={1.5}
                            height={40}
                            fontSize={12}
                        />
                    </div>
                </div>
            )}

            {/* 2. Categorización */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-lg">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">CATEGORÍA</Label>
                    <Select onValueChange={handleCategoriaChange} value={selectedCatId?.toString()}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{catsPrincipales.map((c: Categoria) => <SelectItem key={c.idCategoria} value={c.idCategoria.toString()}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">SUBCATEGORÍA</Label>
                    <Select disabled={!selectedCatId} onValueChange={v => setFormData({ ...formData, categoria: subCats.find(c => c.idCategoria === parseInt(v)) })} value={formData.categoria?.idCategoria.toString()}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{subCats.map((c: Categoria) => <SelectItem key={c.idCategoria} value={c.idCategoria.toString()}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">GÉNERO</Label>
                    <Select onValueChange={v => setFormData({ ...formData, sexo: v as SexoType })} value={formData.sexo}>
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="UNISEX">Unisex</SelectItem>
                            <SelectItem value="HOMBRE">Hombre</SelectItem>
                            <SelectItem value="MUJER">Mujer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">PROVEEDOR</Label>
                    <Select onValueChange={v => setFormData({ ...formData, proveedor: proveedores.find(p => p.idProveedor === parseInt(v)) })} value={formData.proveedor?.idProveedor.toString()}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Opcional" /></SelectTrigger>
                        <SelectContent>{proveedores.map((p: Proveedor) => <SelectItem key={p.idProveedor} value={p.idProveedor.toString()}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* 3. Escala de Precios */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50/50 px-4 py-2 border-b flex items-center justify-between">
                    <Label className="font-semibold text-blue-700">Escala de Precios (Unitarios)</Label>
                    <span className="text-xs text-blue-400">Precio unitario por volumen</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
                    <div className="p-4 space-y-2 bg-white">
                        <Label className="text-slate-500 text-xs uppercase">Normal (1 ud)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">S/.</span>
                            <Input type="number" step="0.01" className="pl-8 font-bold text-lg" value={formData.precioUnitario || ''} onChange={e => updatePrice('precioUnitario', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="p-4 space-y-2 bg-white">
                        <Label className="text-slate-500 text-xs uppercase">Mayorista (x3)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">S/.</span>
                            <Input type="number" step="0.01" className="pl-8" value={formData.precioCuarto || ''} onChange={e => updatePrice('precioCuarto', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="p-4 space-y-2 bg-white">
                        <Label className="text-slate-500 text-xs uppercase">Mayorista (x6)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">S/.</span>
                            <Input type="number" step="0.01" className="pl-8" value={formData.precioMediaDocena || ''} onChange={e => updatePrice('precioMediaDocena', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="p-4 space-y-2 bg-blue-50/30">
                        <Label className="text-blue-600 text-xs uppercase font-bold">Distribuidor (x12)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">S/.</span>
                            <Input type="number" step="0.01" className="pl-8 border-blue-200" value={formData.precioDocena || ''} onChange={e => updatePrice('precioDocena', parseFloat(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. STOCK Y VARIANTES (OPTIMIZADO PARA MUCHOS DATOS) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Control de Stock</Label>
                    {variantes.length === 0 && (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md">
                            <span className="text-xs text-slate-500">Stock Simple:</span>
                            <Input type="number" className="w-24 h-8 bg-white" placeholder="0" value={formData.cantidad || ''} onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })} />
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300">
                    <div className="flex flex-col md:flex-row gap-6 h-[250px]">

                        {/* COLUMNA 1: TALLAS (Scrollable y Buscable) */}
                        <div className="flex-1 flex flex-col gap-2 h-full">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Tallas ({fastTallas.length})</span>
                                {fastTallas.length > 0 && <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={() => setFastTallas([])}>Limpiar</span>}
                            </div>

                            {/* Buscador de Tallas */}
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input
                                    className="h-8 pl-7 bg-white text-xs"
                                    placeholder="Buscar talla..."
                                    value={tallaFilter}
                                    onChange={e => setTallaFilter(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="flex-1 border rounded-md bg-white p-2">
                                <div className="flex flex-wrap gap-2 content-start">
                                    {filteredTallas.length === 0 ? (
                                        <p className="text-xs text-slate-400 w-full text-center py-4">No encontrado</p>
                                    ) : filteredTallas.map((t: Talla) => (
                                        <Badge
                                            key={t.idTalla}
                                            variant={fastTallas.includes(t.idTalla) ? "default" : "outline"}
                                            className={`cursor-pointer h-7 px-3 ${fastTallas.includes(t.idTalla) ? 'bg-slate-800' : 'hover:bg-slate-100'}`}
                                            onClick={() => toggleFastTalla(t.idTalla)}
                                        >
                                            {t.nombreTalla}
                                        </Badge>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* COLUMNA 2: COLORES (Scrollable y Buscable) */}
                        <div className="flex-1 flex flex-col gap-2 h-full md:border-l md:pl-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Colores ({fastColores.length})</span>
                                {fastColores.length > 0 && <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={() => setFastColores([])}>Limpiar</span>}
                            </div>

                            {/* Buscador de Colores */}
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input
                                    className="h-8 pl-7 bg-white text-xs"
                                    placeholder="Buscar color..."
                                    value={colorFilter}
                                    onChange={e => setColorFilter(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="flex-1 border rounded-md bg-white p-2">
                                <div className="flex flex-wrap gap-2 content-start">
                                    {filteredColores.length === 0 ? (
                                        <p className="text-xs text-slate-400 w-full text-center py-4">No encontrado</p>
                                    ) : filteredColores.map((c: Color) => (
                                        <Badge
                                            key={c.idColor}
                                            variant="outline"
                                            className={`cursor-pointer h-7 px-2 gap-2 ${fastColores.includes(c.idColor) ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'hover:bg-slate-100'}`}
                                            onClick={() => toggleFastColor(c.idColor)}
                                        >
                                            <div className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: c.codigoHex }} />
                                            {c.nombre}
                                        </Badge>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button type="button" onClick={generarMatriz} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" disabled={fastTallas.length === 0 || fastColores.length === 0}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generar Combinaciones
                        </Button>
                    </div>
                </div>

                {/* Tabla de Variantes Generadas */}
                {variantes.length > 0 && (
                    <div className="border rounded-md overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[30%]">Talla / Color</TableHead>
                                    <TableHead className="w-[40%]">Cantidad Stock</TableHead>
                                    <TableHead className="w-[30%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variantes.map((v, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono">{v.talla.nombreTalla}</Badge>
                                                <span className="text-slate-300">|</span>
                                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color.codigoHex }} />
                                                    {v.color.nombre}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" min="0" className="w-32 h-8" value={v.cantidad} onChange={(e) => {
                                                const newV = [...variantes];
                                                newV[idx].cantidad = parseInt(e.target.value) || 0;
                                                setVariantes(newV);
                                            }} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => setVariantes(variantes.filter((_, i) => i !== idx))}>
                                                <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-6 border-t mt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <div className="flex gap-3">
                    {!isEditMode && (
                        <Button type="button" variant="outline" onClick={() => submitForm(true)} disabled={createProduct.isPending} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            <SaveAll className="h-4 w-4 mr-2" />
                            Guardar y Nuevo
                        </Button>
                    )}
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 min-w-[140px]" disabled={createProduct.isPending || updateProduct.isPending}>
                        {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                        {isEditMode ? 'Actualizar' : 'Guardar Producto'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
