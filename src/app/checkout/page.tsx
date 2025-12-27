/**
 * Checkout Page
 *
 * Checkout with shipping form and Razorpay payment
 *
 * @module app/checkout/page
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, Truck, Shield, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./page.module.css";

// Razorpay type declaration
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, discount, discountAmount, total, fetchCart } =
    useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [newDiscountCode, setNewDiscountCode] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    orderNumber: number;
  } | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.name || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {};
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      router.push("/cart");
    }
  }, [items, orderComplete, router]);

  const validate = () => {
    const newErrors: Partial<ShippingAddress> = {};

    if (!shippingAddress.name || shippingAddress.name.length < 2) {
      newErrors.name = "Name is required";
    }
    if (!shippingAddress.address || shippingAddress.address.length < 5) {
      newErrors.address = "Full address is required";
    }
    if (!shippingAddress.city) {
      newErrors.city = "City is required";
    }
    if (!shippingAddress.state) {
      newErrors.state = "State is required";
    }
    if (!shippingAddress.pincode || shippingAddress.pincode.length < 6) {
      newErrors.pincode = "Valid pincode is required";
    }
    if (!shippingAddress.phone || shippingAddress.phone.length < 10) {
      newErrors.phone = "Valid phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCheckout = async () => {
    if (!validate()) return;

    setIsProcessing(true);

    // Wait for Razorpay to load (max 5 seconds)
    let retries = 0;
    while (!window.Razorpay && retries < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (!window.Razorpay) {
      toast.error("Payment system failed to load. Please refresh the page.");
      setIsProcessing(false);
      return;
    }

    try {
      // Create Razorpay order
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Checkout failed");
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.razorpayKey,
        amount: data.order.amountInPaise,
        currency: data.order.currency,
        name: "UniBlox Store",
        description: "Order Payment",
        order_id: data.order.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Confirm order
          const confirmResponse = await fetch("/api/checkout", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              items: data.order.items,
              subtotal: data.order.subtotal,
              discountCode: data.order.discountCode,
              discountPercent: data.order.discountPercent,
              discountAmount: data.order.discountAmount,
              total: data.order.total,
              shippingAddress: data.order.shippingAddress,
              userId: data.order.userId,
            }),
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            setOrderComplete(true);
            setOrderDetails(confirmData.order);

            if (confirmData.newDiscountCode) {
              setNewDiscountCode(confirmData.newDiscountCode.code);
            }

            await fetchCart();
            toast.success("Order placed successfully!");
          } else {
            toast.error(confirmData.error || "Order confirmation failed");
          }

          setIsProcessing(false);
        },
        prefill: {
          name: shippingAddress.name,
          email: user?.email,
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#6366F1",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (orderComplete) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <CheckCircle size={64} />
            </div>
            <h1>Order Placed Successfully!</h1>
            <p>
              Thank you for your order. Your order number is #
              {orderDetails?.orderNumber}
            </p>

            {newDiscountCode && (
              <div className={styles.discountReward}>
                <span className={styles.discountLabel}>
                  🎉 Congratulations! You earned a discount code:
                </span>
                <span className={styles.discountCode}>{newDiscountCode}</span>
                <span className={styles.discountNote}>
                  Use it on your next order for 10% off!
                </span>
              </div>
            )}

            <div className={styles.successActions}>
              <Button onClick={() => router.push("/orders")}>
                View Orders
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/products")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.layout}>
          {/* Shipping Form */}
          <div className={styles.form}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Truck size={20} />
                Shipping Address
              </h2>

              <div className={styles.formGrid}>
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={shippingAddress.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  error={errors.name}
                />

                <Input
                  label="Phone Number"
                  placeholder="9876543210"
                  value={shippingAddress.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  error={errors.phone}
                />

                <div className={styles.fullWidth}>
                  <Input
                    label="Address"
                    placeholder="House No, Street, Area"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    error={errors.address}
                  />
                </div>

                <Input
                  label="City"
                  placeholder="Mumbai"
                  value={shippingAddress.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  error={errors.city}
                />

                <Input
                  label="State"
                  placeholder="Maharashtra"
                  value={shippingAddress.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  error={errors.state}
                />

                <Input
                  label="Pincode"
                  placeholder="400001"
                  value={shippingAddress.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  error={errors.pincode}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <CreditCard size={20} />
                Payment
              </h2>
              <div className={styles.paymentInfo}>
                <Shield size={20} />
                <span>Secure payment powered by Razorpay</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.productId} className={styles.item}>
                  <div className={styles.itemImage}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="60px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemQty}>Qty: {item.quantity}</p>
                  </div>
                  <p className={styles.itemPrice}>{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className={`${styles.totalRow} ${styles.discountRow}`}>
                  <span>Discount ({discount?.percent}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span className={styles.free}>FREE</span>
              </div>

              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              fullWidth
              size="lg"
              isLoading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                `Pay ${formatPrice(total)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
