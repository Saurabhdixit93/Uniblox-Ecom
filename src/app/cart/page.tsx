/**
 * Cart Page
 *
 * Shopping cart with items, quantity controls, and checkout
 *
 * @module app/cart/page
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  X,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./page.module.css";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    discount,
    discountAmount,
    total,
    isLoading,
    updateQuantity,
    removeItem,
    applyDiscount,
    removeDiscount,
  } = useCart();

  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const handleQuantityChange = async (
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId: string) => {
    const success = await removeItem(productId);
    if (success) {
      toast.success("Item removed from cart");
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    setIsApplyingDiscount(true);
    const result = await applyDiscount(discountCode.trim());
    setIsApplyingDiscount(false);

    if (result.success) {
      toast.success("Discount applied!");
      setDiscountCode("");
    } else {
      toast.error(result.error || "Invalid discount code");
    }
  };

  const handleRemoveDiscount = async () => {
    await removeDiscount();
    toast.success("Discount removed");
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please login to checkout");
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading cart...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={48} />
            </div>
            <h1>Your cart is empty</h1>
            <p>Looks like you haven&apos;t added any items yet</p>
            <Link href="/products" className={styles.shopButton}>
              Start Shopping
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Shopping Cart</h1>
        <p className={styles.subtitle}>
          {itemCount} item{itemCount > 1 ? "s" : ""} in your cart
        </p>

        <div className={styles.layout}>
          {/* Cart Items */}
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.productId} className={styles.item}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="100px"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className={styles.itemDetails}>
                  <Link
                    href={`/products/${item.productId}`}
                    className={styles.itemName}
                  >
                    {item.name}
                  </Link>
                  <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                </div>

                <div className={styles.itemQuantity}>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.productId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                    className={styles.quantityButton}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    className={styles.quantityButton}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className={styles.itemTotal}>
                  {formatPrice(item.total)}
                </div>

                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  className={styles.removeButton}
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {/* Discount Code */}
            <div className={styles.discountSection}>
              {discount ? (
                <div className={styles.appliedDiscount}>
                  <div className={styles.discountInfo}>
                    <Tag size={18} />
                    <span>{discount.code}</span>
                    <span className={styles.discountPercent}>
                      -{discount.percent}%
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveDiscount}
                    className={styles.removeDiscountButton}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className={styles.discountInput}>
                  <input
                    type="text"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) =>
                      setDiscountCode(e.target.value.toUpperCase())
                    }
                    className={styles.discountField}
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount}
                    className={styles.applyButton}
                  >
                    {isApplyingDiscount ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className={`${styles.totalRow} ${styles.discount}`}>
                  <span>Discount ({discount?.percent}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span className={styles.freeShipping}>FREE</span>
              </div>

              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button onClick={handleCheckout} fullWidth size="lg">
              Proceed to Checkout
              <ArrowRight size={20} />
            </Button>

            <Link href="/products" className={styles.continueShopping}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
