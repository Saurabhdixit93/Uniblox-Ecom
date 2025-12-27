"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  Gift,
  Zap,
  Star,
  Package,
} from "lucide-react";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.badge}>
            <Sparkles size={16} />
            <span>Every 5th order gets 10% OFF!</span>
          </div>

          <h1 className={styles.title}>
            Welcome to <span className={styles.gradient}>UniBlox</span>
          </h1>

          <p className={styles.tagline}>Building Blocks of Smart Shopping</p>

          <p className={styles.subtitle}>
            Discover curated premium products with exclusive nth-order
            discounts. The smarter you shop, the more you save.
          </p>

          <div className={styles.cta}>
            <Link href="/products" className={styles.primaryButton}>
              Start Shopping
              <ArrowRight size={20} />
            </Link>
            <Link href="/signup" className={styles.secondaryButton}>
              Create Account
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>500+</span>
              <span className={styles.statLabel}>Products</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>10K+</span>
              <span className={styles.statLabel}>Happy Customers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>4.9</span>
              <span className={styles.statLabel}>Store Rating</span>
            </div>
          </div>
        </div>

        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            How <span className={styles.gradient}>UniBlox</span> Rewards You
          </h2>
          <p className={styles.sectionSubtitle}>
            Our unique discount system rewards loyal shoppers automatically
          </p>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <Package size={32} className={styles.stepIcon} />
              <h3>Shop Products</h3>
              <p>Browse and add your favorite items to cart</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <Zap size={32} className={styles.stepIcon} />
              <h3>Complete Orders</h3>
              <p>Checkout securely with Razorpay</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <Gift size={32} className={styles.stepIcon} />
              <h3>Get Rewarded</h3>
              <p>Every 5th order earns you 10% OFF!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Gift size={28} />
              </div>
              <h3>Smart Discounts</h3>
              <p>Auto-generated discount codes for every 5th order</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Shield size={28} />
              </div>
              <h3>Secure Payments</h3>
              <p>Protected checkout with Razorpay integration</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Truck size={28} />
              </div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable shipping across India</p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Star size={28} />
              </div>
              <h3>Premium Quality</h3>
              <p>Curated selection of top-rated products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categories}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Shop by Category</h2>

          <div className={styles.categoryGrid}>
            {[
              { name: "Electronics", emoji: "🎧", color: "#6366F1" },
              { name: "Clothing", emoji: "👕", color: "#EC4899" },
              { name: "Accessories", emoji: "👜", color: "#F59E0B" },
              { name: "Footwear", emoji: "👟", color: "#10B981" },
              { name: "Lifestyle", emoji: "🏠", color: "#8B5CF6" },
              { name: "Fitness", emoji: "💪", color: "#EF4444" },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name}`}
                className={styles.categoryCard}
                style={{ "--accent": category.color } as React.CSSProperties}
              >
                <span className={styles.categoryEmoji}>{category.emoji}</span>
                <span className={styles.categoryName}>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2>Ready to unlock smart savings?</h2>
              <p>
                Join UniBlox today and start earning automatic discounts with
                every purchase.
              </p>
            </div>
            <Link href="/products" className={styles.ctaButton}>
              Shop Now
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className={styles.footer}>
        <div className="container">
          <p>© 2024 UniBlox Store. Building blocks of smart shopping.</p>
        </div>
      </footer>
    </div>
  );
}
