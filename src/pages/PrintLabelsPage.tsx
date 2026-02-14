import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Printer, Plus, Tags, Settings2, X, Layers } from 'lucide-react';
import { Producto, ProductoVariante } from '@/types/inventory.types';
import { toast } from 'sonner';

// --- TIPOS ---
interface QueueItem {
    uuid: string;
    product: Producto;
    variant?: ProductoVariante;
    quantity: number;
}

type PrintFormat = 'THERMAL_ROLL_1' | 'ROW_3_COLS' | 'A4_SHEET';

interface FormatConfig {
    label: string;
    description: string;
    css: string;
}

// --- CONFIGURACIÓN DE FORMATOS ---
const PRINT_FORMATS: Record<PrintFormat, FormatConfig> = {
    'THERMAL_ROLL_1': {
        label: "Rollo Térmico (1 Columna)",
        description: "Etiquetas individuales (Zebra, Xprinter, etc).",
        css: `
            body { margin: 0; padding: 0; }
            .page-container { width: 100%; }
            .grid { display: flex; flex-direction: column; align-items: center; }
            .label { 
                width: 50mm; height: 25mm;
                page-break-after: always; 
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                overflow: hidden;
            }
        `
    },
    'ROW_3_COLS': {
        label: "Fila de 3 (Continuo/Hoja)",
        description: "Etiquetas en filas de 3 columnas.",
        css: `
            body { margin: 0; padding: 5mm; }
            .grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 3mm; 
            }
            .label { 
                border: 1px dashed #ccc; 
                height: 30mm; 
                padding: 2px; 
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                page-break-inside: avoid;
            }
        `
    },
    'A4_SHEET': {
        label: "Hoja A4 (Automático)",
        description: "Cuadrícula automática para hoja carta/A4.",
        css: `
            body { margin: 10mm; }
            .grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(50mm, 1fr)); 
                gap: 5mm; 
            }
            .label { 
                border: 1px dashed #ccc; 
                height: 30mm; 
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                page-break-inside: avoid;
            }
        `
    }
};

