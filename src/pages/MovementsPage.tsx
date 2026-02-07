import { ArrowRightLeft } from 'lucide-react';

export default function MovementsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Movimientos</h1>
            <p className="text-slate-500 mb-6">Historial de entradas y salidas del almacén.</p>

            {/* Placeholder */}
            <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <ArrowRightLeft className="h-16 w-16 text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">Próximamente</p>
                <p className="text-slate-400 text-sm">Esta sección está en desarrollo.</p>
            </div>
        </div>
    );
}
