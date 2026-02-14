import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, Box, Layers, History, MoreHorizontal, Copy, Users, User, Trash, AlertTriangle } from "lucide-react";
import { Producto } from "@/types/inventory.types";

interface ProductTableProps {
    products: Producto[];
    onEdit: (product: Producto) => void;
    onDelete: (ids: number[]) => void;
    onDuplicate: (product: Producto) => void;
}

export function ProductTable({ products, onEdit, onDelete, onDuplicate }: ProductTableProps) {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const getStockStatus = (cantidad: number) => {
        if (cantidad <= 5) return { color: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle className="h-3 w-3 mr-1" />, label: "Crítico" };
        if (cantidad <= 15) return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: null, label: "Bajo" };
        return { color: "bg-green-50 text-green-700 border-green-200", icon: null, label: "Bien" };
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(products.map(p => p.idProducto!));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (checked: boolean, id: number) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const getGenderBadge = (sexo: string) => {
        switch (sexo) {
            case 'HOMBRE': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] border-blue-200">HOMBRE</Badge>;
            case 'MUJER': return <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100 text-[10px] border-pink-200">MUJER</Badge>;
            default: return <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] border-purple-200">UNISEX</Badge>;
        }
    };

    return (
        <div className="relative">
            {selectedIds.length > 0 && (
                <div className="absolute -top-12 left-0 right-0 bg-slate-900 text-white p-2 rounded-md shadow-lg flex justify-between items-center animate-in slide-in-from-top-2 z-10">
                    <div className="flex items-center gap-4 px-2">
                        <span className="font-bold text-sm">{selectedIds.length} seleccionados</span>
                        <div className="h-4 w-[1px] bg-slate-700"></div>
                        <span className="text-xs text-slate-400">Acciones en lote:</span>
                    </div>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { onDelete(selectedIds); setSelectedIds([]); }}
                        className="bg-red-600 hover:bg-red-700 text-white border-none h-8"
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Eliminar Selección
                    </Button>
                </div>
            )}

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={products.length > 0 && selectedIds.length === products.length}
                                    onCheckedChange={(c) => handleSelectAll(!!c)}
                                />
                            </TableHead>
                            <TableHead className="w-[100px]">Código</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Atributos</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                    <Box className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>No hay productos registrados.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const stockTotal = product.cantidad ?? 0;
                                const status = getStockStatus(stockTotal);
                                const isSelected = selectedIds.includes(product.idProducto!);

                                return (
                                    <TableRow key={product.idProducto} className={isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(c) => handleSelectOne(!!c, product.idProducto!)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-medium text-slate-500">
                                            {product.codigoIdentificacion}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900 text-sm">{product.nombre}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {product.marca && (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal text-slate-500">{product.marca}</Badge>
                                                    )}
                                                    <span className="text-[10px] text-slate-400">|</span>
                                                    <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{product.categoriaPadre?.nombre}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getGenderBadge(product.sexo)}
                                                {product.tipoPublico && (
                                                    <div className="flex items-center text-[10px] text-slate-500">
                                                        {product.tipoPublico === 'ADULTO' ? <User className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                                                        {product.tipoPublico}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700">
                                            S/. {product.precioUnitario?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(!product.variantes || product.variantes.length === 0) ? (
                                                <Badge className={`${status.color} hover:${status.color} border shadow-none transition-all`}>
                                                    {status.icon} {stockTotal}
                                                </Badge>
                                            ) : (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className={`h-6 px-2 text-xs font-bold border-b border-dashed rounded-sm ${status.color.replace('bg-', 'text-')}`}
                                                        >
                                                            {stockTotal} <Layers className="ml-1 h-3 w-3 opacity-50" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-2">
                                                                <Box className="h-5 w-5 text-blue-600" />
                                                                Detalle de Stock
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Distribución para <strong>{product.nombre}</strong>
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <ScrollArea className="h-[250px] w-full rounded-md border p-2 bg-slate-50">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-[80px]">Talla</TableHead>
                                                                        <TableHead>Color</TableHead>
                                                                        <TableHead className="text-right">Cant.</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {product.variantes.map((v, idx) => (
                                                                        <TableRow key={idx} className="bg-white border-b hover:bg-slate-100">
                                                                            <TableCell className="font-bold text-xs">
                                                                                {v.talla.nombreTalla}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div
                                                                                        className="w-3 h-3 rounded-full border shadow-sm"
                                                                                        style={{ backgroundColor: v.color.codigoHex }}
                                                                                    />
                                                                                    <span className="text-xs text-slate-700">{v.color.nombre}</span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-mono font-bold text-xs">
                                                                                {v.cantidad}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </ScrollArea>
                                                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md mt-2 border border-blue-100">
                                                            <span className="text-sm font-medium text-blue-800">Total</span>
                                                            <span className="text-lg font-bold text-blue-900">{product.cantidad}</span>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onEdit(product)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>                                                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                                                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/movimientos?productoId=${product.idProducto}`)}>
                                                        <History className="mr-2 h-4 w-4" /> Historial
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDelete([product.idProducto!])} className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
