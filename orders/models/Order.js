import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    userId: { type: Number, required: true },
=======
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "CANCELLED"],
      default: "PENDING",
    },
<<<<<<< HEAD
=======
    // --- Dados do Cliente Adicionados ---
    userId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    // ------------------------------------
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
  },
  { timestamps: true }
);

<<<<<<< HEAD
export const Order = mongoose.model("Order", orderSchema);
=======
export const Order = mongoose.model("Order", orderSchema);
>>>>>>> 17a7a2dc88d99f0191af4242724caacc35e5ae2e
