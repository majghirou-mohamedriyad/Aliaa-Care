import { useLanguage } from "@/hooks/useLanguage";

const CONTENT = {
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour : 25 juin 2026",
    intro: "Chez ALIAA Care, nous accordons une importance primordiale à la confidentialité et à la sécurité de vos données personnelles. Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations.",
    section1Title: "1. Collecte des données",
    section1Text: "Nous collectons les données que vous nous fournissez directement lors de la création d'un compte, d'une commande, ou lorsque vous nous contactez (nom, adresse, e-mail, numéro de téléphone, etc.).",
    section2Title: "2. Utilisation de Microsoft Clarity",
    section2Text: "Nous collaborons avec Microsoft Clarity et Microsoft Advertising afin de capturer la façon dont vous utilisez et interagissez avec notre site web grâce à des métriques comportementales, des cartes de chaleur (heatmaps) et des enregistrements de session pour améliorer et commercialiser nos produits et services. Les données d'utilisation du site sont collectées à l'aide de cookies propriétaires et tiers ainsi que d'autres technologies de suivi pour déterminer la popularité de nos produits/services et l'activité en ligne. De plus, nous utilisons ces informations pour l'optimisation du site, à des fins de sécurité/prévention de la fraude, et pour la publicité.",
    section2More: "Pour plus d'informations sur la façon dont Microsoft collecte et utilise vos données, veuillez consulter la",
    microsoftPrivacyLink: "Déclaration de confidentialité de Microsoft",
    section3Title: "3. Vos Droits",
    section3Text: "Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de vos données personnelles. Vous pouvez exercer ces droits en nous contactant à l'adresse fournie dans notre section de contact.",
    backToHome: "Retour à l'accueil"
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 25, 2026",
    intro: "At ALIAA Care, we attach paramount importance to the privacy and security of your personal data. This privacy policy describes how we collect, use, and protect your information.",
    section1Title: "1. Data Collection",
    section1Text: "We collect data that you provide directly to us when creating an account, placing an order, or when contacting us (name, address, email, phone number, etc.).",
    section2Title: "2. Use of Microsoft Clarity",
    section2Text: "We partner with Microsoft Clarity and Microsoft Advertising to capture how you use and interact with our website through behavioral metrics, heatmaps, and session replay to improve and market our products/services. Website usage data is captured using first and third-party cookies and other tracking technologies to determine the popularity of products/services and online activity. Additionally, we use this information for site optimization, fraud/security purposes, and advertising.",
    section2More: "For more information about how Microsoft collects and uses your data, visit the",
    microsoftPrivacyLink: "Microsoft Privacy Statement",
    section3Title: "3. Your Rights",
    section3Text: "In accordance with applicable regulations, you have the right to access, rectify, delete, and object to the processing of your personal data. You can exercise these rights by contacting us at the address provided in our contact section.",
    backToHome: "Back to Home"
  },
  ar: {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: 25 يونيو 2026",
    intro: "في ALIAA Care، نولي أهمية قصوى لخصوصية وأمن بياناتك الشخصية. تصف سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها وحمايتها.",
    section1Title: "1. جمع البيانات",
    section1Text: "نقوم بجمع البيانات التي تقدمها لنا مباشرة عند إنشاء حساب، أو تقديم طلب، أو عند الاتصال بنا (الاسم، العنوان، البريد الإلكتروني، رقم الهاتف، إلخ).",
    section2Title: "2. استخدام Microsoft Clarity",
    section2Text: "نحن نشترك مع Microsoft Clarity و Microsoft Advertising لتسجيل كيفية استخدامك وتفاعلك مع موقعنا الإلكتروني من خلال المقاييس السلوكية، والخرائط الحرارية (heatmaps)، وإعادة تشغيل الجلسات لتحسين وتسويق منتجاتنا وخدماتنا. يتم تسجيل بيانات استخدام الموقع باستخدام ملفات تعريف الارتباط الخاصة بالجهة الأولى والجهات الخارجية وتقنيات التتبع الأخرى لتحديد مدى شعبية المنتجات/الخدمات والنشاط عبر الإنترنت. بالإضافة إلى ذلك، نستخدم هذه المعلومات لتحسين الموقع، ولأغراض الأمان/منع الاحتيال، والإعلانات.",
    section2More: "لمزيد من المعلومات حول كيفية جمع Microsoft لبياناتك واستخدامها، تفضل بزيارة",
    microsoftPrivacyLink: "بيان خصوصية Microsoft",
    section3Title: "3. حقوقك",
    section3Text: "وفقًا للوائح المعمول بها، لديك الحق في الوصول إلى بياناتك الشخصية وتصحيحها وحذفها والاعتراض على معالجتها. يمكنك ممارسة هذه الحقوق عن طريق الاتصال بنا على العنوان الموضح في قسم الاتصال الخاص بنا.",
    backToHome: "العودة إلى الرئيسية"
  }
};

import { SEOManager } from "@/seo/components/SEOManager";

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const lang = (language === "ar" || language === "en" || language === "fr") ? language : "fr";
  const t = CONTENT[lang];
  const isRtl = language === "ar";

  return (
    <>
      <SEOManager
        title={t.title}
        description={t.intro}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: t.title, item: "/privacy-policy" },
        ]}
      />
      <div className="min-h-screen bg-[#FBF9F6] pt-24 pb-16 px-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-[#EAE6DF]">
        <h1 className="font-serif text-3xl md:text-4xl text-[#365836] mb-2">
          {t.title}
        </h1>
        <p className="text-xs text-[#8A847C] mb-8">
          {t.lastUpdated}
        </p>

        <div className="space-y-8 text-sm text-[#4E4943] leading-relaxed">
          <p className="text-base font-medium text-[#33302C]">
            {t.intro}
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-[#365836] font-semibold">
              {t.section1Title}
            </h2>
            <p>{t.section1Text}</p>
          </section>

          <section className="space-y-3 bg-[#F4F1EA] p-5 rounded-xl border border-[#E3DEC7]/40">
            <h2 className="font-serif text-xl text-[#365836] font-semibold">
              {t.section2Title}
            </h2>
            <p className="mb-3">{t.section2Text}</p>
            <p className="text-xs italic text-[#6B655E]">
              {t.section2More}{" "}
              <a 
                href="https://privacy.microsoft.com/privacystatement" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-[#365836] transition-colors"
              >
                {t.microsoftPrivacyLink}
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-[#365836] font-semibold">
              {t.section3Title}
            </h2>
            <p>{t.section3Text}</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#EAE6DF] flex justify-center">
          <a 
            href="/" 
            className="text-sm font-semibold text-[#365836] hover:underline"
          >
            &larr; {t.backToHome}
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
