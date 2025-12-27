# UniBlox E-commerce Store

A full-stack e-commerce application built with Next.js 16.1.1, MongoDB/Mongoose featuring cart management, checkout with Razorpay, automatic nth-order discount system, user authentication, and admin dashboard.

## 🚀 Features

### Customer Features

- **Product Browsing**: View products with category filtering and search
- **Shopping Cart**: Add, update, remove items with real-time totals
- **Discount Codes**: Apply discount codes at checkout
- **Seamless Checkout**: Razorpay payment integration
- **Order History**: View past orders and status

### Discount System

- **Nth Order Rewards**: Every 5th order (configurable) automatically generates a 10% discount code
- **Single-Use Codes**: Each discount code can only be used once
- **Optional Expiry**: Admin can set expiration for discount codes

### Admin Features

- **Dashboard**: View total orders, revenue, items sold, discounts given
- **Discount Management**: View all discount codes, generate new ones manually
- **Settings**: Configure nth-order value, discount percentage, and expiry

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React UI  │  │   Contexts  │  │   Razorpay Checkout     │  │
│  │  Components │  │ (Cart/Auth) │  │      (Payment)          │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼───────────────-┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes (/api)                    │    │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌───────────────┐   │    │
│  │  │  Auth  │ │  Cart  │ │ Checkout │ │     Admin     │   │    │
│  │  │ Routes │ │ Routes │ │  Routes  │ │    Routes     │   │    │
│  │  └────────┘ └────────┘ └──────────┘ └───────────────┘   │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                    │
│  ┌─────────────────────────▼───────────────────────────────-┐   │
│  │               Middleware (Auth Protection)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Database                            │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────────┐    │
│  │ Users  │ │Products│ │ Carts │ │ Orders │ │DiscountCodes │    │
│  └────────┘ └────────┘ └───────┘ └────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,         // Unique, lowercase
  password: String,      // Bcrypt hashed (12 rounds)
  name: String,
  role: "customer" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection

```javascript
{
  _id: ObjectId,
  name: String,          // Max 200 chars
  description: String,   // Max 2000 chars
  price: Number,         // INR
  image: String,         // URL
  category: String,
  stock: Number,
  isActive: Boolean,     // Soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

### Carts Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Ref: Users (unique per user)
  items: [{
    product: ObjectId,   // Ref: Products
    quantity: Number,
    priceAtAdd: Number
  }],
  appliedDiscount: ObjectId,  // Ref: DiscountCodes (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Ref: Users
  orderNumber: Number,   // Sequential, unique
  items: [{
    product: ObjectId,
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  subtotal: Number,
  discountCode: String,
  discountPercent: Number,
  discountAmount: Number,
  total: Number,
  paymentId: String,     // Razorpay payment ID
  paymentStatus: "pending" | "completed" | "failed",
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled",
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### DiscountCodes Collection

```javascript
{
  _id: ObjectId,
  code: String,          // Unique, uppercase (e.g., "UNIBLOX-A1B2-C3D4")
  discountPercent: Number, // 1-100
  isUsed: Boolean,
  usedBy: ObjectId,      // Ref: Users (optional)
  usedAt: Date,
  generatedForOrder: Number,
  expiresAt: Date,       // Optional
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Tech Stack

| Category   | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | Next.js 16.1.1 (App Router), React 18, TypeScript |
| Styling    | CSS Modules with Custom Design System             |
| Backend    | Next.js API Routes                                |
| Database   | MongoDB with Mongoose ODM                         |
| Auth       | NextAuth.js v5 (Auth.js)                          |
| Payment    | Razorpay                                          |
| State      | React Context + useReducer                        |
| Validation | Zod                                               |
| Testing    | Jest + React Testing Library                      |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Products CRUD
│   │   ├── cart/         # Cart operations
│   │   ├── checkout/     # Checkout with Razorpay
│   │   ├── orders/       # User orders
│   │   └── admin/        # Admin APIs
│   ├── (shop)/           # Shop pages
│   ├── admin/            # Admin pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── products/         # Product components
├── context/              # React contexts
├── lib/
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database models & connection
│   └── utils/            # Utility functions
└── types/                # TypeScript types
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/saurabhdixit93/uniblox-ecom
cd uniblox-ecom
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp env.template .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_MONGODB_URI=mongodb://localhost:27017/uniblox-store
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_NEXT_PUBLIC_RAZORPAY_KEY_ID
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=your_next_public_razorpay_key_secret
```

4. **Seed the database**

```bash
npx tsx src/lib/db/seed.ts
```

5. **Run the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

| Variable                          | Description                           | Required |
| --------------------------------- | ------------------------------------- | -------- |
| `NEXT_PUBLIC_MONGODB_URI`         | MongoDB connection string             | ✓        |
| `NEXTAUTH_URL`                    | Application base URL                  | ✓        |
| `NEXTAUTH_SECRET`                 | Secret for JWT signing (min 32 chars) | ✓        |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`     | Razorpay API Key ID                   | ✓        |
| `NEXT_PUBLIC_RAZORPAY_KEY_SECRET` | Razorpay API Secret                   | ✓        |

## 👤 Demo Accounts

After seeding, create an admin account by updating a user's role in MongoDB:

```javascript
db.users.updateOne({ email: "admin@uniblox.com" }, { $set: { role: "admin" } });
```

Or sign up with any email and manually set role to 'admin' in the database.

## 📡 API Endpoints

### Authentication

| Method | Endpoint                         | Description       |
| ------ | -------------------------------- | ----------------- |
| POST   | `/api/auth/signup`               | Register new user |
| POST   | `/api/auth/callback/credentials` | Login             |
| GET    | `/api/auth/session`              | Get session       |

### Products

| Method | Endpoint             | Description   |
| ------ | -------------------- | ------------- |
| GET    | `/api/products`      | List products |
| GET    | `/api/products/[id]` | Get product   |

### Cart

| Method | Endpoint                | Description     |
| ------ | ----------------------- | --------------- |
| GET    | `/api/cart`             | Get cart        |
| POST   | `/api/cart`             | Add to cart     |
| PATCH  | `/api/cart/[productId]` | Update quantity |
| DELETE | `/api/cart/[productId]` | Remove item     |
| POST   | `/api/cart/discount`    | Apply discount  |
| DELETE | `/api/cart/discount`    | Remove discount |

### Checkout

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| POST   | `/api/checkout` | Create Razorpay order |
| PUT    | `/api/checkout` | Confirm order         |

### Admin

| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/api/admin/stats`     | Store statistics    |
| GET    | `/api/admin/settings`  | Get settings        |
| PATCH  | `/api/admin/settings`  | Update settings     |
| GET    | `/api/admin/discounts` | List discount codes |
| POST   | `/api/admin/discounts` | Generate discount   |

## 📋 API Request/Response Examples

### Add to Cart

**Request:**

```bash
POST /api/cart
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item added to cart",
  "itemCount": 3
}
```

### Apply Discount Code

**Request:**

```bash
POST /api/cart/discount
Content-Type: application/json

