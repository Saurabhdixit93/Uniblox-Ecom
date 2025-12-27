import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const NEXT_PUBLIC_MONGODB_URI =
  process.env.NEXT_PUBLIC_MONGODB_URI ||
  "mongodb://localhost:27017/uniblox-store";

const sampleProducts = [
  {
    name: "Premium Wireless Headphones",
    description:
      "High-quality wireless headphones with active noise cancellation.",
    price: 4999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Electronics",
    stock: 50,
    isActive: true,
  },
  {
    name: "Smart Watch Pro",
    description: "Advanced smartwatch with health monitoring and GPS.",
    price: 7999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Electronics",
    stock: 30,
    isActive: true,
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Comfortable and sustainable organic cotton t-shirt.",
    price: 999,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    category: "Clothing",
    stock: 100,
    isActive: true,
  },
  {
    name: "Leather Messenger Bag",
    description: "Handcrafted genuine leather messenger bag.",
    price: 3499,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
    category: "Accessories",
    stock: 25,
    isActive: true,
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Double-walled vacuum insulated water bottle.",
    price: 699,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
    category: "Lifestyle",
    stock: 75,
    isActive: true,
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB mechanical gaming keyboard with Cherry MX switches.",
    price: 5499,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500",
    category: "Electronics",
    stock: 40,
    isActive: true,
  },
  {
    name: "Running Shoes Ultra",
    description: "Lightweight running shoes with advanced cushioning.",
    price: 4299,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    category: "Footwear",
    stock: 60,
    isActive: true,
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Waterproof portable speaker with 360° sound.",
    price: 2999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    category: "Electronics",
    stock: 45,
    isActive: true,
  },
  {
    name: "Minimalist Wallet",
    description: "Slim RFID-blocking wallet made from genuine leather.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    category: "Accessories",
    stock: 80,
    isActive: true,
  },
  {
    name: "Yoga Mat Premium",
    description: "Extra thick non-slip yoga mat with alignment lines.",
    price: 1499,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
    category: "Fitness",
    stock: 55,
    isActive: true,
  },
  {
    name: "Wireless Charging Pad",
    description: "Fast wireless charging pad compatible with all Qi devices.",
    price: 1999,
    image:
      "https://images.unsplash.com/photo-1698314440004-95623e12c9db?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Electronics",
    stock: 65,
    isActive: true,
  },
  {
    name: "Sunglasses Classic",
    description: "Polarized sunglasses with UV400 protection.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    category: "Accessories",
    stock: 35,
    isActive: true,
  },
];

async function seed() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(NEXT_PUBLIC_MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Product schema
    const ProductSchema = new mongoose.Schema(
      {
        name: String,
        description: String,
        price: Number,
        image: String,
        category: String,
        stock: Number,
        isActive: Boolean,
      },
      { timestamps: true }
    );
    const Product =
      mongoose.models.Product || mongoose.model("Product", ProductSchema);

    // User schema
    const UserSchema = new mongoose.Schema(
      {
        email: { type: String, unique: true, lowercase: true },
        password: String,
        name: String,
        role: { type: String, default: "customer" },
      },
      { timestamps: true }
    );
    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // StoreSettings schema
    const StoreSettingsSchema = new mongoose.Schema(
      {
        nthOrderDiscount: { type: Number, default: 5 },
        discountPercent: { type: Number, default: 10 },
        totalOrders: { type: Number, default: 0 },
        defaultDiscountExpiry: { type: Number, default: null },
      },
      { timestamps: true }
    );
    const StoreSettings =
      mongoose.models.StoreSettings ||
      mongoose.model("StoreSettings", StoreSettingsSchema);

    // Clear and seed products
    console.log("🗑️  Clearing existing products...");
    await Product.deleteMany({});
    console.log("📦 Inserting sample products...");
    await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${sampleProducts.length} products`);

    // Create demo users
    const hashedPassword = await bcrypt.hash("password123", 12);

    const existingAdmin = await User.findOne({ email: "admin@uniblox.com" });
    if (!existingAdmin) {
      await User.create({
        email: "admin@uniblox.com",
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
      });
      console.log("✅ Created admin user: admin@uniblox.com / password123");
    }

    const existingCustomer = await User.findOne({
      email: "customer@uniblox.com",
    });
    if (!existingCustomer) {
      await User.create({
        email: "customer@uniblox.com",
        password: hashedPassword,
        name: "Test Customer",
        role: "customer",
      });
      console.log(
        "✅ Created customer user: customer@uniblox.com / password123"
      );
    }

    // Create store settings
    const existingSettings = await StoreSettings.findOne();
    if (!existingSettings) {
      await StoreSettings.create({
        nthOrderDiscount: 5,
        discountPercent: 10,
        totalOrders: 0,
      });
      console.log("✅ Created store settings");
    }

    await mongoose.disconnect();
    console.log("🏁 Seeding complete!");
    console.log("\n📋 Demo Accounts:");
    console.log("   Admin: admin@uniblox.com / password123");
    console.log("   Customer: customer@uniblox.com / password123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
