/**
 * Product Card Component
 *
 * Displays a product in a card format with add to cart functionality
 *
 * @module components/products/ProductCard
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    stock: number;
  };
}

/**
 * ProductCard component
 */
export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (product.stock === 0) {
      toast.error("This product is out of stock");
      return;
    }

    setIsAdding(true);
    const success = await addToCart(product._id, 1);
    setIsAdding(false);

    if (success) {
      setAdded(true);
      toast.success("Added to cart!");
      setTimeout(() => setAdded(false), 2000);
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/products/${product._id}`} className={styles.card}>
      {/* Image */}
      <div className={styles.imageWrapper}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={styles.image}
        />
        {product.stock === 0 && (
          <div className={styles.outOfStock}>Out of Stock</div>
        )}
        <span className={styles.category}>{product.category}</span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className={`${styles.addButton} ${added ? styles.added : ""}`}
            aria-label="Add to cart"
          >
            {isAdding ? (
              <span className={styles.spinner} />
            ) : added ? (
              <Check size={20} />
            ) : (
              <ShoppingCart size={20} />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
