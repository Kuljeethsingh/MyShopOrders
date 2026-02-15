
'use client';

import { Home, ShoppingCart, User, LayoutDashboard, Package, BarChart3, Settings, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';

export default function BottomNav() {
    const pathname = usePathname();
    const { items } = useCart();
    const { data: session } = useSession();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const isActive = (path: string) => pathname === path;

    const isAdmin = session?.user?.role === 'admin';

    if (isAdmin) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    <Link href="/admin" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/admin') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Overview</span>
                    </Link>
                    <Link href="/admin/orders" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/admin/orders') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                        <ListOrdered className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Orders</span>
                    </Link>
                    <Link href="/admin/products" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/admin/products') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Package className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Products</span>
                    </Link>
                    <Link href="/admin/analytics" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/admin/analytics') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Analytics</span>
                    </Link>
                    <Link href="/admin/settings" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/admin/settings') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Settings</span>
                    </Link>
                </div>
            </div>
        );
    }

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
                    href="/profile"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium">Account</span>
                </Link>
            </div>
        </div>
    );
}
