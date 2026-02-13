
'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

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

    // Format weekly labels
    if (view === 'weekly') {
        revenueLabels = revenueLabels.map(label => {
            try {
                return `Week of ${format(parseISO(label), 'MMM d')}`;
            } catch (e) { return label; }
        });
    }

    let revenueValues = Object.keys(data[view] || {}).sort().map(label => data[view][label]);

    if (view === 'daily' && startDate && endDate) {
        revenueLabels = revenueLabels.filter(date => date >= startDate && date <= endDate);
        revenueValues = revenueLabels.map(label => data[view][label]);
    }

    const revenueChartData = {
        labels: revenueLabels,
        datasets: [
            {
                label: 'Revenue (₹)',
                data: revenueValues,
                borderColor: 'rgb(249, 115, 22)', // Orange-500
                backgroundColor: 'rgba(249, 115, 22, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const revenueOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `${view.charAt(0).toUpperCase() + view.slice(1)} Revenue` },
        },
    };

    // Product Sales Config
    const productLabels = Object.keys(data.products);
    const productValues = productLabels.map(label => data.products[label]);

    const productChartData = {
        labels: productLabels,
        datasets: [
            {
                label: 'Units Sold',
                data: productValues,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
        ],
    };

    const productOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'Product Sales' },
        },
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Analytics</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Revenue Trends</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {view === 'daily' && (
                                <div className="flex items-center space-x-2 mr-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-xs border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-xs border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className="flex space-x-2">
                                {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${view === v
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Line options={revenueOptions} data={revenueChartData} />
                </div>

                {/* Product Sales Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
                    <Bar options={productOptions} data={productChartData} />
                </div>
            </div>
        </div>
    );
}
