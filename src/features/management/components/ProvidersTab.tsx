import { useState } from 'react';
import { useProveedores, useCreateProveedor, useDeleteProveedor, useSearchRuc } from '@/hooks/useMasters';
import { Proveedor } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function ProvidersTab() {
    const { data: items = [], isLoading } = useProveedores();
    const createProveedor = useCreateProveedor();
    const deleteProveedor = useDeleteProveedor();
    const searchRuc = useSearchRuc();

    const [rucSearch, setRucSearch] = useState('');
    const [newProv, setNewProv] = useState({ nombre: '', ruc: '' });

    // Estado para el diálogo de confirmación
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        id: number | null;
        name: string;
    }>({ open: false, id: null, name: '' });

    const handleSearchRuc = async () => {
        if (rucSearch.length !== 11) {
            toast.warning('RUC inválido', { description: 'El RUC debe tener exactamente 11 dígitos.' });
            return;
        }
        try {
            const data = await searchRuc.mutateAsync(rucSearch);
            if (data) {
                setNewProv({ nombre: data.nombre, ruc: data.ruc });
                toast.success('RUC encontrado', { description: `Se encontró: ${data.nombre}` });
            }
        } catch (e) {
            toast.error('No encontrado', { description: 'No se encontró el RUC en SUNAT o hubo un error de conexión.' });
        }
    };

    const handleSave = async () => {
        if (!newProv.nombre || !newProv.ruc) return;
        try {
            await createProveedor.mutateAsync(newProv);
            toast.success('Proveedor guardado', { description: `"${newProv.nombre}" ha sido registrado correctamente.` });
            setNewProv({ nombre: '', ruc: '' });
            setRucSearch('');
        } catch (e) {
            toast.error('Error al guardar proveedor');
        }
    };

    const openDeleteDialog = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await deleteProveedor.mutateAsync(deleteDialog.id);
            toast.success('Proveedor eliminado', { description: `"${deleteDialog.name}" ha sido eliminado.` });
        } catch (e) {
            toast.error('Error al eliminar', { description: 'No se pudo eliminar el proveedor.' });
        }
        setDeleteDialog({ open: false, id: null, name: '' });
    };

    return (
        <>
            {/* Diálogo de Confirmación de Eliminación */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar <strong>"{deleteDialog.name}"</strong>. Esta acción no se puede deshacer.
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

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader><CardTitle>Nuevo Proveedor</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Buscar RUC (SUNAT)"
                                value={rucSearch}
                                onChange={e => setRucSearch(e.target.value)}
                                maxLength={11}
                            />
                            <Button size="icon" onClick={handleSearchRuc} disabled={searchRuc.isPending}>
                                {searchRuc.isPending ? <Loader2 className="animate-spin" /> : <Search size={18} />}
                            </Button>
                        </div>
                        <Input placeholder="RUC" value={newProv.ruc} disabled />
                        <Input placeholder="Razón Social" value={newProv.nombre} onChange={e => setNewProv({ ...newProv, nombre: e.target.value })} />
                        <Button className="w-full bg-blue-600" onClick={handleSave} disabled={createProveedor.isPending || !newProv.nombre}>
                            {createProveedor.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                            Guardar
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Listado de Proveedores</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader><TableRow><TableHead>RUC</TableHead><TableHead>Nombre</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-slate-400">
                                                No hay proveedores registrados
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((i: Proveedor) => (
                                            <TableRow key={i.idProveedor}>
                                                <TableCell>{i.ruc}</TableCell>
                                                <TableCell>{i.nombre}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(i.idProveedor, i.nombre)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
