
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
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="relative h-40 sm:h-48 w-full bg-gray-200">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:opacity-75"
        />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {product.description}
            </p>
          </div>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
            ₹{product.price}
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`mt-auto w-full flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${isAdded
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
        >
          {isAdded ? 'Added' : 'Add to Cart'}
        </button>
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
          console.error("API returned non-array data:", data);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Premium Indian</span>{' '}
              <span className="block text-indigo-600 xl:inline">Sweets</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Authentic taste delivered to your doorstep.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
