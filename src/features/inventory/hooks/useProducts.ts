import { useState, useEffect } from 'react';
import type { Product } from '@/types/product.types';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TODO: Implementar lógica de productos

    return { products, loading, error };
};
