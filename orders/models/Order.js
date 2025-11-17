import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "CANCELLED"],
      default: "PENDING",
    },
    // --- Dados do Cliente Adicionados ---
    userId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    // ------------------------------------
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);