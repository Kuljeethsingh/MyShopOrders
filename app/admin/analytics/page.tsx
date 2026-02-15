
'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

// Simple in-memory cache outside component
const cache: { data: any, timestamp: number } = { data: null, timestamp: 0 };


export default function AdminAnalytics() {
    const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const now = Date.now();
        if (cache.data && (now - cache.timestamp < 60000)) {
            setData(cache.data);
            setIsLoading(false);
        }

        fetch('/api/admin/stats')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch stats');
                return res.json();
            })
            .then(stats => {
                if (stats?.charts) {
                    setData(stats.charts);
                    cache.data = stats.charts;
                    cache.timestamp = Date.now();
                }
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, []);

    // Filter Data Logic
    if (!data) return <div className="p-10 text-center">Failed to load data.</div>;

    let revenueLabels = Object.keys(data[view] || {}).sort();

    // Prepare Data for Recharts
    let chartData = revenueLabels.map(label => {
        let displayLabel = label;
        if (view === 'weekly') {
            try {
                displayLabel = `Week ${format(parseISO(label), 'd MMM')}`;
            } catch (e) { }
        } else if (view === 'monthly') {
            try {
                displayLabel = format(parseISO(label), 'MMM yyyy');
            } catch (e) { }
        } else {
            try {
                displayLabel = format(parseISO(label), 'd MMM');
            } catch (e) { }
        }

        return {
            name: displayLabel,
            date: label, // keep original for sorting/filtering
            revenue: data[view][label]
        };
    });

    if (startDate && endDate && view === 'daily') {
        chartData = chartData.filter(item => item.date >= startDate && item.date <= endDate);
    }

    // Product Data
    const productData = Object.keys(data.products).map(key => ({
        name: key,
        sales: data.products[key]
    })).sort((a, b) => b.sales - a.sales).slice(0, 5); // Top 5

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Revenue Overview</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Income trends over time</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {view === 'daily' && (
                                <div className="flex items-center space-x-2 mr-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-xs bg-transparent border-none focus:ring-0 p-1 dark:text-white"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-xs bg-transparent border-none focus:ring-0 p-1 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${view === v
                                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Sales Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Top Products</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Best selling items by volume</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#F59E0B"
                                    radius={[0, 4, 4, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
