
'use client';
import { useEffect, useState } from 'react';


import { Download, FileSpreadsheet, FileText, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Simple in-memory cache outside component
const cache: { data: any[], timestamp: number } = { data: [], timestamp: 0 };

export default function AdminOrdersPage() {
    const [shopSettings, setShopSettings] = useState<any>(null);
    const [orders, setOrders] = useState([] as any[]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        const now = Date.now();
        if (cache.data.length > 0 && (now - cache.timestamp < 60000)) {
            setOrders(cache.data);
            setIsLoading(false);
        }

        const fetchOrders = fetch('/api/admin/orders').then(res => {
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        });
        const fetchSettings = fetch('/api/admin/settings').then(res => res.json());

        Promise.all([fetchOrders, fetchSettings])
            .then(([ordersData, settingsData]) => {
                if (Array.isArray(ordersData)) {
                    setOrders(ordersData);
                    cache.data = ordersData;
                    cache.timestamp = Date.now();
                }
                if (settingsData && !settingsData.error) {
                    setShopSettings(settingsData);
                }
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, []);

    const filteredOrders = orders.filter(order => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(lowerSearch) ||
            order.customer.toLowerCase().includes(lowerSearch) ||
            (order.email && order.email.toLowerCase().includes(lowerSearch))
        );
    });

    const handleExportExcel = () => {
        let ordersToExport = orders;
        if (startDate && endDate) {
            ordersToExport = orders.filter(o => {
                const orderDate = new Date(o.date).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        const ws = XLSX.utils.json_to_sheet(ordersToExport.map(o => {
            // Parse items to readable string
            let itemsString = '';
            try {
                const items = JSON.parse(o.items || '[]');
                itemsString = items.map((i: any) => `${i.name} (${i.quantity})`).join(', ');
            } catch (e) { itemsString = 'Invalid Data'; }

            return {
                'Order ID': o.id,
                'Customer': o.customer,
                'Amount': o.amount,
                'Status': o.status,
                'Items': itemsString,
                'Address': o.address,
                'Contact': o.contact,
                'Date': new Date(o.date).toLocaleDateString(),
                'Email': o.email,
            };
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");
        XLSX.writeFile(wb, "sweetshop_orders.xlsx");
    };

    const handleDownloadPDF = (order: any) => {
        console.log("Generating PDF for order:", order);
        const doc = new jsPDF();

        // --- Header ---
        // Right Side: INVOICE Label and Details
        doc.setFontSize(24);
        doc.setTextColor(50);
        doc.text("INVOICE", 150, 20); // Top Right

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`INVOICE NO: ${order.id.substring(0, 8).toUpperCase()}`, 150, 30);
        doc.text(`DATE: ${new Date(order.date).toLocaleDateString()}`, 150, 35);

        // Left Side: Shop Brand
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text(shopSettings?.name || "SweetShop", 14, 20);

        doc.setFontSize(9);
        doc.setTextColor(100);
        const shopAddress = shopSettings?.address || "Address Not Available";
        const splitShopAddr = doc.splitTextToSize(shopAddress, 80);
        doc.text(splitShopAddr, 14, 28);

        let yPos = 28 + (splitShopAddr.length * 4) + 2;
        doc.text(`Contact: ${shopSettings?.contact || "N/A"}`, 14, yPos);
        yPos += 5;
        if (shopSettings?.gstin) {
            doc.text(`GSTIN: ${shopSettings.gstin}`, 14, yPos);
            yPos += 5;
        }

        // --- Divider ---
        doc.setDrawColor(220);
        doc.line(14, yPos + 5, 196, yPos + 5);

        // --- Bill To Section ---
        yPos += 15;
        const leftCol = 14;

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("ISSUED TO:", leftCol, yPos);

        yPos += 5;
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(order.customer || "Guest", leftCol, yPos);

        yPos += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        if (order.address) {
            const splitCustAddr = doc.splitTextToSize(order.address, 100);
            doc.text(splitCustAddr, leftCol, yPos);
            yPos += (splitCustAddr.length * 5);
        }

        if (order.email) {
            doc.text(order.email, leftCol, yPos);
            yPos += 5;
        }
        if (order.contact) {
            doc.text(order.contact, leftCol, yPos);
            yPos += 5;
        }

        yPos += 10; // Space before table

        // --- Items Table ---
        let items: any[] = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) {
            console.error("JSON parse error for items", e);
            items = [];
        }

        const tableBody = Array.isArray(items) && items.length > 0
            ? items.map((item: any) => [
                item.name || "Item",
                `Rs. ${parseFloat(item.price || 0).toFixed(2)}`,
                item.quantity || 1,
                `Rs. ${(parseFloat(item.price || 0) * (parseInt(item.quantity || 1))).toFixed(2)}`
            ])
            : [["No product details available", "-", "-", "-"]];

        autoTable(doc, {
            startY: yPos,
            head: [['DESCRIPTION', 'UNIT PRICE', 'QTY', 'TOTAL']],
            body: tableBody,
            theme: 'grid', // Clean grid
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0
            },
            styles: {
                textColor: [50, 50, 50],
                fontSize: 10,
                cellPadding: 3,
                lineColor: [230, 230, 230],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { cellWidth: 30, halign: 'right' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
            },
            didDrawPage: (data: any) => {
                // Header is already drawn
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // --- Totals ---
        const rightColX = 140;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text("SUBTOTAL", rightColX, finalY);
        doc.text(`Rs. ${order.amount}`, 196, finalY, { align: 'right' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", rightColX, finalY + 12);
        doc.text(`Rs. ${order.amount}`, 196, finalY + 12, { align: 'right' });


        // --- Footer ---
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150);
        doc.text("Thank you for your business!", 105, 280, { align: 'center' });

        doc.save(`Invoice_${order.id}.pdf`);
    };

    const handleEmailInvoice = async (order: any) => {
        if (!confirm(`Send invoice to ${order.email}?`)) return;

        try {
            const res = await fetch('/api/admin/invoice/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    email: order.email,
                    customer: order.customer,
                    amount: order.amount,
                    items: order.items
                })
            });
            const data = await res.json();
            if (res.ok) alert('Email sent successfully!');
            else alert(`Failed to send email: ${data.error || 'Unknown error'}`);
        } catch (e: any) {
            console.error(e);
            alert(`Error sending email: ${e.message}`);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/orders/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                // Update cache
                const cachedIndex = cache.data.findIndex(o => o.id === orderId);
                if (cachedIndex !== -1) cache.data[cachedIndex].status = newStatus;
            } else {
                alert('Failed to update status');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating status');
        }
    };

    if (isLoading && orders.length === 0) return <div className="p-10 text-center">Loading orders...</div>;
    if (!Array.isArray(orders)) return <div className="p-10 text-center">Failed to load orders.</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full sm:w-64"
                        />
                        <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>

                    {/* Date Export */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded-md px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded-md px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white align-top">
                                        {order.id}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 align-top">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300 align-top">
                                        <div className="font-medium text-gray-900 dark:text-white">{order.customer || 'Guest'}</div>
                                        {/* Email hidden for layout, can be seen in details */}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white align-top">
                                        ₹{order.amount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap align-top">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                            className={`px-2 py-1 rounded-full text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Delivered' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            <option value="paid">Paid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-500 dark:text-gray-300 align-top max-w-xs">
                                        <div className="line-clamp-2">
                                            {(() => {
                                                try {
                                                    const items = JSON.parse(order.items || '[]');
                                                    return items.map((i: any) => `${i.name} (${i.quantity})`).join(', ');
                                                } catch (e) { return 'Invalid data'; }
                                            })()}
                                        </div>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-500 dark:text-gray-300 align-top max-w-xs">
                                        <div className="truncate w-40" title={order.address}>{order.address}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 align-top text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-1 hover:text-indigo-600 transition-colors"
                                                title="View Details"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(order)}
                                                className="p-1 hover:text-red-600 transition-colors"
                                                title="Download PDF Invoice"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEmailInvoice(order)}
                                                className="p-1 hover:text-blue-600 transition-colors"
                                                title="Email Invoice"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Order Details</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Order ID</div>
                                    <div className="font-medium dark:text-white">{selectedOrder.id}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                                    <div className="font-medium dark:text-white">{new Date(selectedOrder.date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Customer</div>
                                    <div className="font-medium dark:text-white">{selectedOrder.customer}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                                    <div className="font-medium dark:text-white">{selectedOrder.status}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                                <div className="dark:text-white">{selectedOrder.email}</div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                                <div className="dark:text-white">{selectedOrder.address}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Contact</div>
                                <div className="dark:text-white">{selectedOrder.contact}</div>
                            </div>

                            <div className="border-t pt-4 dark:border-gray-700">
                                <h3 className="font-semibold mb-2 dark:text-white">Items</h3>
                                <ul className="space-y-2">
                                    {(() => {
                                        try {
                                            const items = JSON.parse(selectedOrder.items || '[]');
                                            return items.map((item: any, idx: number) => (
                                                <li key={idx} className="flex justify-between text-sm dark:text-gray-300">
                                                    <span>{item.name} x {item.quantity}</span>
                                                    <span>₹{(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}</span>
                                                </li>
                                            ));
                                        } catch (e) { return <li>Invalid items</li>; }
                                    })()}
                                </ul>
                                <div className="flex justify-between font-bold mt-4 pt-2 border-t dark:border-gray-700 dark:text-white">
                                    <span>Total</span>
                                    <span>₹{selectedOrder.amount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => handleDownloadPDF(selectedOrder)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
