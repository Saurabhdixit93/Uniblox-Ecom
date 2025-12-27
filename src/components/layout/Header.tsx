/**
 * Header Component
 *
 * Main navigation header with cart, auth, and navigation links
 *
 * @module components/layout/Header
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import styles from "./Header.module.css";
import Image from "next/image";

/**
 * Header component with navigation and cart
 */
export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
  ];

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/uniblox-logo.png"
            alt="Logo"
            width={50}
            height={50}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>UniBlox</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${
                pathname === link.href ? styles.active : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Cart */}
          <Link href="/cart" className={styles.cartButton}>
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button className={styles.userButton}>
                <User size={22} />
                <span className={styles.userName}>
                  {user?.name?.split(" ")[0]}
                </span>
              </button>
              <div className={styles.dropdown}>
                <Link href="/orders" className={styles.dropdownItem}>
                  <Package size={18} />
                  My Orders
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={styles.dropdownItem}>
                    <LayoutDashboard size={18} />
                    Admin Panel
                  </Link>
                )}
                <button onClick={logout} className={styles.dropdownItem}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/orders"
                className={styles.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={styles.mobileLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button onClick={logout} className={styles.mobileLink}>
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
