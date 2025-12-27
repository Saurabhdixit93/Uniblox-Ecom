/**
 * Database Models Index
 *
 * Central export for all Mongoose models.
 * Import from this file to ensure consistent model usage.
 *
 * @module lib/db/models
 */

export { default as User, type IUser } from "./User.model";
export { default as Product, type IProduct } from "./Product.model";
export { default as Cart, type ICart, type ICartItem } from "./Cart.model";
export { default as Order, type IOrder, type IOrderItem } from "./Order.model";
export {
  default as DiscountCode,
  type IDiscountCode,
} from "./DiscountCode.model";
export {
  default as StoreSettings,
  type IStoreSettings,
  getStoreSettings,
} from "./StoreSettings.model";
