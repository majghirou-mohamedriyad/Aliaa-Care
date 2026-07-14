import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { useClientProducts } from "@/hooks/useClientProducts";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import chayNifasImg from "@/assets/chay-nifas.jpeg";
import { getTranslated } from "@/utils/translationUtils";
import { SEOManager } from "@/seo/components/SEOManager";

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, collections, getCollectionBySlug } = useClientProducts();
  const { t, lang } = useT();
  const activeCollection = searchParams.get("collection") || "all";
  const activeSort = (searchParams.get("sort") as SortOption) || "featured";

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "featured", label: t("products.sortFeatured") },
    { value: "newest", label: t("products.sortNewest") },
    { value: "price-asc", label: t("products.sortPriceAsc") },
    { value: "price-desc", label: t("products.sortPriceDesc") },
    { value: "name-asc", label: t("products.sortAlpha") },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (activeCollection !== "all") {
      const collection = collections.find((c) => c.slug === activeCollection);
      if (collection) result = result.filter((product) => product.collection === collection.id);
    }
    switch (activeSort) {
      case "newest":
        result = [...result.filter((p) => p.new), ...result.filter((p) => !p.new)];
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result = [...result.filter((p) => p.featured), ...result.filter((p) => !p.featured)];
        break;
    }
    return result;
  }, [activeCollection, activeSort, products, collections]);

  const currentCollection = activeCollection !== "all" ? getCollectionBySlug(activeCollection) : null;

  const handleFilterChange = (slug: string) => {
    const p = new URLSearchParams(searchParams);
    if (slug === "all") {
      p.delete("collection");
    } else {
      p.set("collection", slug);
    }
    setSearchParams(p);
  };

  const handleSortChange = (value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value === "featured") {
      p.delete("sort");
    } else {
      p.set("sort", value);
    }
    setSearchParams(p);
  };

  const pageTitle = currentCollection ? getTranslated(currentCollection, "name", lang) : t("common.products");
  const pageDesc = currentCollection ? getTranslated(currentCollection, "description", lang) : "Découvrez nos soins et infusions naturels.";

  return (
    <>
      <SEOManager
        type="collection"
        title={pageTitle}
        description={pageDesc}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: pageTitle, item: "/products" },
        ]}
        collectionData={
          currentCollection
            ? {
              name: getTranslated(currentCollection, "name", lang),
              description: getTranslated(currentCollection, "description", lang),
            }
            : undefined
        }
        itemListData={{
          name: pageTitle,
          items: filteredAndSortedProducts.map((p) => ({
            name: p.name,
            url: `/product/${p.slug}`,
            image: p.images?.[0],
            price: p.price,
          })),
        }}
      />
      <section className="relative h-[40vh] md:h-[55vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={currentCollection?.heroImage || chayNifasImg} alt={getTranslated(currentCollection as any, "name", lang) || t("common.products")}
            className="w-full h-full object-cover transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-charcoal/10" />
        </div>
        <div className="relative container-full h-full flex flex-col justify-end pb-12 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-3">
              {currentCollection ? t("common.collection") : t("common.shop")}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-3 leading-[0.95]">
              {currentCollection ? getTranslated(currentCollection, "name", lang) : t("common.products")}
            </h1>
            {currentCollection && <p className="text-base text-white/70 max-w-lg">{getTranslated(currentCollection, "description", lang)}</p>}
          </motion.div>
        </div>
      </section>

      <section className="py-5 border-b border-border sticky top-16 md:top-20 bg-background z-40">
        <div className="container-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mb-2 md:mb-0 scrollbar-hide">
              <Button variant="ghost" size="sm" onClick={() => handleFilterChange("all")}
                className={cn("rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase transition-all duration-300",
                  activeCollection === "all" ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "hover:bg-accent")}>
                {t("common.all")}
              </Button>
              {collections.map((collection) => (
                <Button key={collection.id} variant="ghost" size="sm" onClick={() => handleFilterChange(collection.slug)}
                  className={cn("rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase transition-all duration-300",
                    activeCollection === collection.slug ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "hover:bg-accent")}>
                  {getTranslated(collection, "name", lang)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tracking-[0.1em] uppercase">{t("products.sortBy")}</span>
              <Select value={activeSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] rounded-none text-xs tracking-[0.05em] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container-full">
          {filteredAndSortedProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? t("products.product") : t("products.productPlural")}
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
                {filteredAndSortedProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
              </div>
            </>
          ) : (
            <div className="text-center py-28">
              <p className="font-serif text-2xl text-muted-foreground mb-4">{t("products.noProducts")}</p>
              <p className="text-muted-foreground mb-8">{t("products.collectionPrep")}</p>
              <Button asChild variant="outline" className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
                <Link to="/products">{t("index.viewAllProducts")}</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 md:py-32 bg-accent/30 border-t border-border">
        <div className="container-full">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="inline-block text-[11px] font-medium tracking-[0.2em] uppercase text-primary/60 mb-6">
                {t("products.needAdvice")}
              </span>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary mb-10 leading-[1.1]">
                {t("products.hereForYou")}
              </h2>
              <Button asChild size="lg" className="rounded-none px-12 py-7 text-sm tracking-[0.15em] uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <a href="mailto:Aliaacare.ac@gmail.com">
                  {t("common.contactUs")}
                  <ArrowRight className="ltr:ml-4 rtl:mr-4 w-4 h-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;

