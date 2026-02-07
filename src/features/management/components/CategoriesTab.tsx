import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersService } from '@/services/masters.service';
import { CategoriaTreeItem } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FolderTree,
    Plus,
    Trash2,
    ChevronRight,
    Folder,
    FolderOpen,
    Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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

// --- COMPONENTE PRINCIPAL ---
export function CategoriesTab() {
    const queryClient = useQueryClient();

    // Estado para el modal de creación
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [parentCat, setParentCat] = useState<{ id: number, nombre: string } | null>(null);

    // Estado para el diálogo de confirmación de eliminación
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        id: number | null;
        name: string;
    }>({ open: false, id: null, name: '' });

    // 1. QUERY: Obtener el árbol (Caché automático)
    const { data: tree = [], isLoading } = useQuery({
        queryKey: ['categorias-tree'],
        queryFn: mastersService.getCategoriasTree,
        staleTime: 1000 * 60 * 5,
    });

    // 2. MUTATION: Crear Categoría (Raíz o Hija)
    const createMutation = useMutation({
        mutationFn: async () => {
            if (!newCatName.trim()) throw new Error("El nombre es obligatorio");

            if (parentCat) {
                return await mastersService.createSubCategoria(parentCat.id, { nombre: newCatName });
            } else {
                return await mastersService.createCategoria({ nombre: newCatName });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias-tree'] });
            queryClient.invalidateQueries({ queryKey: ['categorias', 'principales'] });

            toast.success('Categoría creada', {
                description: parentCat
                    ? `Subcategoría "${newCatName}" agregada a "${parentCat.nombre}"`
                    : `Categoría principal "${newCatName}" creada`
            });

            setNewCatName('');
            setIsModalOpen(false);
        },
        onError: () => {
            toast.error("Error al crear", {
                description: "Verifica que no exista una categoría con el mismo nombre."
            });
        }
    });

    // 3. MUTATION: Eliminar Categoría
    const deleteMutation = useMutation({
        mutationFn: mastersService.deleteCategoria,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categorias-tree'] });
            queryClient.invalidateQueries({ queryKey: ['categorias', 'principales'] });
            toast.success('Categoría eliminada', { description: `"${deleteDialog.name}" ha sido eliminada.` });
        },
        onError: () => {
            toast.error("No se pudo eliminar", {
                description: "Verifica que no tenga productos asociados."
            });
        }
    });

    // Handlers
    const handleCreate = () => createMutation.mutate();

    const openDeleteDialog = (id: number, nombre: string) => {
        setDeleteDialog({ open: true, id, name: nombre });
    };

    const confirmDelete = () => {
        if (deleteDialog.id) {
            deleteMutation.mutate(deleteDialog.id);
        }
        setDeleteDialog({ open: false, id: null, name: '' });
    };

    // Funciones puente para pasar al componente recursivo
    const openAddModal = (id: number, nombre: string) => {
        setParentCat({ id, nombre });
        setNewCatName('');
        setIsModalOpen(true);
    };

    return (
        <>
            {/* Diálogo de Confirmación de Eliminación */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de eliminar <strong>"{deleteDialog.name}"</strong> y TODAS sus subcategorías. Esta acción no se puede deshacer.
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

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Panel Izquierdo: Acciones */}
                <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
                    <CardHeader className="bg-slate-50/50">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <FolderTree size={28} />
                        </div>
                        <CardTitle>Árbol de Categorías</CardTitle>
                        <CardDescription>Estructura jerárquica de tu almacén.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base shadow-sm"
                            onClick={() => { setParentCat(null); setNewCatName(''); setIsModalOpen(true); }}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Nueva Categoría Raíz
                        </Button>

                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                            <p className="font-semibold mb-1">💡 Tip:</p>
                            Despliega las carpetas para ver subniveles. Usa el botón <Badge variant="outline" className="mx-1 bg-white px-1 py-0 border-blue-200 text-blue-600"><Plus size={10} /></Badge> para agregar hijas.
                        </div>
                    </CardContent>
                </Card>

                {/* Panel Derecho: Árbol Visual */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                    <CardHeader className="border-b pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Estructura Actual</CardTitle>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                {isLoading ? 'Cargando...' : `${tree.length} Raíces`}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 bg-slate-50/30">
                        <ScrollArea className="h-[500px] p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p>Cargando estructura...</p>
                                </div>
                            ) : tree.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    No hay categorías definidas.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {tree.map(node => (
                                        <CategoryNode
                                            key={node.id}
                                            node={node}
                                            onAddSub={openAddModal}
                                            onDelete={openDeleteDialog}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Modal de Creación */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {parentCat ? (
                                    <span className="flex items-center gap-2">
                                        Subcategoría para <Badge variant="outline" className="text-base font-normal bg-indigo-50 text-indigo-700">{parentCat.nombre}</Badge>
                                    </span>
                                ) : 'Nueva Categoría Principal'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    placeholder={parentCat ? "Ej: Polos, Jeans, Zapatillas" : "Ej: Ropa Hombre, Calzado, Accesorios"}
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                    autoFocus
                                />
                            </div>
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleCreate}
                                disabled={createMutation.isPending || !newCatName.trim()}
                            >
                                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Guardar Categoría
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

// --- NODO RECURSIVO ---
function CategoryNode({ node, onAddSub, onDelete }: {
    node: CategoriaTreeItem,
    onAddSub: (id: number, nombre: string) => void,
    onDelete: (id: number, nombre: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.subcategorias && node.subcategorias.length > 0;

    return (
        <div>
            <div className={`
                flex items-center justify-between p-2 rounded-md border mb-1 transition-all group duration-200
                ${isOpen ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 hover:bg-white'}
            `}>
                <div
                    className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className={`
                        text-slate-400 transition-transform duration-200 
                        ${hasChildren ? 'opacity-100' : 'opacity-0'}
                        ${isOpen ? 'rotate-90' : ''}
                    `}>
                        <ChevronRight size={16} />
                    </div>

                    <div className={`${isOpen ? 'text-indigo-600' : 'text-slate-400'} transition-colors`}>
                        {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
                    </div>

                    <span className={`text-sm font-medium ${isOpen ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {node.nombre}
                    </span>

                    {hasChildren && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500">
                            {node.subcategorias.length}
                        </Badge>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                        onClick={() => onAddSub(node.id, node.nombre)}
                        title="Agregar Subcategoría"
                    >
                        <Plus size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => onDelete(node.id, node.nombre)}
                        title="Eliminar"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>

            {/* Recursión para hijos */}
            {isOpen && hasChildren && (
                <div className="ml-6 border-l-2 border-slate-200/60 pl-2 animate-in slide-in-from-top-1 duration-200 fade-in-0">
                    {node.subcategorias.map(sub => (
                        <CategoryNode key={sub.id} node={sub} onAddSub={onAddSub} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
