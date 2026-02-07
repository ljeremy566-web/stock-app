// Espejo de DTOs de Java para autenticación

export interface SignInRequest {
    usuario: string;
    clave: string;
}

export interface AuthenticationResponse {
    username: string;
    message: string;
    jwt: string;
    status: boolean;
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}
