import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import MovementsPage from "./pages/MovementsPage";
import ManagementPage from "./pages/ManagementPage";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <>
        <Toaster position="top-right" richColors closeButton />
        <BrowserRouter>
          <Routes>
            {/* Ruta por defecto - redirige al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Ruta de login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas con layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute>
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/movements" element={
              <ProtectedRoute>
                <MainLayout>
                  <MovementsPage />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/management" element={
              <ProtectedRoute>
                <MainLayout>
                  <ManagementPage />
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </>
    </QueryClientProvider>
  );
}

export default App;
