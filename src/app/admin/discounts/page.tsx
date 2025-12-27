/**
 * Admin Discounts Page
 *
 * Manage discount codes - list, generate, and update
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Tag, Check, X, Clock, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./page.module.css";

interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  isUsed: boolean;
  usedBy: { name: string; email: string } | null;
  generatedForOrder: number;
  expiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
}

export default function AdminDiscountsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [authLoading, isAdmin, router]);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/discounts?filter=${filter}`);
      const data = await response.json();
      if (data.success) setDiscounts(data.discounts);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) fetchDiscounts();
  }, [isAdmin, fetchDiscounts]);

  const generateDiscount = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Generated: ${data.discount.code}`);
        fetchDiscounts();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const deleteDiscount = async (id: string, code: string) => {
    if (!confirm(`Delete discount code ${code} permanently?`)) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Discount deleted");
        fetchDiscounts();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/admin" className={styles.backLink}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Discount Codes</h1>
            <p className={styles.subtitle}>Manage discount codes</p>
          </div>
          <Button onClick={generateDiscount} isLoading={isGenerating}>
            <Plus size={18} />
            Generate Code
          </Button>
        </div>

        <div className={styles.filters}>
          {(["all", "used", "unused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`${styles.filterButton} ${
                filter === f ? styles.active : ""
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {discounts.length === 0 ? (
            <div className={styles.empty}>
              <Tag size={48} />
              <p>No discount codes found</p>
            </div>
          ) : (
            discounts.map((d) => (
              <div key={d.id} className={styles.discountCard}>
                <div className={styles.discountHeader}>
                  <span className={styles.code}>{d.code}</span>
                  <span className={styles.percent}>-{d.discountPercent}%</span>
                </div>
                <div className={styles.discountMeta}>
                  <span>
                    {d.generatedForOrder > 0
                      ? `Order #${d.generatedForOrder}`
                      : "Manual"}
                  </span>
                  <span>Created: {formatDate(d.createdAt)}</span>
                </div>
                <div className={styles.discountStatus}>
                  {d.isUsed ? (
                    <span className={`${styles.badge} ${styles.used}`}>
                      <Check size={14} />
                      Used
                    </span>
                  ) : d.isExpired ? (
                    <span className={`${styles.badge} ${styles.expired}`}>
                      <X size={14} />
                      Expired
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.available}`}>
                      <Tag size={14} />
                      Available
                    </span>
                  )}
                  {d.expiresAt && !d.isUsed && !d.isExpired && (
                    <span className={styles.expiry}>
                      <Clock size={14} />
                      Expires: {formatDate(d.expiresAt)}
                    </span>
                  )}
                  <button
                    onClick={() => deleteDiscount(d.id, d.code)}
                    disabled={deletingId === d.id}
                    className={styles.deleteBtn}
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