{
  "code": "UNIBLOX-A1B2-C3D4"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Discount applied",
  "discount": {
    "code": "UNIBLOX-A1B2-C3D4",
    "percent": 10
  }
}
```

### Create Checkout Order

**Request:**

```bash
POST /api/checkout
Content-Type: application/json

{
  "shippingAddress": {
    "name": "John Doe",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210"
  }
}
```

**Response:**

```json
{
  "success": true,
  "order": {
    "razorpayOrderId": "order_123abc",
    "amount": 1798.2,
    "currency": "INR",
    "subtotal": 1998,
    "discountPercent": 10,
    "discountAmount": 199.8,
    "total": 1798.2
  },
  "razorpayKey": "rzp_test_..."
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run ESLint
npm run lint
```

### Test Coverage

| Suite      | Tests | Description                              |
| ---------- | ----- | ---------------------------------------- |
| Cart       | 14    | Cart calculations & operations           |
| Discount   | 21    | Code generation, expiry, nth-order logic |
| Utils      | 17    | Price formatting, date utilities         |
| Validation | 17    | Zod schema validation                    |

## 📝 Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Zero warnings/errors
- **JSDoc**: Comprehensive documentation in all modules
- **Zod**: Runtime validation for all API inputs

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT session tokens
- CSRF protection via NextAuth
- Input validation with Zod
- Admin routes protected via middleware

## 🎨 Design

- Modern dark theme with premium aesthetics
- Responsive design (mobile-first)
- Smooth animations and transitions
- Glassmorphism effects

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**

```
Error: NEXT_PUBLIC_MONGODB_URI not defined
```

- Ensure `.env.local` file exists with `NEXT_PUBLIC_MONGODB_URI` set
- Verify MongoDB is running (`mongod --dbpath /data/db`)

**Razorpay Payment Not Working**

- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_SECRET` are set
- In development, use Razorpay test credentials
- Check browser console for script loading errors

**NextAuth Session Issues**

- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Clear browser cookies and local storage
- Verify `NEXTAUTH_URL` matches your dev server URL

**Build Errors**

```bash
npm run lint        # Check for ESLint issues
npx tsc --noEmit    # Check for TypeScript errors
```

## 🤝 Contributing

1. **Fork the repository**

2. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

3. **Make changes following our conventions**

- Add JSDoc comments to all new functions
- Write unit tests for new logic
- Ensure ESLint passes with no warnings

4. **Run tests**

```bash
npm test
npm run lint
npm run build
```

5. **Submit a pull request**

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments with `@param`, `@returns`, `@example`
- Keep functions small and focused

## 📜 License

MIT License
