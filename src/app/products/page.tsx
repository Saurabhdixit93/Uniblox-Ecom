/**
 * Products Page
 *
 * Displays all products with filtering by category
 *
 * @module app/products/page
 */

"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import styles from "./page.module.css";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams();
      if (selectedCategory) urlParams.set("category", selectedCategory);
      if (searchQuery) urlParams.set("search", searchQuery);

      const response = await fetch(`/api/products?${urlParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {selectedCategory || "All Products"}
            </h1>
            <p className={styles.subtitle}>{products.length} products found</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Search */}
            <div className={styles.searchWrapper}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Categories */}
            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>
                <Filter size={18} />
                Categories
              </h3>
              <div className={styles.categoryList}>
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`${styles.categoryButton} ${
                    !selectedCategory ? styles.active : ""
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`${styles.categoryButton} ${
                      selectedCategory === category ? styles.active : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchQuery) && (
              <button onClick={clearFilters} className={styles.clearButton}>
                <X size={16} />
                Clear Filters
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <div className={styles.content}>
            {isLoading ? (
              <div className={styles.grid}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={styles.skeleton}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonTitle} />
                      <div className={styles.skeletonText} />
                      <div className={styles.skeletonPrice} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <p>No products found</p>
                <button onClick={clearFilters} className={styles.emptyButton}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
