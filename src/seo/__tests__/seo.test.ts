import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanSchema, buildJsonLd } from "../utils/schemaBuilder";
import { isValidAbsoluteUrl, toAbsoluteUrl } from "../utils/validators";
import { buildMetaTags } from "../utils/metaBuilder";
import {
  clearSeoElements,
  updateTitle,
  updateCanonical,
  updateMetaTags,
  updateStructuredData,
} from "../utils/headManager";

describe("SEO - schemaBuilder.ts", () => {
  it("should clean empty fields recursively", () => {
    const dirty = {
      name: "Product A",
      description: "",
      sku: undefined,
      gtin: null,
      images: [],
      brand: {
        name: "Brand X",
        logo: "",
        sameAs: [],
      },
      offers: {
        price: 15,
        currency: "MAD",
        emptyObj: {},
      },
    };

    const clean = cleanSchema(dirty);
    expect(clean).toEqual({
      name: "Product A",
      brand: {
        name: "Brand X",
      },
      offers: {
        price: 15,
        currency: "MAD",
      },
    });
  });

  it("should return empty object if all fields are empty", () => {
    const dirty = { name: "", list: [], nested: { key: undefined } };
    const res = buildJsonLd("Product", dirty);
    expect(res).toEqual({});
  });
});

describe("SEO - validators.ts", () => {
  it("should identify absolute URLs", () => {
    expect(isValidAbsoluteUrl("https://aliaacare.com")).toBe(true);
    expect(isValidAbsoluteUrl("http://localhost:8080/path")).toBe(true);
    expect(isValidAbsoluteUrl("/relative-path")).toBe(false);
    expect(isValidAbsoluteUrl("aliaacare.com/path")).toBe(false);
  });

  it("should normalize relative paths to absolute URLs", () => {
    expect(toAbsoluteUrl("https://aliaacare.com", "/product/a")).toBe("https://aliaacare.com/product/a");
    expect(toAbsoluteUrl("https://aliaacare.com/", "product/a")).toBe("https://aliaacare.com/product/a");
  });
});

describe("SEO - headManager.ts (JSDOM environment)", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  afterEach(() => {
    clearSeoElements();
  });

  it("should update document title", () => {
    updateTitle("New Title");
    expect(document.title).toBe("New Title");
  });

  it("should update and remove canonical link", () => {
    updateCanonical("https://aliaacare.com/product/a");
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe("https://aliaacare.com/product/a");

    // Update to different URL
    updateCanonical("https://aliaacare.com/product/b");
    link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link.href).toBe("https://aliaacare.com/product/b");

    // Remove
    updateCanonical(null);
    link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link).toBeNull();
  });

  it("should update meta tags and avoid duplicates", () => {
    const tags = [
      { name: "description", content: "Test Desc" },
      { property: "og:type", content: "website" },
    ];

    updateMetaTags(tags);
    let metas = document.querySelectorAll("meta[data-seo]");
    expect(metas.length).toBe(2);
    expect(metas[0].getAttribute("content")).toBe("Test Desc");

    // Update with new list should replace old tags
    updateMetaTags([{ property: "og:type", content: "product" }]);
    metas = document.querySelectorAll("meta[data-seo]");
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute("property")).toBe("og:type");
    expect(metas[0].getAttribute("content")).toBe("product");
  });

  it("should update structured data scripts", () => {
    const schemas = [
      { "@context": "https://schema.org", "@type": "Product", name: "Prod A" },
    ];

    updateStructuredData(schemas);
    let scripts = document.querySelectorAll('script[type="application/ld+json"][data-seo]');
    expect(scripts.length).toBe(1);
    expect(scripts[0].textContent).toContain("Prod A");

    // Wipe out
    updateStructuredData([]);
    scripts = document.querySelectorAll('script[type="application/ld+json"][data-seo]');
    expect(scripts.length).toBe(0);
  });
});
