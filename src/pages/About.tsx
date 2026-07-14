import { Link } from "react-router-dom";
import { useRef } from "react";
import { ArrowRight, Leaf, Heart, Sparkles, Shield, Star, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import { useLanguage } from "@/hooks/useLanguage";
import coffretImg from "@/assets/coffret-aliaa.webp";
import guideImg from "@/assets/about-pic.png";
import chayNifasImg from "@/assets/about-pic2.png";
import coffretArganImg from "@/assets/about-pic3.png";
import selsBainImg from "@/assets/about-pic4.png";

import { SEOManager } from "@/seo/components/SEOManager";

const About = () => {
  const { t } = useT();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const heroRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: "100%", label: t("about.statNatural") },
    { value: "0%", label: t("about.statAdditives") },
  ];

  const pageTitle = t("common.ourStory") || "Notre Histoire";
  const pageDesc = t("about.heroDesc") || "Découvrez notre histoire et notre engagement pour le bien-être naturel féminin.";

  return (
    <>
      <SEOManager
        title={pageTitle}
        description={pageDesc}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: pageTitle, item: "/about" },
        ]}
      />
      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative h-[calc(100dvh-6rem)] md:h-[calc(100vh-7rem)] overflow-hidden">
        <div className="absolute inset-0">
          <img src={coffretImg} alt="ALIAA Natural Care" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/20 to-charcoal/70" />
        </div>
        <div className="relative container-full h-full flex flex-col justify-end pb-16 md:pb-28">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/60 mb-5">{t("about.heroTag")}</p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-[0.9]">
              {t("about.heroTitle1")}<br /><span className="italic font-normal">{t("about.heroTitle2")}</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">{t("about.heroDesc")}</p>
          </div>

          {/* Stats bar */}
          <div className="flex gap-8 md:gap-16 mt-12 pt-8 border-t border-white/20">
            {stats.map((stat, i) => (
              <div key={i}>
                <p className="font-serif text-3xl md:text-4xl text-white">{stat.value}</p>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PHILOSOPHY ─── */}
      <section className="py-20 md:py-24 md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-narrow w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="divider-ornament mb-12">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary whitespace-nowrap">{t("about.philosophy")}</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.25] tracking-tight">
              {t("about.philosophyText")} <span className="italic text-primary">{t("about.philosophyItalic")}</span> {t("about.philosophyText2")}
            </h2>
          </div>
        </div>
      </section>

      {/* ─── ORIGINS ─── */}
      <section className="py-20 md:py-24 md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-full w-full">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="md:col-span-5">
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">{t("about.origins")}</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                {t("about.originsTitle1")}<br /><span className="italic">{t("about.originsTitle2")}</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">{t("about.originsText1")}</p>
              <p className="text-muted-foreground leading-[1.8]">{t("about.originsText2")}</p>
            </div>
            <div className="md:col-span-7 relative flex justify-center">
              <div className="aspect-square w-full max-w-md overflow-hidden group rounded-lg shadow-2xl">
                <img src={chayNifasImg} alt="Chay Nifas" loading="lazy" className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105" />
              </div>
              <div className={cn(
                "absolute -bottom-8 bg-primary text-primary-foreground p-6 md:p-8 rounded-lg shadow-xl max-w-[220px]",
                isRtl ? "-right-6 md:-right-12" : "-left-6 md:-left-12"
              )}
              >
                <Leaf className="w-6 h-6 mb-3 opacity-70" />
                <p className="font-serif text-lg leading-snug">{t("about.naturalNoPreservatives")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUOTE BANNER ─── */}
      <section className="py-20 md:py-24 md:min-h-[calc(100vh-7rem)] md:flex md:items-center px-4 md:px-8">
        <div className="w-full">
          <div className="relative h-[60vh] md:h-[calc(100vh-12rem)] overflow-hidden rounded-[2rem] group w-full max-w-7xl mx-auto shadow-2xl">
            <img src={guideImg} alt="Guide ALIAA" loading="lazy" className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-charcoal/30 flex items-center justify-center p-8">
              <div className="text-center max-w-4xl mx-auto">
                <Sparkles className="w-10 h-10 text-white/50 mx-auto mb-8" />
                <p className="font-serif text-4xl md:text-5xl lg:text-7xl text-white max-w-4xl leading-[1.15]">
                  {t("about.quote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── APPROACH ─── */}
      <section className="py-20 md:py-24 md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-full w-full">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="md:col-span-7 md:order-first relative flex justify-center">
              <div className="aspect-square w-full max-w-md overflow-hidden group rounded-lg shadow-2xl">
                <img src={coffretArganImg} alt="Coffret ALIAA" loading="lazy" className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105" />
              </div>
              <div className={cn(
                "absolute -bottom-8 bg-background border border-border p-6 md:p-8 rounded-lg shadow-xl max-w-[220px]",
                isRtl ? "-left-6 md:-left-12" : "-right-6 md:-right-12"
              )}
              >
                <Heart className="w-6 h-6 mb-3 text-primary" />
                <p className="font-serif text-lg leading-snug text-foreground">{t("about.preparedWithLove")}</p>
              </div>
            </div>
            <div className="md:col-span-5">
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">{t("about.approach")}</p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mb-8 leading-tight">
                {t("about.approachTitle1")}<br /><span className="italic">{t("about.approachTitle2")}</span>
              </h3>
              <p className="text-muted-foreground leading-[1.8] mb-5">{t("about.approachText1")}</p>
              <p className="text-muted-foreground leading-[1.8]">{t("about.approachText2")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROCESS STEPS ─── */}
      <section className="py-20 md:py-24 bg-muted/30 border-y border-border md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-full w-full">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("about.ourProcess")}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("about.fromFieldToCup")}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 md:gap-6 lg:gap-10">
            {[
              { icon: Leaf, step: "01", title: t("about.step1Title"), desc: t("about.step1Desc") },
              { icon: Droplets, step: "02", title: t("about.step2Title"), desc: t("about.step2Desc") },
              { icon: Shield, step: "03", title: t("about.step3Title"), desc: t("about.step3Desc") },
              { icon: Star, step: "04", title: t("about.step4Title"), desc: t("about.step4Desc") },
            ].map((item, i) => (
              <div
                key={i}
                className="relative text-center group"
              >
                {i < 3 && (
                  <div className={cn(
                    "hidden md:block absolute top-8 w-[80%] h-px bg-border",
                    isRtl ? "right-[60%]" : "left-[60%]"
                  )} />
                )}
                <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-500">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-primary/40 mb-2 block">{item.step}</span>
                <h3 className="font-serif text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="py-20 md:py-24 bg-linen md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-full w-full">
          <div className="text-center mb-20">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("about.whatGuidesUs")}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("about.ourValues")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8 lg:gap-16">
            {[
              { title: t("about.purity"), number: "01", description: t("about.purityDesc"), icon: Leaf },
              { title: t("about.tradition"), number: "02", description: t("about.traditionDesc"), icon: Star },
              { title: t("about.kindness"), number: "03", description: t("about.kindnessDesc"), icon: Heart },
            ].map((value, i) => (
              <div key={i}
                className="text-center p-8 md:p-10 rounded-xl bg-background border border-border hover:shadow-lg transition-shadow duration-500 group"
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-primary/40 mb-3 block">{value.number}</span>
                <h3 className="font-serif text-2xl text-foreground mb-4">{value.title}</h3>
                <div className="w-8 h-px bg-primary/30 mx-auto mb-5" />
                <p className="text-muted-foreground leading-[1.8] text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── CTA SECTION ─── */}
      <section className="py-20 md:py-24 bg-accent/30 border-t border-border md:min-h-[calc(100vh-7rem)] md:flex md:items-center">
        <div className="container-full w-full">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <div>
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
            </div>
          </div>
        </div>
      </section>

    </>
  );
};

export default About;
