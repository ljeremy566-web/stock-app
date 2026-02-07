import { useState } from 'react';
import { useColores, useTallas, useCreateColor, useCreateTalla, useDeleteColor, useDeleteTalla } from '@/hooks/useMasters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Palette, Ruler, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
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

export function AttributesTab() {
    const { data: colores = [], isLoading: loadingColores } = useColores();
    const { data: tallas = [], isLoading: loadingTallas } = useTallas();

    const createColor = useCreateColor();
    const createTalla = useCreateTalla();
    const deleteColor = useDeleteColor();
    const deleteTalla = useDeleteTalla();

    const [newColor, setNewColor] = useState({ nombre: '', codigoHex: '#000000' });
    const [newTalla, setNewTalla] = useState('');

    // Estado para el diálogo de confirmación
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        type: 'color' | 'talla' | null;
        id: number | null;
        name: string;
    }>({ open: false, type: null, id: null, name: '' });

    const saveColor = async () => {
        if (!newColor.nombre) return;
        try {
            await createColor.mutateAsync(newColor);
            toast.success('Color agregado', { description: `"${newColor.nombre}" ha sido guardado correctamente.` });
            setNewColor({ nombre: '', codigoHex: '#000000' });
        } catch (e) {
            toast.error('Error al crear color');
        }
    };

    const saveTalla = async () => {
        if (!newTalla) return;
        try {
            await createTalla.mutateAsync({ nombreTalla: newTalla });
            toast.success('Talla agregada', { description: `"${newTalla}" ha sido guardada correctamente.` });
            setNewTalla('');
        } catch (e) {
            toast.error('Error al crear talla');
        }
    };

    const openDeleteDialog = (type: 'color' | 'talla', id: number, name: string) => {
        setDeleteDialog({ open: true, type, id, name });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.type || !deleteDialog.id) return;

        try {
            if (deleteDialog.type === 'color') {
                await deleteColor.mutateAsync(deleteDialog.id);
            } else {
                await deleteTalla.mutateAsync(deleteDialog.id);
            }
            toast.success('Eliminado', { description: `"${deleteDialog.name}" ha sido eliminado.` });
        } catch (e) {
            toast.error('Error al eliminar', {
                description: 'No se puede eliminar porque está en uso por algún producto.'
            });
        }
        setDeleteDialog({ open: false, type: null, id: null, name: '' });
    };

    return (
        <>
            {/* Diálogo de Confirmación de Eliminación */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {deleteDialog.type === 'color' ? 'color' : 'talla'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar <strong>"{deleteDialog.name}"</strong>. Esta acción no se puede deshacer y podría afectar productos existentes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="grid lg:grid-cols-2 gap-8">

                {/* === TARJETA DE COLORES === */}
                <Card className="border-slate-200 shadow-sm flex flex-col h-[500px]">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Palette size={20} />
                                    </div>
                                    Colores
                                </CardTitle>
                                <CardDescription>Gestiona la paleta de colores disponible.</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">{colores.length} colores</Badge>
                        </div>

                        {/* Formulario Inline en el Header */}
                        <div className="flex gap-3 mt-4">
                            <div className="relative">
                                <input
                                    type="color"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={newColor.codigoHex}
                                    onChange={e => setNewColor({ ...newColor, codigoHex: e.target.value })}
                                />
                                <div className="w-10 h-10 rounded-md border shadow-sm" style={{ background: newColor.codigoHex }} />
                            </div>
                            <Input
                                className="flex-1 bg-white"
                                placeholder="Nombre (Ej: Azul Noche)"
                                value={newColor.nombre}
                                onChange={e => setNewColor({ ...newColor, nombre: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && saveColor()}
                            />
                            <Button onClick={saveColor} disabled={!newColor.nombre || createColor.isPending} className="bg-slate-900">
                                <Plus size={18} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-hidden bg-slate-50/30">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-2">
                                {loadingColores && (
                                    <div className="text-center py-10 text-slate-400 text-sm">Cargando...</div>
                                )}
                                {!loadingColores && colores.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 text-sm">No hay colores registrados</div>
                                )}
                                {colores.map((c: any) => (
                                    <div key={c.idColor} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border shadow-sm ring-1 ring-slate-100" style={{ background: c.codigoHex }}></div>
                                            <div>
                                                <p className="font-medium text-slate-700">{c.nombre}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{c.codigoHex}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openDeleteDialog('color', c.idColor, c.nombre)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* === TARJETA DE TALLAS === */}
                <Card className="border-slate-200 shadow-sm flex flex-col h-[500px]">
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                        <Ruler size={20} />
                                    </div>
                                    Tallas
                                </CardTitle>
                                <CardDescription>Define las medidas y tallas estándar.</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-xs">{tallas.length} tallas</Badge>
                        </div>

                        {/* Formulario Inline */}
                        <div className="flex gap-3 mt-4">
                            <Input
                                className="flex-1 bg-white"
                                placeholder="Nueva Talla (Ej: XL, 42, M)"
                                value={newTalla}
                                onChange={e => setNewTalla(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveTalla()}
                            />
                            <Button onClick={saveTalla} disabled={!newTalla || createTalla.isPending} className="bg-slate-900">
                                <Plus size={18} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-hidden bg-slate-50/30">
                        <ScrollArea className="h-full p-4">
                            <div className="grid grid-cols-3 gap-3">
                                {loadingTallas && (
                                    <div className="col-span-3 text-center py-10 text-slate-400 text-sm">Cargando...</div>
                                )}
                                {!loadingTallas && tallas.length === 0 && (
                                    <div className="col-span-3 text-center py-10 text-slate-400 text-sm">No hay tallas registradas</div>
                                )}
                                {tallas.map((t: any) => (
                                    <div key={t.idTalla} className="relative group flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all">
                                        <span className="text-xl font-bold text-slate-700">{t.nombreTalla}</span>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openDeleteDialog('talla', t.idTalla, t.nombreTalla)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
