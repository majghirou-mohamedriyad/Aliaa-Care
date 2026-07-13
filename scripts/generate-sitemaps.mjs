import fs from "fs";
import path from "path";
import ts from "typescript";

// Target Domain
const DOMAIN = "https://aliaacare.com";

// Excluded routes
const EXCLUDED_PATHS = new Set([
  "/admin",
  "/auth/login",
  "/login",
  "/register",
  "/dashboard",
  "/account",
  "/checkout",
  "/cart",
  "/payment",
  "/404",
  "/wishlist"
]);

// Helper to format ISO Date without milliseconds/timezone offsets if possible, or standard ISO
function getISODate(dateInput) {
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
}

async function main() {
  console.log("--------------------------------------------------");
  console.log("🚀 Starting XML Sitemap Generator...");
  console.log("--------------------------------------------------");

  // 1. Read Supabase config from .env
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    try {
      const envContent = fs.readFileSync(".env", "utf-8");
      envContent.split("\n").forEach((line) => {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
          if (key === "VITE_SUPABASE_URL") supabaseUrl = value;
          if (key === "VITE_SUPABASE_PUBLISHABLE_KEY") supabaseKey = value;
        }
      });
    } catch (e) {
      console.warn("⚠️ Could not read .env file, relying on process.env");
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not defined.");
    process.exit(1);
  }

  // 2. Parse src/App.tsx using TypeScript AST
  const appFile = "src/App.tsx";
  if (!fs.existsSync(appFile)) {
    console.error(`❌ Error: App file not found at ${appFile}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing AST of ${appFile}...`);
  const sourceCode = fs.readFileSync(appFile, "utf-8");
  const sourceFile = ts.createSourceFile(appFile, sourceCode, ts.ScriptTarget.Latest, true);

  const componentFiles = {}; // name -> import path
  const resolvedRoutes = [];

  function walkAST(node) {
    // Look for imports
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const specifier = node.moduleSpecifier.text;
      if (node.importClause) {
        if (node.importClause.name) {
          componentFiles[node.importClause.name.text] = specifier;
        }
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach((el) => {
            componentFiles[el.name.text] = specifier;
          });
        }
      }
    }

    // Look for lazy imports: const X = lazy(() => import("..."))
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const name = node.name.getText();
      const initText = node.initializer.getText();
      if (initText.includes("lazy") && initText.includes("import")) {
        const match = initText.match(/import\(['"](.+)['"]\)/);
        if (match) {
          componentFiles[name] = match[1];
        }
      }
    }

    ts.forEachChild(node, walkAST);
  }

  walkAST(sourceFile);

  // Traverse JSX Routes recursively to handle routing nesting
  function traverseRoutes(node, parentPath = "") {
    let currentPath = parentPath;
    let isRoute = false;
    let routePathAttr = null;
    let isIndex = false;
    let elementComponent = null;

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const openingNode = ts.isJsxElement(node) ? node.openingElement : node;
      if (openingNode.tagName.getText() === "Route") {
        isRoute = true;
        openingNode.attributes.properties.forEach((attr) => {
          if (ts.isJsxAttribute(attr)) {
            const attrName = attr.name.getText();
            if (attrName === "path") {
              if (attr.initializer && ts.isStringLiteral(attr.initializer)) {
                routePathAttr = attr.initializer.text;
              }
            } else if (attrName === "index") {
              isIndex = true;
            } else if (attrName === "element") {
              const elText = attr.initializer.getText();
              const match = elText.match(/<([A-Z][A-Za-z0-9_]*)/);
              if (match) {
                elementComponent = match[1];
              }
            }
          }
        });

        if (isIndex) {
          // Index route is the parent path
        } else if (routePathAttr !== null) {
          if (routePathAttr.startsWith("/")) {
            currentPath = routePathAttr;
          } else {
            currentPath = parentPath.endsWith("/")
              ? parentPath + routePathAttr
              : parentPath + "/" + routePathAttr;
          }
        }

        currentPath = currentPath.replace(/\/+/g, "/");
        if (currentPath.endsWith("/") && currentPath.length > 1) {
          currentPath = currentPath.slice(0, -1);
        }

        if (elementComponent) {
          resolvedRoutes.push({
            routePath: currentPath,
            component: elementComponent,
            isIndex
          });
        }
      }
    }

    if (ts.isJsxElement(node)) {
      node.children.forEach((child) => {
        traverseRoutes(child, currentPath);
      });
    } else {
      ts.forEachChild(node, (child) => {
        traverseRoutes(child, currentPath);
      });
    }
  }

  traverseRoutes(sourceFile);

  console.log(`✅ Extracted ${resolvedRoutes.length} raw routes from App.tsx`);

  // 3. Resolve file modification dates for static pages
  const staticUrls = [];
  const buildDate = getISODate(new Date());

  for (const route of resolvedRoutes) {
    const p = route.routePath;

    // Filter out excluded routes, dynamic placeholders, and admins
    if (EXCLUDED_PATHS.has(p) || p.startsWith("/admin") || p.includes(":")) {
      continue;
    }

    // Resolve component file modified time
    let lastmod = buildDate;
    const importPath = componentFiles[route.component];
    if (importPath) {
      let resolved = importPath;
      if (importPath.startsWith("@/")) {
        resolved = importPath.replace("@/", "./");
      }
      const fullPathNoExt = path.join("src", resolved);
      let fileFound = null;
      for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
        const fullPath = fullPathNoExt + ext;
        if (fs.existsSync(fullPath)) {
          fileFound = fullPath;
          break;
        }
      }

      if (fileFound) {
        const stats = fs.statSync(fileFound);
        lastmod = getISODate(stats.mtime);
      }
    }

    staticUrls.push({
      loc: `${DOMAIN}${p}`,
      lastmod
    });
  }

  // Add the base landing page if not present
  if (!staticUrls.some((u) => u.loc === `${DOMAIN}/`)) {
    staticUrls.push({ loc: `${DOMAIN}/`, lastmod: buildDate });
  }

  // Deduplicate and sort static pages
  const uniqueStaticUrls = Array.from(new Map(staticUrls.map((item) => [item.loc, item])).values())
    .sort((a, b) => a.loc.localeCompare(b.loc));

  // 4. Fetch dynamic data from Supabase REST API
  console.log("🌐 Fetching products and packs from Supabase...");
  let activeProducts = [];
  let activePacks = [];

  try {
    const prodRes = await fetch(`${supabaseUrl}/rest/v1/products?select=slug,updated_at,active,visible,name,product_images(image_url)`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    if (!prodRes.ok) throw new Error(`HTTP error ${prodRes.status}`);
    const products = await prodRes.json();
    if (Array.isArray(products)) {
      activeProducts = products.filter((p) => p.active && p.visible);
    }
  } catch (e) {
    console.error("⚠️ Failed to fetch products from Supabase REST:", e.message);
  }

  try {
    const packRes = await fetch(`${supabaseUrl}/rest/v1/packs?select=slug,created_at,active,name,image,pack_images(image_url)`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    if (!packRes.ok) throw new Error(`HTTP error ${packRes.status}`);
    const packs = await packRes.json();
    if (Array.isArray(packs)) {
      activePacks = packs.filter((p) => p.active);
    }
  } catch (e) {
    console.error("⚠️ Failed to fetch packs from Supabase REST:", e.message);
  }

  // 5. Generate specialized URLs lists
  const productUrls = [];
  const imageUrls = [];

  // Populate products URLs and image sitemap entries
  activeProducts.forEach((p) => {
    const url = `${DOMAIN}/product/${p.slug}`;
    const lastmod = getISODate(p.updated_at);
    productUrls.push({ loc: url, lastmod });

    const images = [];
    if (p.product_images && Array.isArray(p.product_images)) {
      p.product_images.forEach((img) => {
        if (img.image_url) {
          images.push(img.image_url);
        }
      });
    }

    if (images.length > 0) {
      imageUrls.push({
        loc: url,
        images: images.map((img) => ({
          loc: img.startsWith("http") ? img : `${DOMAIN}${img}`,
          title: p.name
        }))
      });
    }
  });

  // Populate packs URLs and image sitemap entries
  activePacks.forEach((pack) => {
    const url = `${DOMAIN}/pack/${pack.slug}`;
    const lastmod = getISODate(pack.created_at);
    productUrls.push({ loc: url, lastmod });

    const images = [];
    if (pack.image) images.push(pack.image);
    if (pack.pack_images && Array.isArray(pack.pack_images)) {
      pack.pack_images.forEach((img) => {
        if (img.image_url && !images.includes(img.image_url)) {
          images.push(img.image_url);
        }
      });
    }

    if (images.length > 0) {
      imageUrls.push({
        loc: url,
        images: images.map((img) => ({
          loc: img.startsWith("http") ? img : `${DOMAIN}${img}`,
          title: pack.name
        }))
      });
    }
  });

  // Deduplicate and sort product urls
  const uniqueProductUrls = Array.from(new Map(productUrls.map((item) => [item.loc, item])).values())
    .sort((a, b) => a.loc.localeCompare(b.loc));

  // Deduplicate and sort image entries
  const uniqueImageUrls = Array.from(new Map(imageUrls.map((item) => [item.loc, item])).values())
    .sort((a, b) => a.loc.localeCompare(b.loc));

  // 6. Write XML Helper
  function writeSitemapFile(fileName, urls, isImageSitemap = false) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    if (isImageSitemap) {
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    } else {
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    }

    urls.forEach((u) => {
      xml += `  <url>\n`;
      xml += `    <loc>${u.loc}</loc>\n`;
      if (isImageSitemap) {
        u.images.forEach((img) => {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${escapeXml(img.loc)}</image:loc>\n`;
          if (img.title) {
            xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
          }
          xml += `    </image:image>\n`;
        });
      } else {
        xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
      }
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    // Ensure output directories exist
    const distPath = path.join("dist", fileName);
    const publicPath = path.join("public", fileName);

    fs.mkdirSync("dist", { recursive: true });
    fs.writeFileSync(distPath, xml, "utf-8");
    fs.writeFileSync(publicPath, xml, "utf-8"); // also update public/ for local dev or backup
    console.log(`💾 Generated ${fileName} (in dist/ and public/)`);
  }

  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
      }
    });
  }

  // 7. Write Specialized Sitemaps
  writeSitemapFile("sitemap-pages.xml", uniqueStaticUrls);
  writeSitemapFile("sitemap-products.xml", uniqueProductUrls);
  writeSitemapFile("sitemap-images.xml", uniqueImageUrls, true);

  // 8. Generate Sitemap Index
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  const sitemaps = ["sitemap-pages.xml", "sitemap-products.xml", "sitemap-images.xml"];
  sitemaps.forEach((s) => {
    indexXml += `  <sitemap>\n`;
    indexXml += `    <loc>${DOMAIN}/${s}</loc>\n`;
    indexXml += `    <lastmod>${buildDate}</lastmod>\n`;
    indexXml += `  </sitemap>\n`;
  });
  indexXml += `</sitemapindex>\n`;

  fs.writeFileSync(path.join("dist", "sitemap.xml"), indexXml, "utf-8");
  fs.writeFileSync(path.join("public", "sitemap.xml"), indexXml, "utf-8");
  console.log(`💾 Generated sitemap.xml index`);

  // Count total categories (using unique active collections/packs if available, let's estimate from static pages)
  const imageCount = uniqueImageUrls.reduce((sum, item) => sum + item.images.length, 0);

  console.log("\n--------------------------------------------------");
  console.log("📊 Sitemap Generation Report:");
  console.log(`- Public Static Pages: ${uniqueStaticUrls.length}`);
  console.log(`- Active Products: ${activeProducts.length}`);
  console.log(`- Active Packs: ${activePacks.length}`);
  console.log(`- Total URLs in sitemap-products.xml: ${uniqueProductUrls.length}`);
  console.log(`- Total Images in sitemap-images.xml: ${imageCount}`);
  console.log("--------------------------------------------------\n");
}

main().catch((err) => {
  console.error("❌ Generation failed:", err);
  process.exit(1);
});
