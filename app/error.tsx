'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-900">
            <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong!</h2>
            <div className="mb-6 max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <p className="mb-2 font-mono text-sm text-red-500 break-words">{error.message}</p>
                {error.stack && (
                    <pre className="mt-4 max-h-60 overflow-auto text-left text-xs text-gray-500 dark:text-gray-400">
                        {error.stack}
                    </pre>
                )}
            </div>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="rounded bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
            >
                Try again
            </button>
        </div>
    );
}
