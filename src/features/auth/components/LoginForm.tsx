import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export function LoginForm() {
    const [usuario, setUsuario] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ usuario, clave });

            if (response.status && response.jwt) {
                navigate('/dashboard');
            } else {
                setError(response.message || 'Credenciales incorrectas');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-[400px] border-none shadow-xl rounded-[28px] overflow-hidden bg-white">
            <CardHeader className="flex flex-col items-center pt-10 pb-2 space-y-2">
                <h1 className="text-2xl font-normal text-slate-800">Iniciar sesión</h1>
                <p className="text-base text-slate-600">Ir al Sistema de Almacén</p>
            </CardHeader>

            <form onSubmit={handleLogin}>
                <CardContent className="space-y-6 pt-6 px-10">

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Input Usuario con estilo moderno */}
                        <div className="space-y-1 group">
                            <Input
                                id="usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Usuario"
                                className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 rounded-md text-base"
                            />
                        </div>

                        {/* Input Contraseña */}
                        <div className="space-y-1">
                            <Input
                                id="clave"
                                type="password"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Contraseña"
                                className="h-12 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 rounded-md text-base"
                            />
                        </div>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <div className="text-sm text-slate-600">
                        ¿No es tu computadora? Usa el modo Invitado para navegar de forma privada.
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pb-10 px-10">
                    {/* Botón Principal Estilo Pill (Pastilla) */}
                    <div className="flex justify-end w-full">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-medium text-sm transition-all shadow-sm hover:shadow-md"
                        >
                            {loading ? <Loader2 className="mr-4 ml-4 align-items-center animate-spin w-6 h-6" /> : 'Siguiente'}

                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}