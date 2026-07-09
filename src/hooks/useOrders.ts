import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbOrder {
  id: string;
  order_number: string;
  total: number;
  total_cost: number;
  created_at: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_region?: string;
  notes?: string;
  status_history?: { status: string; date: string; label: string }[];
  items: { product_id: string | null; product_name: string; quantity: number; unit_price: number; cost_price: number; selected_flavors?: string[]; selected_weight?: number }[];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<DbOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []) as unknown as DbOrder[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Prevents loading spinner when switching tabs
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, currentHistory = [] }: { id: string; status: DbOrder['status']; currentHistory?: DbOrder['status_history'] }) => {
      const newStep = {
        status,
        date: new Date().toISOString(),
        label: status === 'pending' ? 'En attente' : 
               status === 'confirmed' ? 'Confirmée' : 
               status === 'shipped' ? 'Expédiée' : 
               status === 'delivered' ? 'Livrée' : 'Annulée'
      };

      const { data, error } = await supabase
        .from("orders")
        .update({ 
          status,
          status_history: [...currentHistory, newStep]
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useBulkDeleteOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      updates: {
        customer_name: string;
        customer_phone: string;
        customer_address: string;
        customer_city: string;
        customer_region?: string;
        notes?: string;
        total: number;
        status: DbOrder['status'];
      };
      items: { product_id: string | null; product_name: string; quantity: number; unit_price: number; cost_price: number; selected_flavors?: string[]; selected_weight?: number }[];
    }) => {
      const { id, updates, items } = input;
      
      // 1. Update order record
      const { error: orderError } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id);
      if (orderError) throw orderError;

      // 2. Refresh items: delete and re-insert
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", id);
      if (deleteError) throw deleteError;

      if (items.length > 0) {
        const { error: insertError } = await supabase
          .from("order_items")
          .insert(items.map(item => ({ ...item, order_id: id })));
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      order_number: string;
      total: number;
      total_cost: number;
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      customer_city: string;
      customer_region?: string;
      notes?: string;
      items: { product_id?: string; product_name: string; quantity: number; unit_price: number; cost_price: number; selected_flavors?: string[]; selected_weight?: number }[];
    }) => {
      const { items, ...order } = input;
      
      // Generate a client-side UUID for the order id to avoid select().single() RLS issues
      const orderId = crypto.randomUUID();
      
      const { error: orderError } = await supabase
        .from("orders")
        .insert({ id: orderId, ...order, status: 'pending' });
        
      if (orderError) {
        console.error("Error inserting order:", orderError);
        throw orderError;
      }
      
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(
            items.map((i) => ({ ...i, order_id: orderId }))
          );
        if (itemsError) {
          console.error("Error inserting order items:", itemsError);
          throw itemsError;
        }
      }
      
      return { id: orderId, ...order, status: 'pending' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useTrackOrder(orderNumber: string | null) {
  return useQuery({
    queryKey: ["track-order", orderNumber],
    enabled: !!orderNumber,
    queryFn: async (): Promise<DbOrder | null> => {
      if (!orderNumber) return null;
      
      const cleanNumber = orderNumber.trim().toUpperCase().replace(/^#/, "");
      
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", cleanNumber)
        .maybeSingle();
        
      if (error) throw error;
      if (!order) return null;

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      return {
        ...order,
        items: items || [],
      } as unknown as DbOrder;
    },
  });
}
