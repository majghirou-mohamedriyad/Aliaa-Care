import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbPack {
  id: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  slug: string;
  description: string;
  description_ar?: string | null;
  description_en?: string | null;
  long_description: string;
  long_description_ar?: string | null;
  long_description_en?: string | null;
  price: number;
  image: string;
  images: string[];
  active: boolean;
  featured: boolean;
  created_at: string;
  items: DbPackItem[];
}

export interface DbPackItem {
  id: string;
  pack_id: string;
  product_id: string;
  quantity: number;
  selected_weight?: string | null;
  product_name?: string;
  product_name_ar?: string | null;
  product_name_en?: string | null;
  product_image?: string;
  product_price?: number;
  product_flavors?: string[];
  product_flavors_ar?: string[];
  product_flavors_en?: string[];
  product_weight?: string | number | null;
  product_weight_prices?: { weight: string | number; price: number }[] | null;
}

async function fetchPacks(): Promise<DbPack[]> {
  const { data, error } = await supabase
    .from("packs")
    .select(`
      *,
      images:pack_images(image_url, position),
      items:pack_items(
        *,
        product:products(
          id, name, name_ar, name_en, price, slug,
          weight, weight_prices,
          flavors, flavors_ar, flavors_en,
          images:product_images(image_url, position)
        )
      )
    `)
    .order("created_at", { ascending: false })
    .order("position", { foreignTable: "pack_images", ascending: true })
    .order("position", { foreignTable: "pack_items.product.images", ascending: true });

  if (error) throw error;

  return (data || []).map((pack) => {
    const imagesMapped = (pack.images || []).map((img: any) => img.image_url);
    return {
      ...pack,
      description: pack.description || "",
      long_description: pack.long_description || "",
      image: pack.image || "/placeholder.svg",
      images: imagesMapped.length > 0 ? imagesMapped : [pack.image || "/placeholder.svg"],
      featured: pack.featured ?? false,
      items: (pack.items || []).map((item) => ({
        ...item,
        product_name: item.product?.name || "Produit inconnu",
        product_name_ar: item.product?.name_ar || null,
        product_name_en: item.product?.name_en || null,
        product_image: item.product?.images?.[0]?.image_url || "/placeholder.svg",
        product_price: item.product?.price || 0,
        product_flavors: item.product?.flavors || [],
        product_flavors_ar: item.product?.flavors_ar || [],
        product_flavors_en: item.product?.flavors_en || [],
        product_weight: item.product?.weight || null,
        product_weight_prices: item.product?.weight_prices || null,
      })),
    };
  }) as unknown as DbPack[];
}

export function usePacks() {
  return useQuery({ 
    queryKey: ["packs"], 
    queryFn: fetchPacks,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string; slug: string; description: string; long_description: string;
      price: number; image: string; images: string[]; active: boolean; featured: boolean;
      items: { product_id: string; quantity: number; selected_weight?: string | null }[];
      name_ar?: string;
      name_en?: string;
      description_ar?: string;
      description_en?: string;
      long_description_ar?: string;
      long_description_en?: string;
    }) => {
      const { items, images, ...packData } = input;
      const { data, error } = await supabase
        .from("packs")
        .insert(packData)
        .select()
        .single();
      if (error) throw error;

      if (images && images.length > 0 && data) {
        const packImages = images.map((url, i) => ({
          pack_id: data.id,
          image_url: url,
          position: i,
        }));
        const { error: imagesError } = await supabase.from("pack_images").insert(packImages);
        if (imagesError) throw imagesError;
      }

      if (items.length > 0 && data) {
        const packItems = items.map((i) => ({ 
          pack_id: data.id, 
          product_id: i.product_id, 
          quantity: i.quantity,
          selected_weight: i.selected_weight || null
        }));
        const { error: itemsError } = await supabase.from("pack_items").insert(packItems);
        if (itemsError) throw itemsError;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packs"] }),
  });
}

export function useUpdatePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      updates: { name: string; slug: string; description: string; long_description: string; price: number; image: string; active: boolean; featured: boolean; name_ar?: string | null; name_en?: string | null; description_ar?: string | null; description_en?: string | null; long_description_ar?: string | null; long_description_en?: string | null };
      images: string[];
      items: { product_id: string; quantity: number; selected_weight?: string | null }[];
    }) => {
      const { error } = await supabase
        .from("packs")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;

      if (input.images !== undefined) {
        await supabase.from("pack_images").delete().eq("pack_id", input.id);
        if (input.images.length > 0) {
          const packImages = input.images.map((url, i) => ({
            pack_id: input.id,
            image_url: url,
            position: i,
          }));
          const { error: imagesError } = await supabase.from("pack_images").insert(packImages);
          if (imagesError) throw imagesError;
        }
      }

      await supabase.from("pack_items").delete().eq("pack_id", input.id);
      if (input.items.length > 0) {
        const packItems = input.items.map((i) => ({ 
          pack_id: input.id, 
          product_id: i.product_id, 
          quantity: i.quantity,
          selected_weight: i.selected_weight || null
        }));
        await supabase.from("pack_items").insert(packItems);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packs"] }),
  });
}

export function useDeletePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packs"] }),
  });
}

export function useBulkDeletePacks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("packs").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packs"] }),
  });
}

export function useTogglePackActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("packs").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packs"] }),
  });
}
