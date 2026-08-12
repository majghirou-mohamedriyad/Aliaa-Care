import { motion } from "framer-motion";
import { Gift } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePacks } from "@/hooks/usePacks";
import { PackCard } from "@/components/PackCard";
import { useT } from "@/hooks/useT";
import { SEOManager } from "@/seo/components/SEOManager";

const Packs = () => {
  const { data: allPacks = [], isLoading } = usePacks();
  const { t } = useT();
  const activePacks = allPacks.filter((p) => p.active);

  const pageTitle = t("common.ourPacks") || "Nos Packs";
  const pageDesc = t("index.featuredDesc") || "Découvrez nos coffrets et packs bien-être naturels.";

  return (
    <>
      <SEOManager
        type="collection"
        title={pageTitle}
        description={pageDesc}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: pageTitle, item: "/packs" },
        ]}
        itemListData={{
          name: pageTitle,
          items: activePacks.map((p) => ({
            name: p.name,
            url: `/pack/${p.slug}`,
            image: p.image,
            price: p.price,
          })),
        }}
      />
      <section className="py-16 md:py-24">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
              {t("index.specialOffers")}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              {t("common.ourPacks")}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("index.featuredDesc")}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-[4/5] bg-muted rounded-lg" />
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (!activePacks || activePacks.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center w-full">
              <Gift className="w-16 h-16 text-muted-foreground/20 mb-6" />
              <h2 className="font-serif text-3xl text-muted-foreground">
                {t("packs.noPacks") || "Aucun pack"}
              </h2>
            </div>
          ) : (
            <div className={cn(
              "grid gap-8 md:gap-10",
              activePacks.length === 1 ? "grid-cols-1 max-w-xl mx-auto" :
              activePacks.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto" :
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}>
              {activePacks.map((pack, index) => (
                <PackCard key={pack.id} pack={pack} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Packs;

