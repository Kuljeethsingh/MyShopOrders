
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { FileText, Download, User as UserIcon, Package, MapPin, Phone } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (session?.user) {
            fetch('/api/orders')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch orders');
                    return res.json();
                })
                .then(data => {
                    setOrders(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [session, status, router]);

    const handleDownloadPDF = (order: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229);
        doc.text("SweetShop", 105, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("INVOICE", 105, 40, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Order ID: ${order.id}`, 20, 50);
        doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 20, 56);
        doc.text(`Customer: ${order.customer}`, 20, 62);

        try {
            const items = JSON.parse(order.items || '[]');
            const tableData = items.map((item: any) => [
                item.name,
                item.quantity,
                parseFloat(item.price || 0).toFixed(2),
                (parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)
            ]);

            (doc as any).autoTable({
                startY: 70,
                head: [['Item', 'Qty', 'Price', 'Total']],
                body: tableData,
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.text(`Total Amount: Rs. ${order.amount}`, 140, finalY);
        } catch (e) { }

        doc.save(`invoice_${order.id}.pdf`);
    };

    if (status === 'loading' || loading) {
        return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* User Profile Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <div className="flex flex-col items-center">
                                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mb-4">
                                    <UserIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{session?.user?.name}</h2>
                                <p className="text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                                <div className="mt-4 inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    Member
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            Order History
                        </h2>

                        {orders.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No orders yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">Start shopping to see your orders here!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Order #{order.id}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize 
                                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            order.status === 'Delivered' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Placed on {new Date(order.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:mt-0 text-right">
                                                <div className="text-xl font-bold text-gray-900 dark:text-white">₹{order.amount}</div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 flex justify-between items-center">
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                {(() => {
                                                    try {
                                                        const items = JSON.parse(order.items || '[]');
                                                        const count = items.reduce((acc: number, item: any) => acc + (parseInt(item.quantity) || 0), 0);
                                                        return `${count} item${count !== 1 ? 's' : ''}`;
                                                    } catch { return 'Items unavailable'; }
                                                })()}
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                                >
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(order)}
                                                    className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
                                                >
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Invoice
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Items List */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Items</h4>
                                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {(() => {
                                                try {
                                                    const items = JSON.parse(selectedOrder.items || '[]');
                                                    return items.map((item: any, idx: number) => (
                                                        <li key={idx} className="py-3 flex justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                                            </div>
                                                            <div className="text-gray-900 dark:text-white font-medium">
                                                                ₹{((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                                                            </div>
                                                        </li>
                                                    ));
                                                } catch { return <li>Error loading items</li>; }
                                            })()}
                                        </ul>
                                        <div className="flex justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 font-bold text-lg">
                                            <span className="text-gray-900 dark:text-white">Total</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">₹{selectedOrder.amount}</span>
                                        </div>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-3">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-500" /> Delivery Address
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">{selectedOrder.address}</p>

                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mt-4">
                                            <Phone className="w-4 h-4 text-gray-500" /> Contact
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pl-6">{selectedOrder.contact}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 mr-3"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF(selectedOrder)}
                                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Download Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
