/**
 * Orders Page
 *
 * User order history
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./page.module.css";

interface Order {
  id: string;
  orderNumber: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/orders");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  if (authLoading || isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>My Orders</h1>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <Package size={48} />
            <p>No orders yet</p>
            <Link href="/products" className={styles.shopLink}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <span className={styles.orderNumber}>
                      Order #{order.orderNumber}
                    </span>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span className={`${styles.status} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className={styles.orderItems}>
                  {order.items.slice(0, 3).map((item, i) => (
                    <span key={i} className={styles.item}>
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className={styles.more}>
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
                <div className={styles.orderFooter}>
                  {order.discountAmount > 0 && (
                    <span className={styles.discount}>
                      Saved {formatPrice(order.discountAmount)}
                    </span>
                  )}
                  <span className={styles.total}>
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
