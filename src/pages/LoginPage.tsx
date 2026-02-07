import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const LoginPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4">
            <LoginForm />
        </div>
    );
};

