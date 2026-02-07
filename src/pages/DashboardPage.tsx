export const DashboardPage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Resumen</h1>
            <p className="text-slate-500 mb-6">Panel de control del almacén.</p>

            {/* TODO: Implementar contenido del dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Total Productos</p>
                    <p className="text-3xl font-bold text-slate-900">--</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">En Stock</p>
                    <p className="text-3xl font-bold text-green-600">--</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Poco Stock</p>
                    <p className="text-3xl font-bold text-amber-500">--</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm">Agotados</p>
                    <p className="text-3xl font-bold text-red-500">--</p>
                </div>
            </div>
        </div>
    );
};
