/**
 * Admin Settings Page
 *
 * Configure store settings for nth-order discount
 *
 * @module app/admin/settings/page
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./page.module.css";

interface Settings {
  nthOrderDiscount: number;
  discountPercent: number;
  defaultDiscountExpiry: number | null;
  totalOrders: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nthOrder, setNthOrder] = useState("5");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [expiryDays, setExpiryDays] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setNthOrder(data.settings.nthOrderDiscount.toString());
        setDiscountPercent(data.settings.discountPercent.toString());
        setExpiryDays(data.settings.defaultDiscountExpiry?.toString() || "");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const nth = parseInt(nthOrder);
    const percent = parseFloat(discountPercent);
    const expiry = expiryDays ? parseInt(expiryDays) : null;

    if (isNaN(nth) || nth < 1) {
      toast.error("Nth order must be at least 1");
      return;
    }

    if (isNaN(percent) || percent < 1 || percent > 100) {
      toast.error("Discount must be between 1% and 100%");
      return;
    }

    if (expiryDays && (isNaN(expiry!) || expiry! < 1)) {
      toast.error("Expiry days must be at least 1");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nthOrderDiscount: nth,
          discountPercent: percent,
          defaultDiscountExpiry: expiry,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Settings updated successfully");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loading}>Loading settings...</div>
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
        <Link href="/admin" className={styles.backLink}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Settings size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Store Settings</h1>
            <p className={styles.subtitle}>
              Configure discount and promotion settings
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Nth Order Discount Configuration</h2>
          <p className={styles.cardDescription}>
            Set the frequency and amount of automatic discount code generation.
            Every Nth order will generate a discount code for the customer.
          </p>

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Generate discount every</label>
              <div className={styles.inputGroup}>
                <Input
                  type="number"
                  min="1"
                  value={nthOrder}
                  onChange={(e) => setNthOrder(e.target.value)}
                  placeholder="5"
                />
                <span className={styles.suffix}>orders</span>
              </div>
              <p className={styles.hint}>
                Currently at {settings?.totalOrders || 0} total orders. Next
                discount code will be generated at order #
                {Math.ceil(
                  (settings?.totalOrders || 0) / parseInt(nthOrder || "5") + 1
                ) * parseInt(nthOrder || "5")}
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Discount Percentage</label>
              <div className={styles.inputGroup}>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="10"
                />
                <span className={styles.suffix}>%</span>
              </div>
              <p className={styles.hint}>
                Discount applied to the entire order
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Default Code Expiry (Optional)
              </label>
              <div className={styles.inputGroup}>
                <Input
                  type="number"
                  min="1"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="Leave empty for no expiry"
                />
                <span className={styles.suffix}>days</span>
              </div>
              <p className={styles.hint}>
                Leave empty for codes that never expire
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save size={18} />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
