import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProvidersTab } from "@/features/management/components/ProvidersTab";
import { AttributesTab } from "@/features/management/components/AttributesTab";
import { CategoriesTab } from "@/features/management/components/CategoriesTab";
import { Users, Tag, Layers, Settings2 } from "lucide-react";

export default function ManagementPage() {
    return (
        <div className="space-y-8">
            {/* Encabezado */}
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                    <Settings2 size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Maestros</h1>
                    <p className="text-slate-500">Configura los datos auxiliares para tus productos.</p>
                </div>
            </div>

            <Tabs defaultValue="attributes" className="w-full space-y-6">
                {/* Barra de Pestañas Estilo Google / Material */}
                <div className="border-b border-slate-200">
                    <TabsList className="h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger
                            value="attributes"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-1 text-slate-500 hover:text-slate-700 transition-all text-base font-medium flex gap-2"
                        >
                            <Tag size={18} /> Atributos (Tallas y Colores)
                        </TabsTrigger>

                        <TabsTrigger
                            value="providers"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-1 text-slate-500 hover:text-slate-700 transition-all text-base font-medium flex gap-2"
                        >
                            <Users size={18} /> Proveedores
                        </TabsTrigger>

                        <TabsTrigger
                            value="categories"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-1 text-slate-500 hover:text-slate-700 transition-all text-base font-medium flex gap-2"
                        >
                            <Layers size={18} /> Categorías
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Área de Contenido con animación suave */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <TabsContent value="attributes" className="mt-0">
                        <AttributesTab />
                    </TabsContent>

                    <TabsContent value="providers" className="mt-0">
                        <ProvidersTab />
                    </TabsContent>

                    <TabsContent value="categories" className="mt-0">
                        <CategoriesTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
