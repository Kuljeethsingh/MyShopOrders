
'use client';

import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function CartPage() {
    const { items, removeItem, addItem, decreaseItem, total, clearCart } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    console.log('Razorpay Key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID); // Debug Key

    const [address, setAddress] = useState('');
    const [contact, setContact] = useState('');
    const [name, setName] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [session]);

    const handlePayment = async () => {
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        if (!address || !contact || !name) {
            alert("Please enter your name, address, and contact number.");
            return;
        }

        setIsProcessing(true); // Start processing UI

        try {
            console.log("Initiating payment for amount:", total);
            const res = await fetch('/api/payment', {
                method: 'POST',
                body: JSON.stringify({ amount: total }),
            });
            const data = await res.json();

            if (!res.ok) {
                console.error("Payment API Error:", data);
                throw new Error(data.error || 'Failed to create order');
            }

            const order = data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "SweetShop",
                description: "Order Payment",
                order_id: order.id,
                handler: async function (response: any) {
                    // Still processing verification
                    const verify = await fetch('/api/payment', {
                        method: 'PUT',
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            // Pass additional details to save order
                            address,
                            contact,
                            email: session.user?.email,
                            name: name, // Use state name
                            items: items,
                            amount: total
                        }),
                    });

                    const verifyRes = await verify.json();
                    if (verifyRes.message === 'Payment verified') {
                        // Keep processing true until redirect happens or show success modal
                        alert("Payment Successful! Order Placed.");
                        clearCart();
                        router.push('/');
                    } else {
                        alert("Payment Verification Failed");
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: session.user?.name,
                    email: session.user?.email,
                    contact: contact
                },
                theme: {
                    color: "#4F46E5",
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error("Payment Error:", error);
            alert(`Payment Initialization Failed: ${(error as Error).message}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
                        {items.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Clear Cart
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-500">Your cart is empty.</p>
                        </div>
                    ) : (
                        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
                            <section className="lg:col-span-7">
                                <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <li key={item.id} className="flex py-6 sm:py-10">
                                            <div className="flex-shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-24 h-24 rounded-md object-center object-cover sm:w-48 sm:h-48"
                                                />
                                            </div>

                                            <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                                                <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                                    <div>
                                                        <div className="flex justify-between">
                                                            <h3 className="text-sm">
                                                                <a href="#" className="font-medium text-gray-700 hover:text-gray-800 dark:text-gray-200">
                                                                    {item.name}
                                                                </a>
                                                            </h3>
                                                        </div>
                                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">₹{item.price}</p>
                                                    </div>

                                                    <div className="mt-4 sm:mt-0 sm:pr-9">
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                onClick={() => decreaseItem(item.id)}
                                                                className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                                                            >
                                                                -
                                                            </button>
                                                            <p className="text-sm text-gray-500 dark:text-gray-300">{item.quantity}</p>
                                                            <button
                                                                onClick={() => addItem(item)}
                                                                className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <div className="absolute top-0 right-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.id)}
                                                                className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500"
                                                            >
                                                                <span className="sr-only">Remove</span>
                                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Delivery Details</h2>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                        <textarea
                                            id="address"
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                                        <input
                                            type="tel"
                                            id="contact"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mt-8">Order summary</h2>

                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                        <div className="text-base font-medium text-gray-900 dark:text-white">Order total</div>
                                        <div className="text-base font-medium text-gray-900 dark:text-white">₹{total}</div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-wait"
                                    >
                                        {isProcessing ? 'Processing Payment...' : 'Checkout (Razorpay)'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
