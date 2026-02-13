
'use client';

import { Home, Search, ShoppingCart, User, Grid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { items } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-xs font-medium">Home</span>
                </Link>

                <Link
                    href="/products" // Assuming we have a products page or similar
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/products') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <Grid className="w-6 h-6" />
                    <span className="text-xs font-medium">Menu</span>
                </Link>

                <Link
                    href="/cart"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/cart') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-medium">Cart</span>
                </Link>

                <Link
                    href="/profile" // Or admin if admin?
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') || isActive('/admin') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium">Account</span>
                </Link>
            </div>
        </div>
    );
}
