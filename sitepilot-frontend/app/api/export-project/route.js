import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { layoutJSON, siteName = "sitepilot-exported-site" } = await request.json();

    const zip = new JSZip();

    // 1. package.json
    const packageJson = {
      name: siteName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "15.1.11",
        react: "19.0.0",
        "react-dom": "19.0.0",
        "lucide-react": "^0.575.0",
        "framer-motion": "^12.34.3",
        clsx: "^2.1.1",
        "tailwind-merge": "^3.5.0",
        tailwindcss: "^4.0.0",
      },
    };
    zip.file("package.json", JSON.stringify(packageJson, null, 2));

    // 2. Production Multi-Stage Dockerfile
    const dockerfile = `# ===================================================
# Multi-Stage Production Dockerfile for SitePilot Site
# ===================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Step 1: Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# Step 2: Build Next.js application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Step 3: Production minimal runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
`;
    zip.file("Dockerfile", dockerfile);

    // 3. Kubernetes Helm / Manifest
    const k8sDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${packageJson.name}
  labels:
    app: ${packageJson.name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${packageJson.name}
  template:
    metadata:
      labels:
        app: ${packageJson.name}
    spec:
      containers:
        - name: web
          image: ${packageJson.name}:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ${packageJson.name}-service
spec:
  type: ClusterIP
  selector:
    app: ${packageJson.name}
  ports:
    - port: 80
      targetPort: 3000
`;
    zip.file("k8s/deployment.yaml", k8sDeployment);

    // 4. app/globals.css
    const globalsCss = `@import "tailwindcss";

@layer base {
  body {
    background-color: #0b1411;
    color: #ffffff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
}
`;
    zip.file("app/globals.css", globalsCss);

    // 5. app/layout.jsx
    const layoutJsx = `import "./globals.css";

export const metadata = {
  title: "${layoutJSON?.site?.name || "SitePilot Created Site"}",
  description: "Crafted with SitePilot Next-Generation Web Builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#d3ff4a] selection:text-[#0b1411]">
        {children}
      </body>
    </html>
  );
}
`;
    zip.file("app/layout.jsx", layoutJsx);

    // 6. app/page.jsx (Interactive compilation of layout)
    const pageJsx = `"use client";

import React, { useState } from "react";
import { Sparkles, ShoppingBag, ArrowRight, Star, Check, Zap, MessageCircle } from "lucide-react";

export default function Page() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([
    { id: 1, title: "Pro Headphones", price: 2499, qty: 1 }
  ]);

  const addToCart = (product) => {
    setCartItems(prev => [...prev, { ...product, qty: 1 }]);
    setCartOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#0b1411] text-white">
      {/* Floating Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/10 px-6 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 font-black text-sm tracking-wider">
          <div className="w-7 h-7 rounded-full bg-[#d3ff4a] text-[#0b1411] flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <span>${layoutJSON?.site?.name || "SITEPILOT"}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#store" className="text-gray-300 hover:text-white transition-colors">Store</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          <button 
            onClick={() => setCartOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all relative"
          >
            <ShoppingBag size={16} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d3ff4a] text-[#0b1411] text-[9px] font-black flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 mb-6">
            <Sparkles size={13} className="text-[#d3ff4a]" />
            <span>Production-Ready Next.js 15 Web Application</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 leading-[1.08]">
            Crafted for <span className="text-[#d3ff4a]">Extraordinary</span> Performance
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Exported directly from SitePilot. Ready for zero-downtime deployment on Docker, Kubernetes, or Vercel.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#store" className="px-8 py-4 bg-[#d3ff4a] text-[#0b1411] font-black text-xs uppercase tracking-wider rounded-full hover:scale-105 transition-all">
              Explore Store
            </a>
          </div>
        </div>
      </section>

      {/* Storefront Section */}
      <section id="store" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d3ff4a] bg-[#d3ff4a]/10 px-3.5 py-1.5 rounded-full">
            E-COMMERCE NATIVE
          </span>
          <h2 className="text-4xl font-black mt-3">Featured Products</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 1, title: "Pro Wireless Audio", price: 2499, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80" },
            { id: 2, title: "Mechanical Keyboard", price: 3499, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80" },
            { id: 3, title: "Smart Watch Ultra", price: 1999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80" },
          ].map(p => (
            <div key={p.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between hover:border-[#d3ff4a]/50 transition-all">
              <img src={p.image} alt={p.title} className="w-full aspect-square object-cover rounded-2xl mb-4" />
              <h3 className="font-bold text-sm mb-2">{p.title}</h3>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="font-black text-lg">₹{p.price}</span>
                <button 
                  onClick={() => addToCart(p)}
                  className="px-4 py-2 bg-[#d3ff4a] text-[#0b1411] rounded-xl text-xs font-black hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <ShoppingBag size={13} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Lead Plugin */}
      <a 
        href="https://wa.me/919876543210" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-50"
      >
        <MessageCircle size={28} className="fill-white" />
      </a>
    </main>
  );
}
`;
    zip.file("app/page.jsx", pageJsx);

    // 7. README.md with Quickstart instructions
    const readme = `# ${siteName}
Exported from SitePilot Web Builder.

## 🚀 Quick Start (Local Development)
\`\`\`bash
npm install
npm run dev
\`\`\`
Visit [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Containerization
\`\`\`bash
docker build -t ${packageJson.name} .
docker run -p 3000:3000 ${packageJson.name}
\`\`\`

## ☸️ Kubernetes Deployment
\`\`\`bash
kubectl apply -f k8s/deployment.yaml
\`\`\`
`;
    zip.file("README.md", readme);

    // Generate zip binary buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${packageJson.name}.zip"`,
      },
    });
  } catch (error) {
    console.error("Project export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export project" },
      { status: 500 }
    );
  }
}
