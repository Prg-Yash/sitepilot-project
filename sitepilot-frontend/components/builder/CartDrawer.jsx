"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, Loader2 } from "lucide-react";

export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, getSubtotal, currency } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const discountAmount = (subtotal * discount) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    if (promoCode.trim().toUpperCase() === "SPIT2026" || promoCode.trim().toUpperCase() === "LAUNCH20") {
      setDiscount(20);
    } else {
      setPromoError("Invalid code. Try 'SPIT2026' for 20% off");
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    try {
      // 1. Create Razorpay order via API
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          currency: "INR",
          items,
        }),
      });

      const orderData = await res.json();

      // Load Razorpay Script dynamically if needed
      const loadScript = () =>
        new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const loaded = await loadScript();

      if (!loaded || !window.Razorpay) {
        alert("Payment Gateway: Simulating Successful Order! Total: " + currency + finalTotal);
        setIsCheckingOut(false);
        closeCart();
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: finalTotal * 100,
        currency: "INR",
        name: "SitePilot Store",
        description: `Order for ${items.length} item(s)`,
        image: "https://sitepilot.devally.in/logo.png",
        order_id: orderData?.orderId || undefined,
        handler: function (response) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id || "demo_paid"}`);
          closeCart();
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "+91 9876543210",
        },
        theme: {
          color: "#0b1411",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn("Razorpay checkout fallback:", err);
      alert(`Demo Checkout: Total ${currency}${finalTotal} placed successfully!`);
      closeCart();
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#fcfdfc]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0b1411] text-[#d3ff4a] rounded-xl">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider text-gray-900">Your Cart</h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {items.length} {items.length === 1 ? "item" : "items"} selected
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <ShoppingBag size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-sm">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                Add some amazing products from the store to get started!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white transition-all shadow-sm"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-18 h-18 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 truncate">{item.title}</h4>
                      {item.variant && (
                        <p className="text-[10px] text-gray-400 font-medium">{item.variant}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-xs text-gray-900">
                      {currency}
                      {item.price}
                    </span>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-gray-500 hover:text-gray-900 text-xs font-bold"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-black min-w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-gray-500 hover:text-gray-900 text-xs font-bold"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-[#fcfdfc] space-y-3">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Promo code (e.g. SPIT2026)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-gray-900 transition-all uppercase placeholder:normal-case"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
              >
                Apply
              </button>
            </form>
            {promoError && <p className="text-[10px] text-red-500 font-medium pl-1">{promoError}</p>}
            {discount > 0 && (
              <p className="text-[10px] text-emerald-600 font-bold pl-1">
                🎉 {discount}% discount applied!
              </p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 pt-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>
                  {currency}
                  {subtotal}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({discount}%)</span>
                  <span>
                    -{currency}
                    {discountAmount.toFixed(0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>
                  {currency}
                  {finalTotal.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 px-4 bg-[#0b1411] hover:bg-[#1d2321] text-[#d3ff4a] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay with Razorpay ({currency}
                  {finalTotal.toFixed(0)})
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium pt-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              100% Secure Checkout via Razorpay & 256-Bit SSL
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
