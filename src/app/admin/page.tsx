/**
 * Admin Dashboard Page
 *
 * Admin statistics and management overview
 *
 * @module app/admin/page
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Tag,
  TrendingUp,
  Settings,
  ChevronRight,
  Package,
  Percent,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

interface Stats {
  totalItemsPurchased: number;
  totalRevenue: number;
  totalOrders: number;
  totalDiscountGiven: number;
  discountCodes: {
    total: number;
    used: number;
    unused: number;
  };
  settings: {
    nthOrderDiscount: number;
    discountPercent: number;
    defaultDiscountExpiry: number | null;
  };
}

interface RecentOrder {
  _id: string;
  orderNumber: number;
  total: number;
  discountCode: string | null;
  discountAmount: number;
  createdAt: string;
  status: string;
  user?: { name: string; email: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>Store overview and management</p>
          </div>
          <Link href="/admin/settings" className={styles.settingsButton}>
            <Settings size={20} />
            Settings
          </Link>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366F1",
              }}
            >
              <Package size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Total Orders</p>
              <p className={styles.statValue}>{stats?.totalOrders || 0}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10B981",
              }}
            >
              <IndianRupee size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Total Revenue</p>
              <p className={styles.statValue}>
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                color: "#F59E0B",
              }}
            >
              <ShoppingBag size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Items Purchased</p>
              <p className={styles.statValue}>
                {stats?.totalItemsPurchased || 0}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{
                background: "rgba(236, 72, 153, 0.1)",
                color: "#EC4899",
              }}
            >
              <TrendingUp size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Total Discount Given</p>
              <p className={styles.statValue}>
                {formatCurrency(stats?.totalDiscountGiven || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Recent Orders */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
            </div>
            <div className={styles.ordersTable}>
              {recentOrders.length === 0 ? (
                <p className={styles.empty}>No orders yet</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Discount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className={styles.orderNumber}>
                          #{order.orderNumber}
                        </td>
                        <td>{order.user?.name || "Guest"}</td>
                        <td className={styles.amount}>
                          {formatCurrency(order.total)}
                        </td>
                        <td>
                          {order.discountAmount > 0 ? (
                            <span className={styles.discountBadge}>
                              -{formatCurrency(order.discountAmount)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={styles.date}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[order.status]
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Discount Codes Summary */}
          <div className={styles.sidebar}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Tag size={20} />
                <h3>Discount Codes</h3>
              </div>
              <div className={styles.discountStats}>
                <div className={styles.discountStat}>
                  <span className={styles.discountLabel}>Total Generated</span>
                  <span className={styles.discountValue}>
                    {stats?.discountCodes.total || 0}
                  </span>
                </div>
                <div className={styles.discountStat}>
                  <span className={styles.discountLabel}>Used</span>
                  <span
                    className={styles.discountValue}
                    style={{ color: "#10B981" }}
                  >
                    {stats?.discountCodes.used || 0}
                  </span>
                </div>
                <div className={styles.discountStat}>
                  <span className={styles.discountLabel}>Available</span>
                  <span
                    className={styles.discountValue}
                    style={{ color: "#F59E0B" }}
                  >
                    {stats?.discountCodes.unused || 0}
                  </span>
                </div>
              </div>
              <Link href="/admin/discounts" className={styles.cardLink}>
                Manage Discounts
                <ChevronRight size={18} />
              </Link>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Percent size={20} />
                <h3>Current Settings</h3>
              </div>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <span>Nth Order Discount</span>
                  <span className={styles.settingValue}>
                    Every {stats?.settings.nthOrderDiscount || 5}th order
                  </span>
                </div>
                <div className={styles.settingItem}>
                  <span>Discount Percent</span>
                  <span className={styles.settingValue}>
                    {stats?.settings.discountPercent || 10}%
                  </span>
                </div>
                <div className={styles.settingItem}>
                  <span>Code Expiry</span>
                  <span className={styles.settingValue}>
                    {stats?.settings.defaultDiscountExpiry
                      ? `${stats.settings.defaultDiscountExpiry} days`
                      : "Never"}
                  </span>
                </div>
              </div>
              <Link href="/admin/settings" className={styles.cardLink}>
                Update Settings
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
