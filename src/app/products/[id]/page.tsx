"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  Minus,
  Plus,
  Package,
  Truck,
  Shield,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "./page.module.css";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      } else {
        toast.error("Product not found");
        router.push("/products");
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      toast.error("Failed to load product");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) fetchProduct();
  }, [params.id, fetchProduct]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      router.push(`/login?redirect=/products/${params.id}`);
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      toast.success(`Added ${quantity} ${product.name} to cart`);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.notFound}>
            <h1>Product Not Found</h1>
            <Link href="/products" className={styles.backButton}>
              <ArrowLeft size={20} /> Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/products" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className={styles.productLayout}>
          {/* Image Section */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                className={styles.image}
                priority
              />
            </div>
          </div>

          {/* Details Section */}
          <div className={styles.detailsSection}>
            <div className={styles.category}>{product.category}</div>
            <h1 className={styles.title}>{product.name}</h1>

            <div className={styles.price}>{formatPrice(product.price)}</div>

            <div className={styles.stock}>
              {product.stock > 0 ? (
                <span className={styles.inStock}>
                  <Check size={16} /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className={styles.outOfStock}>Out of Stock</span>
              )}
            </div>

            <p className={styles.description}>{product.description}</p>

            {product.stock > 0 && (
              <div className={styles.actions}>
                <div className={styles.quantitySelector}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={styles.quantityBtn}
                  >
                    <Minus size={18} />
                  </button>
                  <span className={styles.quantity}>{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={quantity >= product.stock}
                    className={styles.quantityBtn}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || added}
                  className={`${styles.addToCartBtn} ${
                    added ? styles.added : ""
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={20} /> Added!
                    </>
                  ) : isAdding ? (
                    "Adding..."
                  ) : (
                    <>
                      <ShoppingCart size={20} /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Features */}
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <Package size={20} />
                <span>Free packaging</span>
              </div>
              <div className={styles.featureItem}>
                <Truck size={20} />
                <span>Fast delivery</span>
              </div>
              <div className={styles.featureItem}>
                <Shield size={20} />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
