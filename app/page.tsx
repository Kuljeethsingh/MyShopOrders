
'use client';

import Navbar from '@/components/Navbar';
import { useCart, Product } from '@/context/CartContext';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Decorative Header (Gold/Premium Look) */}
      <div className="h-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200"></div>

      <div className="p-6 flex flex-col flex-1 items-center text-center">
        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>

        <div className="w-12 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"></div>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 italic">
          "{product.description}"
        </p>

        <div className="mt-auto w-full">
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ₹{product.price}
          </p>
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-300 transform active:scale-95 ${isAdded
              ? 'bg-green-600 text-white shadow-inner'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-md hover:shadow-xl'
              }`}
          >
            {isAdded ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-600">
              Premium Sweets
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light">
            Indulge in authentic flavors crafted with perfection.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
