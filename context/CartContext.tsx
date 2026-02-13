
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export type Product = {
    id: string;
    name: string;
    price: number;
    image_url: string; // Changed from image to image_url to match DB
    description: string;
};

type CartItem = Product & { quantity: number };

type CartContextType = {
    items: CartItem[];
    addItem: (product: Product) => void;
    decreaseItem: (productId: string) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    // Auto-clear cart on logout
    const { status } = useSession();
    const [prevStatus, setPrevStatus] = useState(status);

    useEffect(() => {
        if (prevStatus === 'authenticated' && status === 'unauthenticated') {
            setItems([]);
        }
        setPrevStatus(status);
    }, [status, prevStatus]);

    const addItem = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const decreaseItem = (productId: string) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === productId);
            if (existing && existing.quantity > 1) {
                return prev.map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prev.filter((item) => item.id !== productId);
        });
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, decreaseItem, removeItem, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
