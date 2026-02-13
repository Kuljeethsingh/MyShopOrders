
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, LogOut, User, Sun, Moon, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function Navbar() {
    const { data: session } = useSession();
    const { items, clearCart } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const [isAdmin, setIsAdmin] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (session?.user) {
            fetch('/api/auth/role')
                .then(res => res.json())
                .then(data => setIsAdmin(data.role === 'admin'))
                .catch(console.error);
        }
    }, [session]);

    if (!mounted) return null;

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-primary dark:text-primary">SweetShop 🍬</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>

                        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary dark:text-gray-300 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                            {itemCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {session ? (
                            <div className="flex items-center space-x-2">
                                <Link href="/profile" className="hidden sm:inline-flex items-center gap-1 p-2 text-gray-600 hover:text-primary dark:text-gray-300 transition-colors font-medium">
                                    <Package className="w-5 h-5" />
                                    My Orders
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" className="hidden sm:block p-2 text-gray-600 hover:text-primary dark:text-gray-300 font-bold">
                                        Admin
                                    </Link>
                                )}
                                <Link href="/profile" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <User className="w-4 h-4" />
                                    Hi, {session.user?.name || 'User'}
                                </Link>
                                <button
                                    onClick={() => {
                                        clearCart();
                                        signOut();
                                    }}
                                    className="hidden sm:block ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 shadow-sm transition-all"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
