'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalUsers: 0,
        recentOrders: [] as any[]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch stats');
                return res.json();
            })
            .then(data => {
                if (data && data.recentOrders) {
                    setStats(data);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <div className="p-10 text-center">Loading dashboard stats...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard Overview</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Orders</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalOrders}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Products</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalProducts}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Users</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Current Orders (Active)</h3>
                {stats.recentOrders.length === 0 ? (
                    <p className="text-gray-500">No active orders.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="text-gray-500 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">ID</th>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Customer</th>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Address</th>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Amt</th>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Date</th>
                                    <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {stats.recentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white text-xs">{order.id}</td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[100px]">{order.customer}</div>
                                        </td>
                                        <td className="px-3 py-2 max-w-[120px] truncate text-gray-500 dark:text-gray-300 text-xs" title={order.address}>{order.address}</td>
                                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white text-sm">₹{order.amount}</td>
                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${order.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
