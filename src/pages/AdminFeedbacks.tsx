import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, 
  Search, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  TrendingUp, 
  Award,
  Filter,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DbFeedback {
  id: string;
  order_id: string;
  service_rating: number;
  product_ratings: Record<string, number>;
  comment: string | null;
  created_at: string;
  orders?: {
    customer_name: string;
    order_number: string;
  } | null;
}

export default function AdminFeedbacks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Fetch feedbacks
  const { data: feedbacks = [], isLoading, error } = useQuery<DbFeedback[]>({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("customer_feedbacks")
        .select(`
          *,
          orders (
            customer_name,
            order_number
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      return data as unknown as DbFeedback[];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from("customer_feedbacks")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
      toast({ title: "Avis supprimé", description: "L'avis client a été retiré avec succès." });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de supprimer l'avis.", variant: "destructive" });
    }
  });

  // Calculate statistics
  const totalCount = feedbacks.length;
  
  const avgServiceRating = totalCount > 0
    ? (feedbacks.reduce((acc, curr) => acc + curr.service_rating, 0) / totalCount).toFixed(1)
    : "0.0";

  // Calculate average product rating
  let totalProductRatingSum = 0;
  let totalProductRatingCount = 0;

  feedbacks.forEach(f => {
    if (f.product_ratings && typeof f.product_ratings === 'object') {
      Object.values(f.product_ratings).forEach(val => {
        if (typeof val === 'number') {
          totalProductRatingSum += val;
          totalProductRatingCount++;
        }
      });
    }
  });

  const avgProductRating = totalProductRatingCount > 0
    ? (totalProductRatingSum / totalProductRatingCount).toFixed(1)
    : "0.0";

  const positiveRate = totalCount > 0
    ? Math.round((feedbacks.filter(f => f.service_rating >= 4).length / totalCount) * 100)
    : 0;

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const customerName = fb.orders?.customer_name?.toLowerCase() || "";
    const orderNumber = fb.orders?.order_number?.toLowerCase() || "";
    const commentText = fb.comment?.toLowerCase() || "";
    const searchLower = search.toLowerCase();

    const matchesSearch = 
      customerName.includes(searchLower) || 
      orderNumber.includes(searchLower) ||
      commentText.includes(searchLower);

    const matchesRating = 
      ratingFilter === "all" || 
      fb.service_rating.toString() === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPP à HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold">Erreur de chargement</h3>
          <p className="text-sm">Impossible de récupérer les avis clients depuis la base de données. Assurez-vous d'avoir appliqué les migrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Avis & Évaluations Clients</h1>
        <p className="text-sm text-muted-foreground">Consultez les retours d'expérience et notes récoltés après livraison</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Avis</CardTitle>
            <MessageSquare className="w-4 h-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Soumissions enregistrées</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note Service</CardTitle>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight flex items-baseline gap-1">
              {avgServiceRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Moyenne service global</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note Produits</CardTitle>
            <Award className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight flex items-baseline gap-1">
              {avgProductRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Moyenne avis produits</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Satisfaction</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{positiveRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Avis positifs (4 et 5 ★)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client, commande ou commentaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-neutral-200"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[160px] h-10 border-neutral-200">
              <span className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <SelectValue placeholder="Filtrer note" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les notes</SelectItem>
              <SelectItem value="5">5 Étoiles (★★★★★)</SelectItem>
              <SelectItem value="4">4 Étoiles (★★★★)</SelectItem>
              <SelectItem value="3">3 Étoiles (★★★)</SelectItem>
              <SelectItem value="2">2 Étoiles (★★)</SelectItem>
              <SelectItem value="1">1 Étoile (★)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedbacks Grid */}
      {filteredFeedbacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeedbacks.map((fb) => (
            <Card key={fb.id} className="shadow-sm hover:shadow-md transition-shadow border-neutral-100 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-neutral-50">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base font-semibold text-neutral-800">
                        {fb.orders?.customer_name || "Client anonyme"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="font-mono bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded">
                          #{fb.orders?.order_number || "N/A"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          {formatDate(fb.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 h-8 w-8"
                      onClick={() => {
                        if (confirm("Voulez-vous vraiment supprimer cet avis ?")) {
                          deleteMutation.mutate(fb.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {/* Service Star rating */}
                  <div className="flex items-center gap-4 bg-[#FAF6F0] p-3 rounded-lg border border-[#F3EFEA]">
                    <span className="text-xs font-semibold text-[#C5A28E] uppercase tracking-wider">Note Service</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= fb.service_rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-200 fill-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Product star ratings */}
                  {fb.product_ratings && Object.keys(fb.product_ratings).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Notes Produits</span>
                      <div className="space-y-1.5">
                        {Object.entries(fb.product_ratings).map(([productName, rating]) => (
                          <div key={productName} className="flex justify-between items-center text-sm bg-neutral-50/50 p-2 rounded border border-neutral-100">
                            <span className="text-neutral-700 truncate max-w-[200px] sm:max-w-xs">{productName}</span>
                            <div className="flex gap-0.5 shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-neutral-200 fill-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments section */}
                  {fb.comment && (
                    <div className="space-y-1 bg-neutral-50/80 p-3 rounded-lg border border-dashed border-neutral-200">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Commentaire</span>
                      <p className="text-sm text-neutral-700 italic">« {fb.comment} »</p>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-neutral-100 shadow-sm">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-neutral-800">Aucun avis trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {search || ratingFilter !== "all" 
              ? "Essayez de modifier vos filtres ou termes de recherche."
              : "Aucun client n'a encore laissé d'avis sur le site."}
          </p>
        </div>
      )}
    </div>
  );
}
