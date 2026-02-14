'use client';

import { useState, useEffect } from 'react';

export default function TestAuth() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/test-auth')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                setData({ error: err.message });
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-xl">Running Diagnostics...</div>;

    return (
        <div className="p-10 max-w-4xl mx-auto font-mono">
            <h1 className="text-2xl font-bold mb-4">System Diagnostics</h1>

            <div className="bg-gray-100 p-4 rounded mb-4">
                <h2 className="font-bold text-lg mb-2">1. Environment Variables</h2>
                <pre>{JSON.stringify(data?.environment, null, 2)}</pre>
            </div>

            <div className={`p-4 rounded mb-4 text-white ${data?.database?.status === 'Connected!' ? 'bg-green-600' : 'bg-red-600'}`}>
                <h2 className="font-bold text-lg mb-2">2. Database Connection</h2>
                <p>Status: <strong>{data?.database?.status}</strong></p>
                {data?.database?.sheetTitle && <p>Sheet Title: {data?.database?.sheetTitle}</p>}
            </div>

            <div className="mt-8 text-sm text-gray-500">
                If "HAS_GOOGLE_PRIVATE_KEY" is false, you must add it in Cloud Run Console.<br />
                If Database Status is "Connection Failed", check your Service Account permissions.
            </div>
        </div>
    );
}