export default function PrintLabelsPage() {
    const { data: products = [], isLoading } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('THERMAL_ROLL_1');

    // Estado para el Modal de Variantes
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigoIdentificacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 1. INICIAR AGREGADO (Detectar si tiene variantes)
    const handleAddClick = (product: Producto) => {
        if (product.variantes && product.variantes.length > 0) {
            setSelectedProduct(product);
            const initialQtys: Record<string, number> = {};
            product.variantes.forEach((_, idx) => initialQtys[idx] = 0);
            setVariantQuantities(initialQtys);
            setModalOpen(true);
        } else {
            addToQueue(product, undefined, 1);
        }
    };

    // 2. AGREGAR A LA COLA
    const addToQueue = (product: Producto, variant: ProductoVariante | undefined, qty: number) => {
        if (qty <= 0) return;

        const uniqueKey = variant
            ? `${product.idProducto}-var-${variant.talla.idTalla}-${variant.color.idColor}`
            : `${product.idProducto}-simple`;

        const existingIndex = queue.findIndex(item => item.uuid === uniqueKey);

        if (existingIndex >= 0) {
            const newQueue = [...queue];
            newQueue[existingIndex].quantity += qty;
            setQueue(newQueue);
            toast.success(`Actualizado: ${product.nombre}`);
        } else {
            setQueue(prev => [...prev, {
                uuid: uniqueKey,
                product,
                variant,
                quantity: qty
            }]);
            toast.success("Añadido a cola");
        }
    };

    // 3. CONFIRMAR DESDE EL MODAL
    const confirmVariantsAdd = () => {
        if (!selectedProduct || !selectedProduct.variantes) return;

        let addedCount = 0;
        selectedProduct.variantes.forEach((variant, idx) => {
            const qty = variantQuantities[idx] || 0;
            if (qty > 0) {
                addToQueue(selectedProduct, variant, qty);
                addedCount += qty;
            }
        });

        if (addedCount > 0) {
            setModalOpen(false);
            setVariantQuantities({});
            setSelectedProduct(null);
        } else {
            toast.warning("Ingresa al menos una cantidad");
        }
    };

    const updateQueueQuantity = (index: number, val: string) => {
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        const newQueue = [...queue];
        newQueue[index].quantity = qty;
        setQueue(newQueue);
    };

    const removeFromQueue = (index: number) => {
        setQueue(queue.filter((_, i) => i !== index));
    };

    // --- GENERADOR DE IMPRESIÓN ---
    const buildLabelHtml = (item: QueueItem): string => {
        const code = item.product.codigoBarras || item.product.codigoIdentificacion || '0000';
        const sizeLabel = item.variant ? item.variant.talla.nombreTalla : '';
        const colorLabel = item.variant ? item.variant.color.nombre : '';
        const sizeBadge = sizeLabel ? '<div class="size-badge">' + sizeLabel + '</div>' : '';
        const colorSpan = colorLabel ? '<span class="color">' + colorLabel + '</span>' : '';

        return [
            '<div class="label">',
            '  <div class="name">' + item.product.nombre + '</div>',
            '  ' + sizeBadge,
            '  <svg class="barcode"',
            '    jsbarcode-value="' + code + '"',
            '    jsbarcode-format="CODE128"',
            '    jsbarcode-displayValue="false"',
            '    jsbarcode-width="2"',
            '    jsbarcode-margin="0">',
            '  </svg>',
            '  <div class="code">' + code + '</div>',
            '  <div class="meta-row">',
            '    ' + colorSpan,
            '    <span class="price">S/. ' + (item.product.precioUnitario?.toFixed(2) ?? '0.00') + '</span>',
            '  </div>',
            '</div>'
        ].join('\n');
    };

    const handlePrint = () => {
        if (queue.length === 0) return;
        const config = PRINT_FORMATS[selectedFormat];
        const totalLabels = queue.reduce((acc, item) => acc + item.quantity, 0);

        // Build all labels
        const labelsHtml = queue.map(item => {
            return Array(item.quantity).fill(0).map(() => buildLabelHtml(item)).join('');
        }).join('');

        const htmlContent = '<!DOCTYPE html>' +
            '<html><head><title>Impresión Etiquetas</title>' +
            '<style>' +
            '* { box-sizing: border-box; }' +
            'body { font-family: Arial, sans-serif; }' +
            '.label-content { width: 100%; text-align: center; }' +
            '.name { font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }' +
            '.size-badge { font-size: 14px; font-weight: 900; border: 1px solid #000; border-radius: 4px; padding: 1px 6px; display: inline-block; margin: 2px 0; }' +
            '.meta-row { display: flex; justify-content: center; gap: 5px; align-items: baseline; }' +
            '.price { font-size: 14px; font-weight: bold; }' +
            '.color { font-size: 9px; text-transform: uppercase; }' +
            '.code { font-size: 8px; font-family: monospace; letter-spacing: 1px; }' +
            'svg { width: 90%; height: 35px; margin: 0 auto; display: block; }' +
            config.css +
            '@media print { @page { margin: 0; } }' +
            '</style></head><body>' +
            '<div class="grid">' + labelsHtml + '</div>' +
            '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></' + 'script>' +
            '<script>window.onload = function() { try { JsBarcode(".barcode").init(); } catch(e) {} }</' + 'script>' +
            '</body></html>';

        // Usar iframe oculto para imprimir (compatible con Tauri)
        const existingFrame = document.getElementById('print-frame');
        if (existingFrame) existingFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'print-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            toast.error("No se pudo crear el marco de impresión");
            return;
        }

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Esperar a que JsBarcode cargue y renderize, luego imprimir
        toast.info(`Preparando ${totalLabels} etiquetas...`);
        setTimeout(() => {
            try {
                iframe.contentWindow?.print();
                toast.success("Diálogo de impresión abierto");
            } catch {
                toast.error("Error al imprimir. Intenta de nuevo.");
            }
        }, 2000); // 2s para que JsBarcode cargue vía CDN y renderice
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

            {/* IZQUIERDA: Catálogo */}
            <div className="lg:col-span-5 flex flex-col gap-4 h-full">
                <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
                    <div className="p-4 border-b bg-slate-50 space-y-3">
                        <h2 className="font-bold text-lg">Catálogo</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar..." className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="w-[40px]"></TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? <TableRow><TableCell colSpan={2}>...</TableCell></TableRow> :
                                    filteredProducts.map(p => (
                                        <TableRow key={p.idProducto}>
                                            <TableCell>
                                                <div className="font-medium text-sm">{p.nombre}</div>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] font-normal text-slate-500">{p.codigoIdentificacion}</Badge>
                                                    {p.variantes && p.variantes.length > 0 && (
                                                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                            {p.variantes.length} Variantes
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" onClick={() => handleAddClick(p)}>
                                                    <Plus className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* DERECHA: Cola */}
            <div className="lg:col-span-7 flex flex-col gap-4 h-full">
                <Card className="border-slate-200 bg-white shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Settings2 className="h-5 w-5 text-indigo-600" />
                            <span className="font-bold text-sm">Configuración</span>
                        </div>
                        <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as PrintFormat)}>
                            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(PRINT_FORMATS).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handlePrint} disabled={queue.length === 0} className="bg-slate-900 text-white shadow-md">
                            <Printer className="mr-2 h-4 w-4" /> IMPRIMIR
                        </Button>
                    </div>
                </Card>

                <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 bg-slate-50/50 shadow-inner">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {queue.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <Tags className="h-16 w-16 mb-2" />
                                <p>Cola vacía</p>
                            </div>
                        ) : (
                            queue.map((item, idx) => (
                                <div key={item.uuid} className="flex items-center gap-3 bg-white p-2 rounded border shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{item.product.nombre}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {item.variant ? (
                                                <span className="bg-blue-100 text-blue-800 px-2 rounded font-bold">
                                                    Talla: {item.variant.talla.nombreTalla}
                                                </span>
                                            ) : (
                                                <span className="bg-slate-100 px-2 rounded">General</span>
                                            )}
                                            {item.variant && <span>| {item.variant.color.nombre}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded">
                                        <Input
                                            type="number" min="1"
                                            className="w-14 h-7 text-center font-bold bg-white p-0"
                                            value={item.quantity}
                                            onChange={e => updateQueueQuantity(idx, e.target.value)}
                                        />
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => removeFromQueue(idx)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                    {queue.length > 0 && (
                        <div className="p-3 bg-white border-t text-right text-sm">
                            Total: <strong>{queue.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                        </div>
                    )}
                </Card>
            </div>

            {/* --- MODAL DE SELECCIÓN DE VARIANTES --- */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Variantes a Imprimir</DialogTitle>
                        <DialogDescription>Ingresa cuántas etiquetas necesitas por cada talla.</DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded">
                            <Layers className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold">{selectedProduct?.nombre}</span>
                        </div>

                        <ScrollArea className="h-[250px] pr-4">
                            <div className="space-y-3">
                                {selectedProduct?.variantes?.map((variant, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                                {variant.talla.nombreTalla}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-medium text-slate-700">{variant.color.nombre}</div>
                                                <div className="text-xs text-slate-400">Stock: {variant.cantidad}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Cant:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="w-20 text-center font-bold"
                                                value={variantQuantities[idx] === 0 ? '' : variantQuantities[idx]}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setVariantQuantities(prev => ({ ...prev, [idx]: val }));
                                                }}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmVariantsAdd} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Añadir a Cola
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
