/**
 * Service pour gérer l'envoi de messages WhatsApp via WAHA
 */

import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_flavors?: string[];
  pack_item_flavors?: Record<string, string[]>;
  selected_weight?: string | number;
}

export interface OrderData {
  order_number: string;
  total: number;
  customerName: string;
  phone: string;
  address: string;
}

const translations = {
  fr: {
    title: "*Nouvelle commande chez ALIAA Natural Care* 🌿",
    greeting: "Bonjour",
    thanks: "Merci pour votre commande",
    details: "*Détails :*",
    total: "Total :",
    address: "Adresse :",
    footer: "Votre commande est en cours de traitement. Nous vous contacterons bientôt pour la livraison.",
    flavors: "Goûts :",
  },
  ar: {
    title: "*طلب جديد من ALIAA Natural Care* 🌿",
    greeting: "مرحباً",
    thanks: "شكراً لطلبك",
    details: "*التفاصيل:*",
    total: "المجموع:",
    address: "العنوان:",
    footer: "طلبك قيد المعالجة. سنتصل بك قريباً بخصوص التوصيل.",
    flavors: "النكهات:",
  },
  en: {
    title: "*New order at ALIAA Natural Care* 🌿",
    greeting: "Hello",
    thanks: "Thank you for your order",
    details: "*Details:*",
    total: "Total:",
    address: "Address:",
    footer: "Your order is being processed. We will contact you soon for delivery.",
    flavors: "Flavors:",
  }
};

export const sendOrderWhatsAppNotification = async (
  order: OrderData,
  items: OrderItem[],
  language: string = "fr"
) => {
  const t = translations[language as keyof typeof translations] || translations.fr;
  
  const itemsList = items
    .map((item) => {
      const formattedWeight = item.selected_weight
        ? (/^\d+(\.\d+)?$/.test(String(item.selected_weight).trim()) ? `${item.selected_weight}g` : item.selected_weight)
        : "";
      const nameWithWeight = formattedWeight ? `${item.product_name} (${formattedWeight})` : item.product_name;
      let text = `• ${item.quantity}x ${nameWithWeight} (${item.unit_price} DH)`;
      
      if (item.selected_flavors && item.selected_flavors.length > 0) {
        text += `\n  _${t.flavors} ${item.selected_flavors.join(", ")}_`;
      }
      
      if (item.pack_item_flavors && Object.keys(item.pack_item_flavors).length > 0) {
        Object.entries(item.pack_item_flavors).forEach(([pName, flavors]) => {
          if (flavors && flavors.length > 0) {
            text += `\n   - ${pName}: _${flavors.join(", ")}_`;
          }
        });
      }
      
      return text;
    })
    .join("\n");

  const message =
    `${t.title}\n\n` +
    `${t.greeting} ${order.customerName},\n` +
    `${t.thanks} *#${order.order_number}*.\n\n` +
    `${t.details}\n${itemsList}\n\n` +
    `💰 *${t.total} ${order.total.toLocaleString()} DH*\n` +
    `📍 *${t.address}* ${order.address}\n\n` +
    `${t.footer}`;

  const buttons = [
    { id: "oui", text: language === "ar" ? "تأكيد الطلب ✅" : "Confirmer ✅" },
    { id: "non", text: language === "ar" ? "إلغاء الطلب ❌" : "Annuler ❌" }
  ];

  const { data, error } = await supabase.functions.invoke("send-whatsapp", {
    body: { 
      phone: order.phone,
      message: message,
    },
  });

  if (error) throw error;
  return data;
};

export const sendFeedbackWhatsAppRequest = async (
  orderId: string,
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  language: string = "fr"
) => {
  const feedbackUrl = `https://aliaacare.com/feedback/${orderId}`;
  
  const textFR = `*ALIAA Natural Care* 🌿\n\n` +
    `Bonjour ${customerName},\n\n` +
    `Merci pour votre confiance ! Votre commande *#${orderNumber}* a été livrée. 🎉\n\n` +
    `Pouvez-vous prendre 15 secondes pour évaluer notre service et le(s) produit(s) reçu(s) ?\n` +
    `Votre avis nous aide énormément : 👇\n` +
    `${feedbackUrl}`;

  const textAR = `*ALIAA Natural Care* 🌿\n\n` +
    `مرحباً ${customerName}،\n\n` +
    `شكراً لثقتكم بنا! تم توصيل طلبكم *#${orderNumber}*. 🎉\n\n` +
    `هل يمكنك تخصيص 15 ثانية لتقييم خدماتنا والمنتجات التي استلمتها؟\n` +
    `رأيك يهمنا كثيراً: 👇\n` +
    `${feedbackUrl}`;

  const message = language === "ar" ? textAR : textFR;

  const { data, error } = await supabase.functions.invoke("send-whatsapp", {
    body: { 
      phone: customerPhone,
      message: message
    },
  });

  if (error) throw error;
  return { data, feedbackUrl, message };
};

