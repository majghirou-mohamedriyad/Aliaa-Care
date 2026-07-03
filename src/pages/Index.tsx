import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown, Instagram, Leaf, Heart, Sparkles } from "lucide-react";
import { useRef } from "react";

import { ProductCard } from "@/components/ProductCard";
import { CollectionCard } from "@/components/CollectionCard";
import { useClientProducts } from "@/hooks/useClientProducts";
import { usePacks } from "@/hooks/usePacks";
import { PackCard } from "@/components/PackCard";
import { PromoBanner } from "@/components/PromoBanner";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import coffretImg from "@/assets/coffret-aliaa.webp";
import coffretImgMobile from "@/assets/coffret-aliaa-phone.webp";
import gommageCorpsImg from "@/assets/gommage-corps.jpeg";
import eauDeRoseImg from "@/assets/eau-de-rose.jpeg";
import { getTranslated } from "@/utils/translationUtils";

const Index = () => {
  const { products, collections, banner } = useClientProducts();
  const { data: allPacks = [] } = usePacks();
  const { t, lang } = useT();
  const activePacks = allPacks.filter((p) => p.active);
  const latestProducts = products.slice(0, 4);
  const displayedCollections = collections.slice(0, 4);
  const featuredCollection = collections.find(c => c.id === "coffrets") || collections[0] || null;
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
  const allProductImages = products.flatMap(p => p.images);
  const randomizedImages = [...allProductImages].sort(() => Math.random() - 0.5);
  const displayImages = randomizedImages.length > 0 ? randomizedImages : [];
  const finalImages = displayImages.length > 0 ? displayImages : [coffretImg, gommageCorpsImg, eauDeRoseImg];

  return (
    <>
      {banner.enabled && (
        <div className="bg-primary text-primary-foreground text-center py-2.5 text-sm tracking-wide">{banner.message}</div>
      )}
      <PromoBanner />

      {/* Hero */}
      <section ref={heroRef} className="relative h-[100svh] -mt-16 md:-mt-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <picture>
            <source media="(max-width: 767px)" srcSet={coffretImgMobile} />
            <source media="(min-width: 768px)" srcSet={coffretImg} />
            <img src={coffretImg} alt="ALIAA Natural Care" className="w-full h-[120%] object-cover animate-ken-burns" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/20 to-charcoal/60" />
        </motion.div>
        <motion.div className="relative container-full h-full flex flex-col justify-end pb-20 md:pb-28 pt-16 md:pt-20" style={{ opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white mb-8 leading-[0.9] tracking-tight">
              {t("hero.title1")}<br /><span className="italic font-normal">{t("hero.title2")}</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed max-w-lg">{t("hero.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                <Link to="/products">{t("common.discover")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></Link>
              </Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{t("hero.scroll")}</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <ArrowDown className="w-4 h-4 text-white/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Latest Products - MOVED UP */}
      <section className="py-20 md:py-28 bg-linen">
        <div className="container-full">
          <div className="flex items-end justify-between mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("common.products")}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("index.latestArrivals")}</h2>
            </motion.div>
            <Link to="/products"
              className="hidden md:flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors group">
              {t("common.viewAll")}<ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
            {latestProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
          <div className="mt-14 text-center md:hidden">
            <Button asChild variant="outline" className="rounded-none px-8 py-5 text-sm tracking-[0.15em] uppercase">
              <Link to="/products">{t("index.viewAllProducts")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Collection - MOVED DOWN */}
      {featuredCollection && (
        <section className="py-20 md:py-28">
          <div className="container-narrow">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="relative aspect-square overflow-hidden group">
                <img src={featuredCollection.heroImage || featuredCollection.image} alt={getTranslated(featuredCollection, "name", lang)} loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }} className="md:py-12">
                <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">{t("index.featuredCollection")}</p>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-[0.95]">{getTranslated(featuredCollection, "name", lang)}</h2>
                <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">{getTranslated(featuredCollection, "description", lang)}. {t("index.featuredDesc")}</p>
                <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                  <Link to={`/products?collection=${featuredCollection.slug}`}>
                    {t("index.discoverCollection")} {getTranslated(featuredCollection, "name", lang)}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Packs */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container-full">
          <div className="flex items-end justify-between mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("index.specialOffers")}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("index.ourPacks")}</h2>
            </motion.div>
            <Link to="/packs"
              className="hidden md:flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors group">
              {t("common.viewAll")}<ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
          
          {activePacks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activePacks.slice(0, 3).map((pack, index) => <PackCard key={pack.id} pack={pack} index={index} />)}
              </div>
              <div className="mt-14 text-center md:hidden">
                <Button asChild variant="outline" className="rounded-none px-8 py-5 text-sm tracking-[0.15em] uppercase">
                  <Link to="/packs">{t("common.viewAll")}</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="font-serif text-xl text-muted-foreground italic">
                {t("packs.noPacks")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-24 md:py-32">
        <div className="container-full">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="text-center mb-16">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("index.browseBy")}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("common.collections")}</h2>
          </motion.div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              {displayedCollections[0] && <div className="md:col-span-7"><CollectionCard collection={displayedCollections[0]} index={0} /></div>}
              {displayedCollections[1] && <div className="md:col-span-5"><CollectionCard collection={displayedCollections[1]} index={1} /></div>}
              {displayedCollections[2] && <div className="md:col-span-6"><CollectionCard collection={displayedCollections[2]} index={2} /></div>}
              {displayedCollections[3] && <div className="md:col-span-6"><CollectionCard collection={displayedCollections[3]} index={3} /></div>}
            </div>
          </div>
        </div>
      </section>

      {/* Follow Us - MOVED UP */}
      <section className="py-20 md:py-28 bg-linen">
        <div className="container-full">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("index.followUs")}</p>
            <div className="flex items-center justify-center gap-6 mb-4">
              <a href="https://www.instagram.com/aliaacare/" target="_blank" rel="noopener noreferrer" className="font-serif text-2xl md:text-3xl text-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Instagram className="w-6 h-6" />
                <span>Instagram</span>
              </a>
              <span className="w-px h-8 bg-border hidden sm:block" />
              <a href="https://www.tiktok.com/@aliaacare" target="_blank" rel="noopener noreferrer" className="font-serif text-2xl md:text-3xl text-foreground hover:text-primary transition-colors flex items-center gap-2">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.98-1.03 1.64-.28 1.22.2 2.56 1.25 3.19.5.34 1.14.44 1.73.39.45-.03.9-.17 1.3-.4.74-.42 1.22-1.2 1.32-2.03.01-2.89 0-5.79.01-8.68z"/>
                </svg>
                <span>TikTok</span>
              </a>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">{t("index.followDesc")}</p>
          </motion.div>
          <div className="relative overflow-hidden -mx-4 md:-mx-8 lg:-mx-12">
            <motion.div 
              className="flex gap-4 md:gap-6 w-max px-4 md:px-8 lg:px-12"
              animate={{ x: [0, "-50%"] }}
              transition={{ 
                duration: 60, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {[...finalImages, ...finalImages].map((image, index) => (
                <div 
                  key={index} 
                  className="w-[200px] md:w-[280px] aspect-[4/5] rounded-lg overflow-hidden bg-muted"
                >
                  <img src={image} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values - MOVED DOWN */}
      <section className="py-24 md:py-32">
        <div className="container-full">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }} className="text-center mb-16">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("index.ourCommitments")}</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.3] mb-8">
              {t("index.commitmentTitle")}{" "}<span className="italic">{t("index.commitmentTitleItalic")}</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16 max-w-4xl mx-auto">
            {[
              { icon: Leaf, title: t("index.natural"), desc: t("index.naturalDesc") },
              { icon: Heart, title: t("index.feminineWellbeing"), desc: t("index.feminineDesc") },
              { icon: Sparkles, title: t("index.ancestralKnowledge"), desc: t("index.ancestralDesc") },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }} className="text-center">
                <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Button asChild variant="outline" size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase">
              <Link to="/about">{t("common.ourStory")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;

