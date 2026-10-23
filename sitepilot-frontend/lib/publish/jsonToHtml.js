/**
 * JSON → HTML/CSS/JS CONVERTER
 *
 * Converts the builder's layout JSON into standalone HTML, CSS, and JS files.
 * Mirrors the rendering logic of each registry component into plain HTML+inline styles.
 */

import prisma from '@/lib/prisma';
import { generateFormHTML, generateFormJS, generateFormCSS } from '@/lib/form-renderer';

// ============================================================================
// TRACKER — served from the app's own public/ folder via <script src>
// ============================================================================

/**
 * Returns a <script> tag that loads tracker.js from the SitePilot app server.
 *
 * The tracker.js file lives in public/tracker.js of this Next.js app, so it is
 * served at {APP_URL}/tracker.js. By loading it via src we get:
 *  - Single source of truth: update tracker.js once → every site picks it up
 *  - No code stored on user's side
 *  - Browser caching for repeat visits
 *
 * The tracker script itself derives the API base URL from its own src attribute,
 * so no separate data-api attribute is needed.
 */
function buildTrackerTag(siteId, pageSlug, appBaseUrl) {
  const base = appBaseUrl.replace(/\/+$/, '');
  return `<script src="${base}/tracker.js" data-site="${escapeHtml(siteId)}" data-page="${escapeHtml(pageSlug)}" defer><\/script>`;
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleObj(obj) {
  if (!obj || Object.keys(obj).length === 0) return "";
  const css = Object.entries(obj)
    .filter(([, v]) => v != null && v !== "" && v !== undefined)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join("; ");
  return css ? ` style="${css}"` : "";
}

function camelToKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function px(v) {
  if (v == null || v === "") return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

// ============================================================================
// COMPONENT RENDERERS  (type → HTML string)
// ============================================================================

const componentRenderers = {
  // ── Hero ──────────────────────────────────────────────────────
  // ── Hero ──────────────────────────────────────────────────────
  Hero: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1") || (!styles?.backgroundColor && props.theme !== "light");
    const bg = styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff");
    const color = isDark ? "#ffffff" : (styles?.textColor || "#1f2937");
    const pt = px(styles?.paddingTop) || "90px";
    const pb = px(styles?.paddingBottom) || "90px";
    const bgImg = props.backgroundImage
      ? `background-image: url(${props.backgroundImage}); background-size: cover; background-position: center;`
      : "";

    const title = props.title || "Craft High-Converting Websites with AI";
    const subtitle = props.subtitle || "Build breathtaking digital experiences with interactive animations, headless commerce, and instant Razorpay checkout.";
    const badgeText = props.badgeText || "✨ AI-Powered Store & Builder v2.0 →";
    const ctaText = props.ctaText || "Explore Collection";
    const ctaLink = props.ctaLink || "#store";
    const secondaryCtaText = props.secondaryCtaText || "View Features";
    const secondaryCtaLink = props.secondaryCtaLink || "#features";

    return `<section style="position: relative; overflow: hidden; min-height: 520px; display: flex; align-items: center; justify-content: center; background-color: ${bg}; padding-top: ${pt}; padding-bottom: ${pb}; color: ${color}; ${bgImg}">
  <!-- Radial Glow Spotlight -->
  <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 750px; height: 380px; background: radial-gradient(circle, rgba(211,255,74,0.18) 0%, rgba(16,185,129,0.08) 40%, transparent 70%); filter: blur(48px); pointer-events: none; z-index: 0;"></div>
  <!-- Subtle Grid Pattern -->
  <div style="position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 32px 32px; pointer-events: none; z-index: 0;"></div>

  <div style="position: relative; z-index: 10; width: 100%; max-width: 900px; margin: 0 auto; text-align: center; padding: 0 1.5rem;">
    <!-- Animated Badge -->
    ${badgeText ? `
    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); margin-bottom: 1.75rem; font-size: 0.8rem; font-weight: 700; color: #e5e7eb; letter-spacing: 0.02em;">
      <span style="color: #d3ff4a;">✨</span>
      <span>${escapeHtml(badgeText)}</span>
    </div>` : ''}

    <!-- Heading -->
    <h1 style="font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem; color: ${color}; letter-spacing: -0.03em;">
      ${escapeHtml(title)}
    </h1>

    <!-- Subtitle -->
    <p style="font-size: 1.15rem; max-width: 680px; margin: 0 auto 2.5rem; color: ${isDark ? '#9ca3af' : '#4b5563'}; line-height: 1.6; font-weight: 400;">
      ${escapeHtml(subtitle)}
    </p>

    <!-- CTAs -->
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem;">
      ${ctaText ? `
      <a href="${escapeHtml(ctaLink)}" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 2.2rem; background: #d3ff4a; color: #0b1411; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 9999px; text-decoration: none; box-shadow: 0 12px 28px -6px rgba(211,255,74,0.35); transition: transform 0.15s, background-color 0.15s;">
        <span>${escapeHtml(ctaText)}</span>
        <span>&rarr;</span>
      </a>` : ''}

      ${secondaryCtaText ? `
      <a href="${escapeHtml(secondaryCtaLink)}" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.85rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); color: ${isDark ? '#ffffff' : '#111827'}; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 9999px; text-decoration: none; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background 0.15s;">
        <span style="color: #d3ff4a;">▶</span>
        <span>${escapeHtml(secondaryCtaText)}</span>
      </a>` : ''}
    </div>

    <!-- Social Proof Stack -->
    <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.25rem; font-size: 0.8rem; color: #9ca3af;">
      <div style="display: flex; margin-right: -0.5rem;">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop" alt="User" style="width: 28px; height: 28px; border-radius: 9999px; border: 2px solid #0b1411; margin-right: -8px; object-fit: cover;" />
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="User" style="width: 28px; height: 28px; border-radius: 9999px; border: 2px solid #0b1411; margin-right: -8px; object-fit: cover;" />
        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop" alt="User" style="width: 28px; height: 28px; border-radius: 9999px; border: 2px solid #0b1411; object-fit: cover;" />
      </div>
      <div style="color: #fbbf24; letter-spacing: 2px;">★★★★★</div>
      <span style="font-weight: 600; color: #e5e7eb;">4.9/5 from 10,000+ happy builders</span>
      <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: #34d399;">
        <span>✓</span> No credit card required
      </span>
    </div>
  </div>
</section>`;
  },

  // ── Text ──────────────────────────────────────────────────────
  Text: (props, styles) => {
    const tag = props.variant || "p";
    const sizeMap = {
      h1: "2.5rem",
      h2: "1.875rem",
      h3: "1.5rem",
      h4: "1.25rem",
      h5: "1.125rem",
      h6: "1rem",
      p: "1rem",
    };
    const weightMap = {
      h1: "700",
      h2: "700",
      h3: "600",
      h4: "600",
      h5: "500",
      h6: "500",
      p: "400",
    };
    const s = {
      "font-size": sizeMap[tag] || "1rem",
      "font-weight": weightMap[tag] || "400",
      color: styles?.textColor || "#1f2937",
      "text-align": styles?.textAlign || "left",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "background-color": styles?.backgroundColor,
    };
    return `<${tag}${styleObj(s)}>${escapeHtml(props.content || "Enter your text here")}</${tag}>`;
  },

  // ── Heading ───────────────────────────────────────────────────
  Heading: (props, styles) => {
    const tag = props.level || "h2";
    const sizeMap = {
      h1: "3rem",
      h2: "2.25rem",
      h3: "1.875rem",
      h4: "1.5rem",
      h5: "1.25rem",
      h6: "1.125rem",
    };
    const weightMap = {
      h1: "700",
      h2: "700",
      h3: "600",
      h4: "600",
      h5: "500",
      h6: "500",
    };
    const s = {
      "font-size": sizeMap[tag] || "2.25rem",
      "font-weight": weightMap[tag] || "700",
      "margin-bottom": "1rem",
      color: styles?.textColor || "#1f2937",
      "text-align": styles?.textAlign || "left",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "padding-left": px(styles?.paddingLeft),
      "padding-right": px(styles?.paddingRight),
      "margin-top": px(styles?.marginTop),
      "background-color": styles?.backgroundColor,
    };
    return `<${tag}${styleObj(s)}>${escapeHtml(props.text || "Heading Text")}</${tag}>`;
  },

  // ── Image ─────────────────────────────────────────────────────
  Image: (props, styles) => {
    const src = props.src || "https://via.placeholder.com/800x400";
    const alt = escapeHtml(props.alt || "Image");
    const w = props.width ? `${props.width}px` : "100%";
    const h = props.height ? `${props.height}px` : "auto";
    const fit = props.objectFit || "cover";
    const br = props.borderRadius ? `${props.borderRadius}px` : undefined;

    const imgStyle = {
      width: w,
      height: h,
      "max-width": "100%",
      "object-fit": fit,
      "border-radius": br,
      display: "block",
    };
    const img = `<img src="${escapeHtml(src)}" alt="${alt}"${styleObj(imgStyle)} />`;

    const wrapStyle = {
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "background-color": styles?.backgroundColor,
      "text-align": styles?.textAlign || "left",
    };

    if (props.linkUrl) {
      return `<div${styleObj(wrapStyle)}><a href="${escapeHtml(props.linkUrl)}">${img}</a></div>`;
    }
    return `<div${styleObj(wrapStyle)}>${img}</div>`;
  },

  // ── Button ────────────────────────────────────────────────────
  Button: (props, styles) => {
    const text = escapeHtml(props.text || "Button Text");
    const variant = props.variant || "primary";
    const variantClass = {
      primary: "sp-btn-primary",
      secondary: "sp-btn-secondary",
      outline: "sp-btn-outline",
    };
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
    };
    const href = props.link || "#";
    return `<div style="display: inline-block;${Object.entries(wrapStyle)
      .filter(([, v]) => v)
      .map(([k, v]) => ` ${k}: ${v};`)
      .join("")}">
  <a href="${escapeHtml(href)}" class="${variantClass[variant] || "sp-btn-primary"}">${text}</a>
</div>`;
  },

  // ── Link ──────────────────────────────────────────────────────
  Link: (props, styles) => {
    const s = {
      color: styles?.textColor || "#2563eb",
      "text-decoration": "underline",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "text-align": styles?.textAlign,
      "background-color": styles?.backgroundColor,
      "font-size": px(styles?.fontSize),
    };
    const target = props.openInNewTab
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    return `<a href="${escapeHtml(props.href || "#")}"${target}${styleObj(s)}>${escapeHtml(props.text || "Link Text")}</a>`;
  },

  // ── LinkBox ───────────────────────────────────────────────────
  LinkBox: (props, styles) => {
    const target = props.openInNewTab
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    const s = {
      display: "block",
      padding: px(styles?.padding) || "1.5rem",
      border: `1px solid ${styles?.borderColor || "#e5e7eb"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      "text-decoration": "none",
      transition: "box-shadow 0.2s",
    };
    const titleColor = styles?.textColor || "#1f2937";
    const descColor = styles?.textColor ? `${styles.textColor}cc` : "#6b7280";
    return `<a href="${escapeHtml(props.href || "#")}"${target}${styleObj(s)} class="sp-link-box">
  <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: ${titleColor};">${escapeHtml(props.title || "Link Title")}</h3>
  <p style="font-size: 0.875rem; color: ${descColor};">${escapeHtml(props.description || "Click to navigate")}</p>
</a>`;
  },

  // ── Divider ───────────────────────────────────────────────────
  Divider: (props, styles) => {
    const thickness = props.thickness || 1;
    const divStyle = props.style || "solid";
    const s = {
      "border-width": `${thickness}px 0 0 0`,
      "border-style": divStyle,
      "border-color": styles?.textColor || "#e5e7eb",
      "margin-top": px(styles?.marginTop) || "2rem",
      "margin-bottom": px(styles?.marginBottom) || "2rem",
      "background-color": "transparent",
    };
    return `<hr${styleObj(s)} />`;
  },

  // ── ImageBox ──────────────────────────────────────────────────
  ImageBox: (props, styles) => {
    const ar = props.aspectRatio || "16/9";
    const wrapStyle = {
      position: "relative",
      overflow: "hidden",
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#f3f4f6",
    };
    let imgHtml = "";
    if (props.src) {
      imgHtml = `<img src="${escapeHtml(props.src)}" alt="${escapeHtml(props.alt || "Image")}" style="width: 100%; height: 100%; object-fit: ${styles?.objectFit || "cover"};" />`;
    } else {
      imgHtml = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #e5e7eb;"><p style="color: #9ca3af;">No image selected</p></div>`;
    }
    let captionHtml = "";
    if (props.caption) {
      captionHtml = `<div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; background-color: ${styles?.overlayColor || "rgba(0,0,0,0.7)"};">
  <p style="font-size: 0.875rem; color: ${styles?.textColor || "#ffffff"};">${escapeHtml(props.caption)}</p>
</div>`;
    }
    return `<div${styleObj(wrapStyle)}><div style="aspect-ratio: ${ar};">${imgHtml}</div>${captionHtml}</div>`;
  },

  // ── Video ─────────────────────────────────────────────────────
  Video: (props, styles) => {
    let embedUrl = null;
    const url = props.url || "";
    const autoplay = props.autoplay ? 1 : 0;
    const controls = props.controls !== false ? 1 : 0;

    if (url && props.type === "youtube") {
      const match = url.match(
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
      );
      const videoId = match && match[2].length === 11 ? match[2] : null;
      if (videoId)
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&controls=${controls}`;
    } else if (url && props.type === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const videoId = match ? match[1] : null;
      if (videoId)
        embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay}`;
    } else if (url) {
      embedUrl = url;
    }

    const bg = styles?.backgroundColor || "#000000";
    if (embedUrl) {
      return `<div style="position: relative; overflow: hidden; border-radius: 0.5rem; aspect-ratio: 16/9; background-color: ${bg};">
  <iframe src="${escapeHtml(embedUrl)}" style="width: 100%; height: 100%; position: absolute; inset: 0; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Video"></iframe>
</div>`;
    }
    return `<div style="aspect-ratio: 16/9; background-color: ${bg}; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff;"><p>No video</p></div>`;
  },

  // ── Map ───────────────────────────────────────────────────────
  Map: (props, styles) => {
    const height = props.height || 400;
    const zoom = props.zoom || 15;
    const bg = styles?.backgroundColor || "#e5e7eb";
    let src = "";
    if (props.latitude && props.longitude) {
      src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${props.longitude}!3d${props.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s&z=${zoom}`;
    } else if (props.address) {
      src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(props.address)}&zoom=${zoom}`;
    }
    if (src) {
      return `<div style="overflow: hidden; border-radius: 0.5rem; height: ${height}px; background-color: ${bg};"><iframe src="${escapeHtml(src)}" style="width: 100%; height: 100%; border: 0;" allowfullscreen loading="lazy" title="Google Maps"></iframe></div>`;
    }
    return `<div style="height: ${height}px; background-color: ${bg}; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280;"><p>Enter address or coordinates</p></div>`;
  },

  // ── Icon ──────────────────────────────────────────────────────
  Icon: (props, styles) => {
    // We use a simple SVG placeholder since lucide-react isn't available in static HTML
    const size = props.size || 24;
    const color = styles?.textColor || "#1f2937";
    const padding = px(styles?.padding) || "8px";
    const bg = styles?.backgroundColor || "transparent";
    const br = px(styles?.borderRadius);
    // For the published HTML we use the icon name as text in a styled span
    return `<span style="display: inline-flex; align-items: center; justify-content: center; width: ${size + 16}px; height: ${size + 16}px; padding: ${padding}; background-color: ${bg};${br ? ` border-radius: ${br};` : ""} font-size: ${size}px; color: ${color};" title="${escapeHtml(props.name || "Icon")}">★</span>`;
  },

  // ── Gallery ───────────────────────────────────────────────────
  Gallery: (props, styles) => {
    const columns = props.columns || 3;
    const images = props.images?.length
      ? props.images
      : [
        { src: "https://via.placeholder.com/400", alt: "Gallery 1" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 2" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 3" },
      ];
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop) || "20px",
      "padding-bottom": px(styles?.paddingBottom) || "20px",
      "background-color": styles?.backgroundColor,
    };
    const gridStyle = {
      display: "grid",
      "grid-template-columns": `repeat(${columns}, 1fr)`,
      gap: "1rem",
    };
    const imgs = images
      .map(
        (img) =>
          `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || "")}" style="width: 100%; height: auto; border-radius: 0.5rem;" />`,
      )
      .join("\n      ");
    return `<div${styleObj(wrapStyle)}>
  <div${styleObj(gridStyle)}>
      ${imgs}
  </div>
</div>`;
  },

  // ── Navbar ────────────────────────────────────────────────────
  Navbar: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1") || (!styles?.backgroundColor && props.theme !== "light");
    const bg = styles?.backgroundColor || (isDark ? "rgba(11, 20, 17, 0.9)" : "rgba(255, 255, 255, 0.9)");
    const color = isDark ? "#ffffff" : "#111827";
    const links = props.links?.length
      ? props.links
      : [
        { label: "Features", href: "#features" },
        { label: "Products", href: "#store" },
        { label: "Pricing", href: "#pricing" },
        { label: "Contact", href: "#contact" },
      ];
    const linkHtml = links
      .map(
        (l) =>
          `<a href="${escapeHtml(l.href)}" style="color: ${isDark ? '#d1d5db' : '#4b5563'}; text-decoration: none; font-size: 0.8rem; font-weight: 700; transition: color 0.15s;" onmouseover="this.style.color='${isDark ? '#ffffff' : '#111827'}'" onmouseout="this.style.color='${isDark ? '#d1d5db' : '#4b5563'}'">${escapeHtml(l.label)}</a>`,
      )
      .join("\n      ");

    return `<header style="width: 100%; position: relative; z-index: 50; padding: 1.25rem 1.5rem; background-color: ${bg};">
  <div style="max-width: 1050px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; border-radius: 9999px; background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);">
    <!-- Brand Logo -->
    <div style="display: flex; align-items: center; gap: 0.65rem;">
      <div style="width: 32px; height: 32px; border-radius: 9999px; background: #d3ff4a; color: #0b1411; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(211,255,74,0.4);">
        ✦
      </div>
      <span style="font-weight: 900; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; color: ${color};">
        ${escapeHtml(props.logo || "SitePilot Pro")}
      </span>
    </div>

    <!-- Desktop Nav Links -->
    <nav style="display: flex; align-items: center; gap: 1.75rem;">
      ${linkHtml}
    </nav>

    <!-- Right Actions -->
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <!-- Shopping Bag Button -->
      <button onclick="window.sitepilotToggleCart()" style="position: relative; padding: 0.5rem 0.85rem; border-radius: 9999px; background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; border: none; color: ${color}; cursor: pointer; display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 700; transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <span id="sp-cart-count" style="display: inline-block; background: #d3ff4a; color: #0b1411; font-size: 10px; font-weight: 900; padding: 0.1rem 0.45rem; border-radius: 9999px; line-height: 1;">0</span>
      </button>

      <!-- CTA Button -->
      <a href="${escapeHtml(props.ctaLink || '#store')}" style="padding: 0.55rem 1.35rem; background: #d3ff4a; color: #0b1411; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 12px rgba(211,255,74,0.3); transition: transform 0.15s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ${escapeHtml(props.ctaText || "Get Started")}
      </a>
    </div>
  </div>
</header>`;
  },

  // ── Footer ────────────────────────────────────────────────────
  Footer: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1") || (!styles?.backgroundColor && props.theme !== "light");
    const bg = styles?.backgroundColor || (isDark ? "#080d0b" : "#1f2937");
    const color = styles?.textColor || "#ffffff";
    const copyright =
      props.copyright ||
      props.text ||
      "© 2026 SitePilot. All rights reserved.";
    let linksHtml = "";
    if (props.links?.length) {
      const ll = props.links
        .map(
          (l) =>
            `<a href="${escapeHtml(l.href)}" style="color: ${isDark ? '#9ca3af' : color}; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: color 0.15s;" onmouseover="this.style.color='#d3ff4a'" onmouseout="this.style.color='${isDark ? '#9ca3af' : color}'">${escapeHtml(l.label)}</a>`,
        )
        .join("\n        ");
      linksHtml = `<div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 1.5rem;">\n        ${ll}\n      </div>`;
    }
    return `<footer style="padding: 3.5rem 1.5rem; text-align: center; background-color: ${bg}; color: ${color}; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'};">
  ${linksHtml}
  <p style="font-size: 0.85rem; color: ${isDark ? '#6b7280' : '#d1d5db'}; font-weight: 500;">${escapeHtml(copyright)}</p>
</footer>`;
  },

  // ── Features ──────────────────────────────────────────────────
  Features: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1") || (!styles?.backgroundColor && props.theme !== "light");
    const bg = styles?.backgroundColor || (isDark ? "#080d0b" : "#f9fafb");
    const color = isDark ? "#ffffff" : "#111827";
    const pt = px(styles?.paddingTop) || "96px";
    const pb = px(styles?.paddingBottom) || "96px";
    const badge = props.badge || "CORE CAPABILITIES";
    const title = props.title || props.heading || "Engineered for Peak Performance";
    const subtitle = props.subtitle || "Everything you need to craft, launch, and scale production-ready web experiences with unprecedented speed.";

    const defaultItems = [
      {
        icon: "⚡",
        title: "Sub-Second Edge Rendering",
        description: "Zero server lag with global CloudFront distribution and ultra-optimized asset pre-fetching.",
      },
      {
        icon: "🛡️",
        title: "Enterprise Multi-Tenancy",
        description: "Isolated environments, custom SSL domains, and automated DNS validation out of the box.",
      },
      {
        icon: "🤝",
        title: "Multiplayer Collaboration",
        description: "Real-time visual editing with cursor tracking, component locking, and instant peer synchronization.",
      },
      {
        icon: "🛒",
        title: "Headless E-Commerce Native",
        description: "Plug-and-play product catalogs, cart drawers, and instant Razorpay payment gateway integration.",
      },
      {
        icon: "📦",
        title: "Kubernetes Ready Export",
        description: "Download standalone Next.js 15 source code with multi-stage Dockerfiles ready for any cluster.",
      },
      {
        icon: "✨",
        title: "AI-Powered Generation",
        description: "Generate full multi-page layouts and marketing copy with integrated Gemini 2.5 generative intelligence.",
      },
    ];

    const items = (props.items?.length ? props.items : (props.features?.length ? props.features : defaultItems));

    const cardsHtml = items
      .map((item, idx) => {
        const iconChar = item.icon || defaultItems[idx % defaultItems.length].icon;
        return `
      <div style="position: relative; background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}; border-radius: 1.25rem; padding: 2rem; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='${isDark ? 'rgba(211,255,74,0.4)' : '#3b82f6'}'; this.style.transform='translateY(-3px)';" onmouseout="this.style.borderColor='${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}'; this.style.transform='none';">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(211, 255, 74, 0.1); color: #d3ff4a; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-bottom: 1.25rem;">
          ${escapeHtml(iconChar)}
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.65rem; color: ${color}; letter-spacing: -0.01em;">
          ${escapeHtml(item.title)}
        </h3>
        <p style="font-size: 0.9rem; color: ${isDark ? '#9ca3af' : '#4b5563'}; line-height: 1.6; margin: 0;">
          ${escapeHtml(item.description)}
        </p>
      </div>`;
      })
      .join("\n      ");

    return `<section id="features" style="padding-top: ${pt}; padding-bottom: ${pb}; background-color: ${bg}; color: ${color};">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;">
    <!-- Section Header -->
    <div style="text-align: center; max-width: 720px; margin: 0 auto 4rem auto;">
      ${badge ? `
      <span style="display: inline-block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #d3ff4a; background: rgba(211, 255, 74, 0.1); padding: 0.35rem 0.9rem; border-radius: 9999px; margin-bottom: 1rem;">
        ${escapeHtml(badge)}
      </span>` : ''}

      <h2 style="font-size: 2.75rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 1rem; color: ${color}; line-height: 1.15;">
        ${escapeHtml(title)}
      </h2>

      <p style="font-size: 1.05rem; color: ${isDark ? '#9ca3af' : '#4b5563'}; line-height: 1.6; margin: 0;">
        ${escapeHtml(subtitle)}
      </p>
    </div>

    <!-- Bento Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
      ${cardsHtml}
    </div>
  </div>
</section>`;
  },

  // ── CTA ───────────────────────────────────────────────────────
  CTA: (props, styles) => {
    const bg = styles?.backgroundColor || "#3b82f6";
    const color = styles?.textColor || "#ffffff";
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop) || "4rem",
      "padding-bottom": px(styles?.paddingBottom) || "4rem",
      "text-align": "center",
      "background-color": bg,
    };
    return `<div${styleObj(wrapStyle)}>
  <div style="width: 100%; margin: 0 auto; padding: 0 1rem;">
    <h2 style="font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem; color: ${color};">${escapeHtml(props.title || "Ready to Get Started?")}</h2>
    <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; color: ${color};">${escapeHtml(props.description || "Join us today")}</p>
    <a href="${escapeHtml(props.buttonLink || "#")}" class="sp-btn-white">${escapeHtml(props.buttonText || "Get Started")}</a>
  </div>
</div>`;
  },

  // ── Form ──────────────────────────────────────────────────────
  Form: (props, styles) => {
    const s = {
      padding: px(styles?.padding) || "24px",
      "background-color": styles?.backgroundColor,
      "border-radius": px(styles?.borderRadius) || "8px",
    };
    return `<form action="${escapeHtml(props.action || "#")}" method="${props.method || "POST"}"${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${styleObj(s)}>
  <p style="color: #6b7280; font-size: 0.875rem;">Form Container</p>
</form>`;
  },

  // ── Input ─────────────────────────────────────────────────────
  Input: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const req = props.required ? " *" : "";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${req ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const inputStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      "box-sizing": "border-box",
    };
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <input type="${props.type || "text"}"${props.name ? ` name="${escapeHtml(props.name)}"` : ""} placeholder="${escapeHtml(props.placeholder || `Enter ${props.label || "text"}`)}${required !== "" ? `"${required}` : '"'}${styleObj(inputStyle)} />
</div>`;
  },

  // ── Textarea ──────────────────────────────────────────────────
  Textarea: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const taStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      resize: "vertical",
      "box-sizing": "border-box",
    };
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <textarea${props.name ? ` name="${escapeHtml(props.name)}"` : ""} rows="${props.rows || 4}" placeholder="${escapeHtml(props.placeholder || "Enter your message")}"${required}${styleObj(taStyle)}></textarea>
</div>`;
  },

  // ── Select ────────────────────────────────────────────────────
  Select: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const selStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      cursor: "pointer",
      "box-sizing": "border-box",
    };
    const options = (props.options || [])
      .map((o) => {
        const val = o.value || o;
        const label = o.label || o;
        return `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`;
      })
      .join("\n    ");
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <select${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${required}${styleObj(selStyle)}>
    <option value="">${escapeHtml(props.placeholder || "Select an option")}</option>
    ${options}
  </select>
</div>`;
  },

  // ── Label ─────────────────────────────────────────────────────
  Label: (props, styles) => {
    const s = {
      display: "block",
      "font-size": px(styles?.fontSize) || "0.875rem",
      "font-weight": "500",
      "margin-bottom": "0.5rem",
      color: styles?.textColor || "#374151",
    };
    return `<label${props.htmlFor ? ` for="${escapeHtml(props.htmlFor)}"` : ""}${styleObj(s)}>${escapeHtml(props.text || "Label Text")}</label>`;
  },

  // ── Checkbox ──────────────────────────────────────────────────
  Checkbox: (props, styles) => {
    const checked = props.checked ? " checked" : "";
    const required = props.required ? " required" : "";
    const color = styles?.textColor || "#374151";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="margin-left: 0.5rem; font-size: 0.875rem; cursor: pointer; color: ${color};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    return `<div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
  <input type="checkbox"${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${checked}${required} style="width: 1rem; height: 1rem; accent-color: ${styles?.accentColor || "#3b82f6"}; cursor: pointer;" />
  ${labelHtml}
</div>`;
  },

  // ── Radio ─────────────────────────────────────────────────────
  Radio: (props, styles) => {
    const color = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${color};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const radios = (props.options || [])
      .map((o, i) => {
        const val = o.value || o;
        const label = o.label || o;
        return `<div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
    <input type="radio" name="${escapeHtml(props.name || "radio")}" value="${escapeHtml(val)}"${i === 0 ? required : ""} style="width: 1rem; height: 1rem; accent-color: ${styles?.accentColor || "#3b82f6"}; cursor: pointer;" />
    <label style="margin-left: 0.5rem; font-size: 0.875rem; cursor: pointer; color: ${color};">${escapeHtml(label)}</label>
  </div>`;
      })
      .join("\n  ");
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  ${radios}
</div>`;
  },

  // ── FormEmbed ─────────────────────────────────────────────────
  FormEmbed: (props, styles) => {
    // This is a placeholder that will be replaced during async rendering
    // The actual form HTML will be injected by the convertPageToHtml function
    return `<!-- FORM_EMBED:${props.formId || 'NO_FORM_ID'} -->`;
  },

  // ── ProductGrid ───────────────────────────────────────────────
  ProductGrid: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");
    const bg = styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff");
    const currency = props.currency || "₹";
    const products = props.products || [
      { id: "p1", title: "Pro Headphones", price: 2499, comparePrice: 3999, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80", badge: "BESTSELLER" },
      { id: "p2", title: "Mechanical Keyboard", price: 3499, comparePrice: 4999, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80", badge: "TRENDING" },
      { id: "p3", title: "Smart Watch Ultra", price: 1999, comparePrice: 2999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80", badge: "SALE" },
    ];

    const cardsHtml = products.map(p => `
      <div style="background: ${isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}; border-radius: 1.5rem; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 1.25rem;">
        <div style="position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 1rem; overflow: hidden; margin-bottom: 1rem;">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
          ${p.badge ? `<span style="position: absolute; top: 0.75rem; left: 0.75rem; background: #0b1411; color: #d3ff4a; font-size: 10px; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 9999px;">${escapeHtml(p.badge)}</span>` : ''}
        </div>
        <div>
          <h3 style="font-size: 1rem; font-weight: 700; color: ${isDark ? '#ffffff' : '#111827'}; margin-bottom: 0.5rem;">${escapeHtml(p.title)}</h3>
          <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;">
            <span style="font-size: 1.25rem; font-weight: 900; color: ${isDark ? '#d3ff4a' : '#111827'};">${currency}${p.price}</span>
            ${p.comparePrice ? `<span style="font-size: 0.875rem; color: #9ca3af; text-decoration: line-through;">${currency}${p.comparePrice}</span>` : ''}
          </div>
        </div>
        <button onclick="sitepilotAddToCart('${escapeHtml(p.title)}', ${p.price})" style="width: 100%; padding: 0.75rem 1rem; background: #d3ff4a; color: #0b1411; border: none; border-radius: 0.75rem; font-weight: 800; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">
          Add to Cart
        </button>
      </div>
    `).join("");

    return `<section style="padding: 5rem 1.5rem; background-color: ${bg}; color: ${isDark ? '#ffffff' : '#111827'};">
      <div style="max-width: 72rem; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3.5rem;">
          <span style="display: inline-block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #d3ff4a; background: rgba(211, 255, 74, 0.1); padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem;">${escapeHtml(props.badge || "ONLINE STORE")}</span>
          <h2 style="font-size: 2.5rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 0.5rem;">${escapeHtml(props.title || "Featured Store Collection")}</h2>
          <p style="font-size: 1rem; color: #9ca3af; max-width: 36rem; margin: 0 auto;">${escapeHtml(props.subtitle || "Explore our premium hand-crafted products with instant delivery.")}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          ${cardsHtml}
        </div>
      </div>
    </section>`;
  },

  // ── Pricing ───────────────────────────────────────────────────
  Pricing: (props, styles) => {
    const isDark = props.theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");
    const bg = styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff");
    const currency = props.currency || "₹";

    return `<section style="padding: 5rem 1.5rem; background-color: ${bg}; color: ${isDark ? '#ffffff' : '#111827'};">
      <div style="max-width: 72rem; margin: 0 auto; text-align: center;">
        <span style="display: inline-block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #d3ff4a; background: rgba(211, 255, 74, 0.1); padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem;">${escapeHtml(props.badge || "FLEXIBLE PLANS")}</span>
        <h2 style="font-size: 2.5rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 0.5rem;">${escapeHtml(props.title || "Transparent, Predictable Pricing")}</h2>
        <p style="font-size: 1rem; color: #9ca3af; max-width: 36rem; margin: 0 auto 3rem auto;">${escapeHtml(props.subtitle || "Choose the plan that fits your growth.")}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          <div style="background: ${isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}; border-radius: 1.5rem; padding: 2rem; text-align: left;">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Starter Plan</h3>
            <p style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 1.5rem;">Ideal for personal sites and blogs.</p>
            <div style="font-size: 2.5rem; font-weight: 900; margin-bottom: 1.5rem;">${currency}999<span style="font-size: 0.85rem; color: #9ca3af; font-weight: normal;"> / mo</span></div>
            <button onclick="sitepilotAddToCart('Starter Plan Subscription', 999)" style="width: 100%; padding: 0.85rem; background: rgba(255,255,255,0.1); color: #ffffff; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer;">Get Started</button>
          </div>
          <div style="background: #14231e; border: 2px solid #d3ff4a; border-radius: 1.5rem; padding: 2rem; text-align: left; transform: scale(1.03); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            <span style="background: #d3ff4a; color: #0b1411; font-size: 10px; font-weight: 900; padding: 0.25rem 0.6rem; border-radius: 9999px; text-transform: uppercase;">Most Popular</span>
            <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0.75rem 0 0.5rem 0; color: #ffffff;">Pro Creator</h3>
            <p style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 1.5rem;">For serious businesses, agencies, and high-traffic storefronts.</p>
            <div style="font-size: 2.5rem; font-weight: 900; color: #d3ff4a; margin-bottom: 1.5rem;">${currency}2499<span style="font-size: 0.85rem; color: #9ca3af; font-weight: normal;"> / mo</span></div>
            <button onclick="sitepilotAddToCart('Pro Creator Subscription', 2499)" style="width: 100%; padding: 0.85rem; background: #d3ff4a; color: #0b1411; border: none; border-radius: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase;">Unlock Pro Power</button>
          </div>
        </div>
      </div>
    </section>`;
  },

  // ── WhatsAppWidget ───────────────────────────────────────────
  WhatsAppWidget: (props) => {
    const phone = (props.phoneNumber || "919876543210").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(props.message || "Hi, I am visiting your site!");
    return `<a href="https://wa.me/${phone}?text=${msg}" target="_blank" rel="noopener noreferrer" style="position: fixed; bottom: 1.5rem; right: 1.5rem; width: 3.5rem; height: 3.5rem; border-radius: 9999px; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(37,211,102,0.4); z-index: 9999; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
    </a>`;
  },
};

// ============================================================================
// CONTAINER / COLUMN RENDERER
// ============================================================================

function renderComponent(component) {
  if (component.hidden) return "";
  const renderer = componentRenderers[component.type];
  if (!renderer)
    return `<!-- Unknown component: ${escapeHtml(component.type)} -->`;
  return renderer(component.props || {}, component.styles || {});
}

function renderColumn(column, isHorizontal) {
  const widthPercent = isHorizontal ? `${(column.width / 12) * 100}%` : "100%";
  const s = {
    width: widthPercent,
    "min-height": "50px",
    "background-color": column.styles?.backgroundColor,
    "padding-top": px(column.styles?.paddingTop),
    "padding-bottom": px(column.styles?.paddingBottom),
    "padding-left": px(column.styles?.paddingLeft),
    "padding-right": px(column.styles?.paddingRight),
    "box-sizing": "border-box",
  };
  const children = (column.components || [])
    .map(renderComponent)
    .filter(Boolean)
    .join("\n    ");
  return `<div${styleObj(s)}>
    ${children || ""}
  </div>`;
}

function renderContainer(container) {
  if (container.hidden) return "";
  const settings = container.settings || {};
  const styles = container.styles || {};
  const isHorizontal = settings.direction !== "vertical";
  const contentWidth = settings.contentWidth || "boxed";
  const maxWidth = settings.maxWidth || 1280;
  const gap = settings.gap ?? 16;

  const outerStyle = {
    "background-color": styles.backgroundColor,
    color: styles.textColor || "#1f2937",
    "padding-top": px(styles.paddingTop ?? 40),
    "padding-bottom": px(styles.paddingBottom ?? 40),
    "padding-left": px(styles.paddingLeft ?? 0),
    "padding-right": px(styles.paddingRight ?? 0),
    "margin-top": px(styles.marginTop ?? 0),
    "margin-bottom": px(styles.marginBottom ?? 0),
  };

  const innerStyle = {
    "max-width": contentWidth === "boxed" ? `${maxWidth}px` : "none",
    margin: contentWidth === "boxed" ? "0 auto" : undefined,
    padding: contentWidth === "boxed" ? "0 16px" : undefined,
    display: "flex",
    "flex-direction": isHorizontal ? "row" : "column",
    gap: `${gap}px`,
    "align-items": isHorizontal
      ? settings.verticalAlign || "stretch"
      : undefined,
    "box-sizing": "border-box",
  };

  const columns = (container.columns || [])
    .map((col) => renderColumn(col, isHorizontal))
    .join("\n  ");

  return `<section${styleObj(outerStyle)}>
  <div${styleObj(innerStyle)}>
  ${columns}
  </div>
</section>`;
}

// ============================================================================
// CSS
// ============================================================================

function generateCSS(theme) {
  const primary = theme?.primaryColor || "#d3ff4a";
  const fontFamily =
    theme?.fontFamily || "Inter, system-ui, -apple-system, sans-serif";
  const headingFont = theme?.headingFont || fontFamily;

  return `/* SitePilot — Generated Styles */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: ${fontFamily};
  line-height: 1.6;
  color: #ffffff;
  background-color: #0b1411;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 { font-family: ${headingFont}; line-height: 1.2; }

img { max-width: 100%; height: auto; display: block; }

a { transition: color 0.2s, opacity 0.2s; }

/* ── Cart Drawer Styles ──────────────────────────────────────── */
.sp-cart-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
  z-index: 99998; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
}
.sp-cart-overlay.open { opacity: 1; pointer-events: auto; }

.sp-cart-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 420px;
  background: #0f1c18; border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.5); z-index: 99999;
  transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column; color: #ffffff;
}
.sp-cart-drawer.open { transform: translateX(0); }

.sp-cart-header {
  padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex; align-items: center; justify-content: space-between;
}
.sp-cart-items { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.sp-cart-item {
  display: flex; gap: 1rem; align-items: center; background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06); padding: 0.85rem; border-radius: 1rem;
}
.sp-cart-footer {
  padding: 1.25rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}
.sp-checkout-btn {
  width: 100%; padding: 0.9rem; background: #d3ff4a; color: #0b1411; border: none;
  border-radius: 9999px; font-weight: 900; font-size: 0.85rem; text-transform: uppercase;
  letter-spacing: 0.05em; cursor: pointer; transition: transform 0.15s, background-color 0.15s;
}
.sp-checkout-btn:hover { background: #bce63b; transform: scale(1.02); }

/* ── Buttons ──────────────────────────────────────────────────── */

.sp-btn-primary {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: ${primary};
  color: #0b1411;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 800;
  transition: background-color 0.2s, transform 0.1s;
}
.sp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

.sp-btn-secondary {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 700;
  transition: background-color 0.2s;
}
.sp-btn-secondary:hover { background-color: rgba(255, 255, 255, 0.15); }

.sp-btn-outline {
  display: inline-block;
  padding: calc(0.75rem - 2px) 2rem;
  background-color: transparent;
  color: ${primary};
  border: 2px solid ${primary};
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 700;
  transition: background-color 0.2s, color 0.2s;
}
.sp-btn-outline:hover { background-color: ${primary}; color: #0b1411; }

.sp-btn-white {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: #d3ff4a;
  color: #0b1411;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 800;
  transition: background-color 0.2s;
}
.sp-btn-white:hover { background-color: #bce63b; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  section > div { flex-direction: column !important; }
  section > div > div { width: 100% !important; }
}
`;
}

// ============================================================================
// JS  (Interactive Cart Drawer & Smooth Scroll)
// ============================================================================

function generateJS() {
  return `/* SitePilot — Generated JS */
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var href = this.getAttribute('href');
      if (href && href !== '#') {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Inject Cart Drawer into DOM if not present
  if (!document.getElementById('sp-cart-drawer')) {
    var overlay = document.createElement('div');
    overlay.id = 'sp-cart-drawer-overlay';
    overlay.className = 'sp-cart-overlay';
    overlay.onclick = window.sitepilotToggleCart;

    var drawer = document.createElement('div');
    drawer.id = 'sp-cart-drawer';
    drawer.className = 'sp-cart-drawer';
    drawer.innerHTML = [
      '<div class="sp-cart-header">',
        '<div style="display:flex;align-items:center;gap:0.5rem;">',
          '<span style="font-weight:900;font-size:1.1rem;">Shopping Cart</span>',
          '<span id="sp-drawer-count-badge" style="background:rgba(211,255,74,0.15);color:#d3ff4a;font-size:11px;font-weight:800;padding:0.2rem 0.5rem;border-radius:9999px;">0 items</span>',
        '</div>',
        '<button onclick="window.sitepilotToggleCart()" style="background:none;border:none;color:#9ca3af;font-size:1.5rem;cursor:pointer;line-height:1;">&times;</button>',
      '</div>',
      '<div id="sp-cart-items-container" class="sp-cart-items">',
        '<div style="text-align:center;padding:3rem 1rem;color:#9ca3af;">',
          '<p style="font-size:1rem;margin-bottom:0.5rem;">Your cart is empty</p>',
          '<p style="font-size:0.8rem;opacity:0.7;">Browse products and add them to get started.</p>',
        '</div>',
      '</div>',
      '<div class="sp-cart-footer">',
        '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:0.9rem;color:#9ca3af;">',
          '<span>Subtotal</span>',
          '<span id="sp-cart-subtotal" style="font-weight:700;color:#ffffff;">₹0</span>',
        '</div>',
        '<div style="display:flex;justify-content:space-between;margin-bottom:1.25rem;font-size:1.15rem;font-weight:900;">',
          '<span>Total</span>',
          '<span id="sp-cart-total" style="color:#d3ff4a;">₹0</span>',
        '</div>',
        '<button id="sp-checkout-button" onclick="window.sitepilotCheckout()" class="sp-checkout-btn">',
          'Checkout with Razorpay &rarr;',
        '</button>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  window.sitepilotRenderCart();
});

// Cart State Management
window.sitepilotCart = [];

window.sitepilotToggleCart = function() {
  var overlay = document.getElementById('sp-cart-drawer-overlay');
  var drawer = document.getElementById('sp-cart-drawer');
  if (drawer && overlay) {
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
  }
};

window.sitepilotAddToCart = function(title, price, image) {
  var existing = window.sitepilotCart.find(function(item) { return item.title === title; });
  if (existing) {
    existing.quantity += 1;
  } else {
    window.sitepilotCart.push({
      title: title,
      price: price || 999,
      image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80',
      quantity: 1
    });
  }
  window.sitepilotRenderCart();
  // Open cart drawer
  var drawer = document.getElementById('sp-cart-drawer');
  var overlay = document.getElementById('sp-cart-drawer-overlay');
  if (drawer && overlay && !drawer.classList.contains('open')) {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }
};

window.sitepilotUpdateQuantity = function(index, delta) {
  if (window.sitepilotCart[index]) {
    window.sitepilotCart[index].quantity += delta;
    if (window.sitepilotCart[index].quantity <= 0) {
      window.sitepilotCart.splice(index, 1);
    }
  }
  window.sitepilotRenderCart();
};

window.sitepilotRenderCart = function() {
  var totalCount = window.sitepilotCart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
  var totalPrice = window.sitepilotCart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);

  // Update Nav Badge
  var navBadge = document.getElementById('sp-cart-count');
  if (navBadge) {
    navBadge.innerText = totalCount;
    navBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';
  }

  // Update Drawer Badges & Totals
  var drawerBadge = document.getElementById('sp-drawer-count-badge');
  if (drawerBadge) drawerBadge.innerText = totalCount + ' items';

  var subtotalEl = document.getElementById('sp-cart-subtotal');
  if (subtotalEl) subtotalEl.innerText = '₹' + totalPrice;

  var totalEl = document.getElementById('sp-cart-total');
  if (totalEl) totalEl.innerText = '₹' + totalPrice;

  var container = document.getElementById('sp-cart-items-container');
  if (container) {
    if (window.sitepilotCart.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:#9ca3af;"><p style="font-size:1rem;margin-bottom:0.5rem;">Your cart is empty</p><p style="font-size:0.8rem;opacity:0.7;">Browse products and add them to get started.</p></div>';
    } else {
      container.innerHTML = window.sitepilotCart.map(function(item, idx) {
        return '<div class="sp-cart-item">' +
          '<img src="' + item.image + '" style="width:50px;height:50px;border-radius:0.5rem;object-fit:cover;" />' +
          '<div style="flex:1;">' +
            '<div style="font-size:0.9rem;font-weight:700;margin-bottom:0.25rem;">' + item.title + '</div>' +
            '<div style="font-size:0.85rem;color:#d3ff4a;font-weight:800;">₹' + item.price + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.06);border-radius:9999px;padding:0.2rem 0.5rem;">' +
            '<button onclick="window.sitepilotUpdateQuantity(' + idx + ', -1)" style="background:none;border:none;color:#ffffff;cursor:pointer;font-weight:bold;padding:0 0.25rem;">-</button>' +
            '<span style="font-size:0.8rem;font-weight:800;">' + item.quantity + '</span>' +
            '<button onclick="window.sitepilotUpdateQuantity(' + idx + ', 1)" style="background:none;border:none;color:#ffffff;cursor:pointer;font-weight:bold;padding:0 0.25rem;">+</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }
};

window.sitepilotCheckout = function() {
  var total = window.sitepilotCart.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0);
  if (total <= 0) {
    alert('Your cart is empty. Please add items to proceed.');
    return;
  }

  var btn = document.getElementById('sp-checkout-button');
  if (btn) btn.innerText = 'Connecting to Razorpay...';

  function launchRazorpay() {
    fetch('/api/checkout/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        currency: 'INR',
        items: window.sitepilotCart
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (btn) btn.innerText = 'Checkout with Razorpay →';
      if (!data.success) {
        alert(data.error || 'Failed to initialize payment gateway.');
        return;
      }

      if (window.Razorpay) {
        var options = {
          key: data.keyId || 'rzp_test_sitepilot_demo',
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'SitePilot Checkout',
          description: 'Payment for ' + window.sitepilotCart.length + ' item(s)',
          order_id: data.orderId,
          handler: function(response) {
            alert('🎉 Payment Successful!\\nPayment ID: ' + response.razorpay_payment_id + '\\nThank you for your order.');
            window.sitepilotCart = [];
            window.sitepilotRenderCart();
            window.sitepilotToggleCart();
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com'
          },
          theme: { color: '#0b1411' }
        };
        var rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert('🎉 Simulated Payment Successful!\\nOrder Total: ₹' + total + '\\nYour order has been recorded.');
        window.sitepilotCart = [];
        window.sitepilotRenderCart();
        window.sitepilotToggleCart();
      }
    })
    .catch(function(err) {
      if (btn) btn.innerText = 'Checkout with Razorpay →';
      alert('Checkout error: ' + err.message);
    });
  }

  if (!window.Razorpay) {
    var script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = launchRazorpay;
    script.onerror = launchRazorpay;
    document.head.appendChild(script);
  } else {
    launchRazorpay();
  }
};
`;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Convert a layout JSON object into { html, css, js } strings.
 *
 * @param {object} layoutJSON – The full layout JSON from the builder store
 * @param {string} [pageId]   – Optional page ID (defaults to first page)
 * @returns {{ html: string, css: string, js: string }}
 */
/**
 * Convert a single Page record (from the DB) into { html, css, js } strings.
 * Use this for the per-page storage architecture.
 *
 * @param {object} theme    – Site.theme from the DB (primaryColor, fontFamily, …)
 * @param {object} page     – Page record from the DB (name, slug, seo, layout)
 * @param {string} siteName – Human-readable site name used as fallback <title>
 * @param {object} [opts]   – { stylesHref, scriptSrc } for asset path control
 * @returns {Promise<{ html: string, css: string, js: string }>}
 */
export async function convertPageToHtml(
  theme,
  page,
  siteName = "SitePilot Site",
  opts = {},
) {
  if (!page) throw new Error("Page is required");

  const { stylesHref = "styles.css", scriptSrc = "script.js" } = opts;
  const seo = page.seo || {};

  // layout is stored as the raw containers array in the DB
  let bodyContent = (page.layout || [])
    .map(renderContainer)
    .filter(Boolean)
    .join("\n\n");

  // Collect all form IDs from FormEmbed components
  const formIds = [];
  const formPlaceholderRegex = /<!-- FORM_EMBED:([a-zA-Z0-9-]+) -->/g;
  let match;
  while ((match = formPlaceholderRegex.exec(bodyContent)) !== null) {
    const formId = match[1];
    if (formId !== 'NO_FORM_ID') {
      formIds.push(formId);
    }
  }

  // Fetch all forms and generate their HTML/CSS/JS
  const formData = {};
  let additionalCSS = '';
  let additionalJS = '';

  if (formIds.length > 0) {
    const forms = await prisma.form.findMany({
      where: {
        id: { in: formIds },
      },
    });

    for (const form of forms) {
      const formHTML = generateFormHTML({
        id: form.id,
        schema: form.schema,
        settings: form.settings,
        styling: form.styling || {},
      });

      const formCSS = generateFormCSS({
        id: form.id,
        styling: form.styling || {},
      });

      // Pass the API base URL (use NEXT_PUBLIC_API_URL for form submissions)
      // This allows using ngrok for published sites while keeping localhost for dev
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const formJS = generateFormJS({
        id: form.id,
      }, apiBaseUrl);

      formData[form.id] = formHTML;
      additionalCSS += '\n' + formCSS;
      additionalJS += '\n' + formJS;

      // Replace placeholder with actual form HTML
      bodyContent = bodyContent.replace(
        `<!-- FORM_EMBED:${form.id} -->`,
        formHTML
      );
    }
  }

  // Remove any remaining placeholders (forms not found)
  bodyContent = bodyContent.replace(
    /<!-- FORM_EMBED:[a-zA-Z0-9-]+ -->/g,
    '<div style="padding: 2rem; text-align: center; background-color: #fee; border: 2px dashed #f00; border-radius: 0.5rem;"><p style="color: #c00;">Form not found or not published</p></div>'
  );

  const css = generateCSS(theme || {}) + additionalCSS;
  const js = generateJS() + additionalJS;

  // Resolve the app base URL — this is where tracker.js is served from
  const appBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.sitepilot.devally.in';
  const trackerTag = buildTrackerTag(page.siteId, page.slug, appBaseUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seo.title || page.name || siteName)}</title>
  <meta name="description" content="${escapeHtml(seo.description || "")}" />
  ${seo.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${stylesHref}" />
  ${trackerTag}
</head>
<body>
${bodyContent}
  <script src="${scriptSrc}"><\/script>
</body>
</html>`;

  return { html, css, js };
}

/**
 * Convert a layout JSON object into { html, css, js } strings.
 *
 * @param {object} layoutJSON – The full layout JSON from the builder store
 * @param {string} [pageId]   – Optional page ID (defaults to first page)
 * @returns {{ html: string, css: string, js: string }}
 */
export function convertJsonToHtml(layoutJSON, pageId) {
  const page = pageId
    ? layoutJSON.pages.find((p) => p.id === pageId)
    : layoutJSON.pages?.[0];

  if (!page) throw new Error("Page not found");

  const theme = layoutJSON.theme || {};
  const seo = page.seo || {};
  const siteName = layoutJSON.site?.name || "SitePilot Site";

  // Render all containers
  const bodyContent = (page.layout || [])
    .map(renderContainer)
    .filter(Boolean)
    .join("\n\n");

  const css = generateCSS(theme);
  const js = generateJS();

  const appBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.sitepilot.devally.in';
  const pageSiteId = page.siteId || layoutJSON.site?.id || '';
  const trackerTag = buildTrackerTag(pageSiteId, page.slug || '/', appBaseUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seo.title || siteName)}</title>
  <meta name="description" content="${escapeHtml(seo.description || "")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  ${trackerTag}
</head>
<body>
${bodyContent}
  <script src="script.js"><\/script>
</body>
</html>`;

  return { html, css, js };
}
