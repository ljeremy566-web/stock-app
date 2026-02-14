import { useState, PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import {
    LayoutDashboard,
    Package,
    ArrowRightLeft,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Settings2,
    Tags
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MainLayout({ children }: PropsWithChildren) {
    const [isOpen, setIsOpen] = useState(true); // Estado para abrir/cerrar sidebar
    const location = useLocation();
    const navigate = useNavigate();

    // Obtenemos el usuario (o ponemos uno por defecto si es null)
    const user = authService.getCurrentUser() || 'Almacenero';
    // Generamos iniciales para el avatar (Ej: Jeremy Leon -> JL)
    const userInitials = user.substring(0, 2).toUpperCase();

    const handleLogout = () => {
        authService.logout();
        navigate('/login'); // Redirigir al login
    };

    // Definimos los enlaces del menú
    const menuItems = [
        {
            path: '/dashboard',
            label: 'Resumen',
            icon: <LayoutDashboard size={22} />
        },
        {
            path: '/inventory',
            label: 'Inventario',
            icon: <Package size={22} />
        },
        {
            path: '/movements',
            label: 'Movimientos',
            icon: <ArrowRightLeft size={22} />
        },
        {
            path: '/management',
            label: 'Gestión',
            icon: <Settings2 size={22} />
        },
        {
            path: '/print-labels',
            label: 'Etiquetas',
            icon: <Tags size={22} />
        },
    ];

    return (
        <div className="flex h-screen bg-[#f0f2f5]"> {/* Fondo gris claro Google */}

            {/* --- SIDEBAR --- */}
            <aside
                className={`
          bg-white z-20 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-200
          ${isOpen ? 'w-[280px]' : 'w-[80px]'} 
          fixed h-full md:relative
        `}
            >
                {/* 1. Header del Sidebar (Logo + Toggle) */}
                <div className={`h-20 mt-4 flex items-center ${isOpen ? 'justify-between px-6' : 'flex-col justify-center gap-2 px-2'}`}>
                    {/* Logo */}
                    {isOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Package className="text-white h-5 w-5" />
                            </div>
                            <h1 className="text-xl font-medium text-slate-800 tracking-tight">StockApp</h1>
                        </div>
                    ) : (
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Package className="text-white h-6 w-6" />
                        </div>
                    )}

                    {/* Botón para colapsar/expandir - siempre visible */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                        title={isOpen ? 'Colapsar menú' : 'Expandir menú'}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* 2. Navegación (Links) */}
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-full transition-all duration-200 font-medium text-sm
                  ${isActive
                                        ? 'bg-blue-100 text-blue-700' // Estado Activo (Estilo Google)
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} // Estado Inactivo
                  ${!isOpen && 'justify-center px-2'}
                `}
                                title={!isOpen ? item.label : ''}
                            >
                                {/* Icono */}
                                <span className={isActive ? 'text-blue-700' : 'text-slate-500'}>
                                    {item.icon}
                                </span>

                                {/* Texto (Solo si está abierto) */}
                                <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                                    {item.label}
                                </span>

                                {/* Flechita activa (Solo si está abierto y activo) */}
                                {isOpen && isActive && (
                                    <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 3. Footer del Sidebar (Perfil Usuario) */}
                <div className="p-4 border-t border-slate-100 mx-2 mb-2">
                    <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 ${!isOpen && 'justify-center p-2'}`}>
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm cursor-pointer">
                            <AvatarImage src="" /> {/* Si tuvieras foto */}
                            <AvatarFallback className="bg-orange-500 text-white font-medium">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>

                        {isOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {user}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    Almacén Central
                                </p>
                            </div>
                        )}

                        {isOpen && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-full"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Botón flotante menú para Móviles */}
                <header className="md:hidden h-16 bg-white border-b flex items-center px-4 justify-between">
                    <span className="font-bold text-slate-700">StockApp</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </Button>
                </header>

                {/* Área scrolleable donde se pintan las páginas */}
                <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

