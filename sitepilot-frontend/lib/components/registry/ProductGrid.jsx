"use client";

import { clsx } from "clsx";
import { ShoppingBag, Star, Zap, Check, Eye } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import useBuilderStore from "@/lib/stores/builderStore";

export default function ProductGrid({ props = {}, styles = {}, isSelected, onClick, id }) {
  const {
    title = "Featured Store Collection",
    subtitle = "Explore our premium hand-crafted products with instant delivery and secure Razorpay checkout.",
    badge = "ONLINE STORE",
    currency = "₹",
    products = [
      {
        id: "prod-1",
        title: "Pro Noise-Canceling Headphones",
        category: "Audio Equipment",
        price: 2499,
        comparePrice: 3999,
        rating: 4.9,
        reviews: 142,
        badge: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80",
      },
      {
        id: "prod-2",
        title: "Minimalist Mechanical Keyboard",
        category: "Workstation",
        price: 3499,
        comparePrice: 4999,
        rating: 4.8,
        reviews: 98,
        badge: "TRENDING",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80",
      },
      {
        id: "prod-3",
        title: "Smart Fitness Watch Ultra",
        category: "Wearables",
        price: 1999,
        comparePrice: 2999,
        rating: 5.0,
        reviews: 215,
        badge: "SALE -35%",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80",
      },
      {
        id: "prod-4",
        title: "Precision Ergonomic Mouse",
        category: "Accessories",
        price: 1299,
        comparePrice: 1899,
        rating: 4.7,
        reviews: 84,
        badge: "NEW",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=80",
      },
    ],
    theme = "dark",
  } = props;

  const addItem = useCartStore((s) => s.addItem);
  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const handleInlineEdit = (key, value) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { [key]: value });
    }
  };

  const handleProductEdit = (index, field, value) => {
    if (id && updateComponentProps) {
      const updated = [...products];
      updated[index] = { ...updated[index], [field]: value };
      updateComponentProps(id, { products: updated });
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  };

  const isDark = theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative py-24 px-6 overflow-hidden transition-all duration-300",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isDark ? "bg-[#0b1411] text-white" : "bg-white text-gray-900"
      )}
      style={{
        backgroundColor: styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff"),
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "96px",
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : "96px",
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            {badge && (
              <span
                contentEditable={isSelected}
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit("badge", e.currentTarget.innerText)}
                className="inline-block text-[11px] font-black uppercase tracking-widest text-[#d3ff4a] bg-[#d3ff4a]/10 px-3.5 py-1.5 rounded-full mb-3 outline-none"
              >
                {badge}
              </span>
            )}

            <h2
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit("title", e.currentTarget.innerText)}
              className={clsx(
                "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight outline-none",
                isDark ? "text-white" : "text-gray-950"
              )}
            >
              {title}
            </h2>

            <p
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit("subtitle", e.currentTarget.innerText)}
              className={clsx(
                "text-sm sm:text-base mt-2 max-w-xl outline-none",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Razorpay Verified</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <div
              key={product.id || idx}
              className={clsx(
                "rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group/prod hover:scale-[1.02]",
                isDark
                  ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                  : "bg-white border-gray-100 shadow-sm hover:shadow-xl"
              )}
            >
              {/* Image & Badge Container */}
              <div className="relative aspect-square overflow-hidden bg-gray-100/10">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover/prod:scale-105 transition-transform duration-500"
                />

                {product.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0b1411]/90 text-[#d3ff4a] text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {product.category || "Collection"}
                  </span>

                  <h3
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => handleProductEdit(idx, "title", e.currentTarget.innerText)}
                    className={clsx(
                      "font-bold text-sm mb-2 line-clamp-1 outline-none",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {product.title}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex text-amber-400">
                      <Star size={11} className="fill-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-300">{product.rating || 4.9}</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      ({product.reviews || 80})
                    </span>
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-white">
                        {currency}
                        {product.price}
                      </span>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-500 line-through">
                          {currency}
                          {product.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="p-2.5 bg-[#d3ff4a] hover:bg-[#bce63b] text-[#0b1411] rounded-xl font-black transition-all hover:scale-110 active:scale-95 shadow-md flex items-center gap-1.5 text-xs"
                    title="Add to Cart"
                  >
                    <ShoppingBag size={14} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
