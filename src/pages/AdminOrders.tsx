import { useState } from "react";

import { useOrders, useUpdateOrderStatus, useDeleteOrder, useBulkDeleteOrders, useUpdateOrderDetails, DbOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  X,
  Loader2,
  ShoppingBag,
  Eye,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ChevronDown,
  Trash2,
  AlertTriangle,
  Pencil,
  Plus,
  Minus,
  FileText,
  History,
  Circle,
  MessageSquare,
  PackagePlus,
  ArrowUpDown,
  Star
} from "lucide-react";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { sendFeedbackWhatsAppRequest } from "@/lib/whatsapp";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  shipped: { label: "Expédiée", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Truck },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const AdminOrders = () => {
  const { data: orders = [], isLoading } = useOrders();
  const { data: allProducts = [] } = useProducts();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const bulkDeleteOrders = useBulkDeleteOrders();
  const updateOrderDetails = useUpdateOrderDetails();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<DbOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const handleDelete = async () => {
    try {
      if (isBulkDeleting) {
        await bulkDeleteOrders.mutateAsync(selectedOrderIds);
        toast({ title: `${selectedOrderIds.length} commandes supprimées` });
        setSelectedOrderIds([]);
        setIsBulkDeleting(false);
      } else if (orderToDelete) {
        await deleteOrder.mutateAsync(orderToDelete);
        toast({ title: "Commande supprimée" });
        setOrderToDelete(null);
      }
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const total = editingOrder.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      await updateOrderDetails.mutateAsync({
        id: editingOrder.id,
        updates: {
          customer_name: editingOrder.customer_name,
          customer_phone: editingOrder.customer_phone,
          customer_address: editingOrder.customer_address,
          customer_city: editingOrder.customer_city,
          customer_region: editingOrder.customer_region,
          notes: editingOrder.notes,
          total,
          status: editingOrder.status,
        },
        items: editingOrder.items,
      });
      toast({ title: "Commande mise à jour" });
      setEditingOrder(null);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la commande", variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openWhatsApp = (order: DbOrder) => {
    // Basic phone cleaning: remove non-digits, and handle Moroccan format
    let phone = order.customer_phone.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = "212" + phone.substring(1);
    } else if (!phone.startsWith("212") && phone.length === 9) {
      phone = "212" + phone;
    }

    const message = encodeURIComponent(`Bonjour ${order.customer_name}, c'est Aliaa Care concernant votre commande #${order.order_number}. `);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleSendFeedbackRequest = async (order: DbOrder) => {
    toast({ title: "Envoi de l'enquête...", description: "Envoi automatique de la demande de feedback sur WhatsApp." });
    try {
      await sendFeedbackWhatsAppRequest(order.id, order.customer_phone, order.customer_name, order.order_number);
      toast({ title: "Enquête envoyée ✅", description: "La demande d'évaluation a été envoyée avec succès sur WhatsApp." });
    } catch (waError: any) {
      console.error("Failed to send feedback request:", waError);
      
      // Fallback manually via WhatsApp link
      let phone = order.customer_phone.replace(/\D/g, "");
      if (phone.startsWith("0")) phone = "212" + phone.substring(1);
      else if (!phone.startsWith("212") && phone.length === 9) phone = "212" + phone;
      
      const feedbackUrl = `${window.location.origin}/feedback/${order.id}`;
      const message = encodeURIComponent(
        `*ALIAA Natural Care* 🌿\n\n` +
        `Bonjour ${order.customer_name},\n\n` +
        `Merci pour votre confiance ! Votre commande #${order.order_number} a été livrée. 🎉\n\n` +
        `Pouvez-vous prendre 15 secondes pour évaluer notre service et le(s) produit(s) reçu(s) ?\n` +
        `Votre avis nous aide énormément : 👇\n` +
        `${feedbackUrl}`
      );
      
      toast({ 
        title: "API WhatsApp non disponible", 
        description: "La demande automatique a échoué. Cliquez pour l'envoyer manuellement.",
        action: (
          <Button size="sm" onClick={() => window.open(`https://wa.me/${phone}?text=${message}`, "_blank")}>
            Envoyer Manuel
          </Button>
        ),
        duration: 10000,
      });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: DbOrder['status']) => {
    const order = orders.find(o => o.id === orderId);
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        status: newStatus,
        currentHistory: order?.status_history || []
      });
      toast({ title: "Statut mis à jour", description: `La commande est maintenant ${statusConfig[newStatus].label.toLowerCase()}.` });

      if (newStatus === "delivered" && order) {
        await handleSendFeedbackRequest(order);
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Gestion des Commandes</h1>
            <p className="text-sm text-muted-foreground">{orders.length} commandes au total</p>
          </div>
          {selectedOrderIds.length > 0 && (
            <Button
              variant="destructive"
              className="gap-2 animate-in fade-in slide-in-from-right-2"
              onClick={() => setIsBulkDeleting(true)}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer ({selectedOrderIds.length})
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:pl-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par N°, nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 sm:-translate-x-3">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orders.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <Checkbox 
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  onCheckedChange={toggleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                  Tout sélectionner
                </label>
              </div>
            )}
        </div>
      </div>

        {/* Desktop Table */}
        <div className="border border-border rounded-lg overflow-hidden hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 w-10">
                  <Checkbox
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-medium">N° Commande</th>
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Heure</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const currentStatus = (order.status && statusConfig[order.status]) ? order.status : 'pending';
                const statusInfo = statusConfig[currentStatus];
                const StatusIcon = statusInfo.icon;
                const isSelected = selectedOrderIds.includes(order.id);
                return (
                  <tr key={order.id} className={`border-t border-border hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                      />
                    </td>
                    <td className="p-4 font-mono font-medium text-primary">#{order.order_number}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{order.customer_name}</span>
                        <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-nowrap">
                      {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(order.created_at), "HH:mm")}
                    </td>
                    <td className="p-4 text-right font-medium">{order.total.toLocaleString()} DH</td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color} transition-opacity hover:opacity-80`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-40">
                            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(order.id, status)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                {status === currentStatus && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                {statusConfig[status].label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                        title="Détails de la commande"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingOrder(order)}
                        title="Modifier la commande"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openWhatsApp(order)}
                        title="Contacter sur WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-primary"
                        onClick={() => generateInvoice(order)}
                        title="Générer facture PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setOrderToDelete(order.id)}
                        title="Supprimer la commande"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucune commande trouvée</p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => {
            const currentStatus = (order.status && statusConfig[order.status]) ? order.status : 'pending';
            const statusInfo = statusConfig[currentStatus];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={order.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-mono font-medium text-primary text-sm">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          className="cursor-pointer"
                        >
                          {statusConfig[status].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">{order.customer_name}</span>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Phone className="w-3 h-3" />
                    {order.customer_phone}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-serif text-lg">{order.total.toLocaleString()} DH</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditingOrder(order)} className="gap-2">
                      <Pencil className="w-4 h-4" /> Modifier
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)} className="gap-2">
                      <Eye className="w-4 h-4" /> Détails
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openWhatsApp(order)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                      <WhatsAppIcon className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => generateInvoice(order)} className="text-primary">
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setOrderToDelete(order.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent 
          className="max-w-3xl max-h-[95vh] p-0 overflow-hidden rounded-xl border-none shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Détails de la commande</DialogTitle>
          <DialogDescription className="sr-only">Affichage des informations détaillées de la commande sélectionnée.</DialogDescription>
          {selectedOrder && (
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Premium Header */}
              <div className="bg-primary p-6 text-primary-foreground relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="w-5 h-5 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Commande</span>
                    </div>
                    <h2 className="font-serif text-3xl font-bold">#{selectedOrder.order_number}</h2>
                    <p className="text-sm opacity-70 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Passée le {format(new Date(selectedOrder.created_at), "PPP à HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Customer & Shipping */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        Informations Client
                      </h3>
                      <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                            {selectedOrder.customer_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-none">{selectedOrder.customer_name}</p>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {selectedOrder.customer_phone}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3 pt-3 border-t border-border/50">
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">
                                {selectedOrder.customer_city}
                                {selectedOrder.customer_region && <span className="text-muted-foreground font-normal ml-1">({selectedOrder.customer_region})</span>}
                              </p>
                              <p className="text-muted-foreground leading-relaxed mt-0.5">{selectedOrder.customer_address}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut actuel</span>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${
                              statusConfig[selectedOrder.status]?.color || 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {(() => {
                                const Icon = statusConfig[selectedOrder.status]?.icon || Circle;
                                return <Icon className="w-3.5 h-3.5" />;
                              })()}
                              {statusConfig[selectedOrder.status]?.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          Notes Internes
                        </h3>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm italic text-foreground/80 leading-relaxed">
                          "{selectedOrder.notes}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Items & Summary */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary" />
                        Articles Commandés
                      </h3>
                      <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-border/50">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-muted/10 transition-colors">
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="font-bold text-sm truncate">
                                  {item.product_name}
                                  {item.selected_weight && (
                                    <span className="text-xs font-normal text-muted-foreground ml-2">
                                      ({/^\d+(\.\d+)?$/.test(String(item.selected_weight).trim()) ? `${item.selected_weight} g` : item.selected_weight})
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Qté: <span className="font-semibold">{item.quantity}</span> × {item.unit_price} DH
                                </p>
                                {item.selected_flavors && item.selected_flavors.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.selected_flavors.map((flavor, fIdx) => (
                                      <Badge key={fIdx} variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
                                        {flavor}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm">{(item.quantity * item.unit_price).toLocaleString()} DH</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const subtotal = selectedOrder.items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) ?? 0;
                          const deliveryFee = Math.max(0, selectedOrder.total - subtotal);
                          return (
                            <div className="bg-muted/30 p-4 border-t border-border/50 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sous-total</span>
                                <span className="font-medium">{subtotal.toLocaleString()} DH</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Livraison</span>
                                <span className={deliveryFee === 0 ? "font-medium text-green-600" : "font-medium"}>
                                  {deliveryFee === 0 ? "Gratuite" : `${deliveryFee.toLocaleString()} DH`}
                                </span>
                              </div>
                              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                                <span className="font-serif">Total</span>
                                <span className="font-serif text-primary">{selectedOrder.total.toLocaleString()} DH</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Historique de Statut
                      </h3>
                      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted border border-border/50 rounded-xl p-6">
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary border-4 border-background" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Commande Reçue</span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(selectedOrder.created_at), "PPP à HH:mm", { locale: fr })}
                            </span>
                          </div>
                        </div>
                        {selectedOrder.status_history?.map((step, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary border-4 border-background" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{step.label}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(step.date), "PPP à HH:mm", { locale: fr })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center">
                <div className="flex gap-3">
                  <Button variant="outline" className="h-11 px-6 rounded-none gap-2 text-green-600 border-green-200 hover:bg-green-50 shadow-sm" onClick={() => openWhatsApp(selectedOrder)}>
                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                  </Button>
                  {selectedOrder.status === 'delivered' && (
                    <Button variant="outline" className="h-11 px-6 rounded-none gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 shadow-sm" onClick={() => handleSendFeedbackRequest(selectedOrder)}>
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Demander Avis
                    </Button>
                  )}
                  <Button variant="outline" className="h-11 px-6 rounded-none gap-2 shadow-sm" onClick={() => generateInvoice(selectedOrder)}>
                    <FileText className="w-4 h-4" /> Facture PDF
                  </Button>
                </div>
                <Button variant="secondary" className="h-11 px-8 rounded-none shadow-sm" onClick={() => setSelectedOrder(null)}>Fermer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent 
          className="max-w-2xl h-[90vh] p-0 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
            <DialogTitle className="font-serif text-2xl font-bold">Modifier la Commande</DialogTitle>
            <DialogDescription className="sr-only">Formulaire pour modifier les détails de la commande.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleUpdateOrder} className="flex-1 flex flex-col min-h-0 bg-background">
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Customer Info Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Informations de Livraison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Nom Complet</Label>
                      <Input
                        value={editingOrder.customer_name}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Téléphone</Label>
                      <Input
                        value={editingOrder.customer_phone}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customer_phone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Région</Label>
                      <Input
                        value={editingOrder.customer_region || ""}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customer_region: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Ville</Label>
                      <Input
                        value={editingOrder.customer_city}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customer_city: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Statut de la Commande</Label>
                      <Select
                        value={editingOrder.status}
                        onValueChange={(val: DbOrder['status']) => setEditingOrder({ ...editingOrder, status: val })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Adresse complète</Label>
                    <Textarea
                      value={editingOrder.customer_address}
                      onChange={(e) => setEditingOrder({ ...editingOrder, customer_address: e.target.value })}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Modifier les Articles
                    </h3>
                    <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-8 rounded-full gap-2 border-primary/20 hover:bg-primary/5">
                          <PackagePlus className="w-3.5 h-3.5 text-primary" />
                          Ajouter un produit
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[300px]" align="end">
                        <Command>
                          <CommandInput placeholder="Rechercher un produit..." />
                          <CommandList>
                            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                            <CommandGroup heading="Produits disponibles">
                              {allProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => {
                                    const newItems = [...editingOrder.items];
                                    const existingItem = newItems.find(i => i.product_id === product.id);
                                    if (existingItem) {
                                      existingItem.quantity += 1;
                                    } else {
                                      newItems.push({
                                        product_id: product.id,
                                        product_name: product.name,
                                        quantity: 1,
                                        unit_price: product.price,
                                        cost_price: product.cost_price || 0
                                      });
                                    }
                                    setEditingOrder({ ...editingOrder, items: newItems });
                                    setProductSearchOpen(false);
                                    toast({ title: "Produit ajouté", description: product.name });
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.price} DH</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-3 border border-border/50 rounded-xl p-3 bg-muted/5">
                    {editingOrder.items.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed border-border rounded-lg">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">Aucun article dans cette commande</p>
                      </div>
                    ) : (
                      editingOrder.items.map((item, idx) => (
                        <div key={idx} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-xl bg-background hover:border-primary/30 transition-all duration-300 shadow-sm relative overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate">
                                {item.product_name}
                                {item.selected_weight && (
                                  <span className="text-xs font-normal text-muted-foreground ml-2">
                                    ({/^\d+(\.\d+)?$/.test(String(item.selected_weight).trim()) ? `${item.selected_weight} g` : item.selected_weight})
                                  </span>
                                )}
                              </p>
                            </div>
                            {item.selected_flavors && item.selected_flavors.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.selected_flavors.map((flavor, fIdx) => (
                                  <span key={fIdx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                                    {flavor}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center bg-muted/50 rounded-md px-2 py-0.5 border border-border/50">
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => {
                                    const newItems = [...editingOrder.items];
                                    newItems[idx].unit_price = Number(e.target.value);
                                    setEditingOrder({ ...editingOrder, items: newItems });
                                  }}
                                  className="h-6 w-16 p-0 border-none bg-transparent text-xs font-bold text-primary focus-visible:ring-0"
                                />
                                <span className="text-[10px] text-muted-foreground ml-1 uppercase font-bold">DH</span>
                              </div>
                              <span className="text-xs text-muted-foreground">par unité</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-full p-1 px-3 shadow-inner">
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...editingOrder.items];
                                  if (newItems[idx].quantity > 1) {
                                    newItems[idx].quantity -= 1;
                                    setEditingOrder({ ...editingOrder, items: newItems });
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...editingOrder.items];
                                  newItems[idx].quantity += 1;
                                  setEditingOrder({ ...editingOrder, items: newItems });
                                }}
                                className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="w-24 text-right">
                              <p className="text-sm font-bold text-primary">{(item.quantity * item.unit_price).toLocaleString()} DH</p>
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const newItems = editingOrder.items.filter((_, i) => i !== idx);
                                setEditingOrder({ ...editingOrder, items: newItems });
                                toast({ title: "Article supprimé" });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Notes de Gestion (Interne)</Label>
                  <Textarea
                    value={editingOrder.notes || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                    placeholder="Notes sur la livraison, préférences client..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center shrink-0">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Total recalculé</p>
                  <p className="text-2xl font-serif font-bold text-primary">
                    {editingOrder.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()} DH
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="h-11 px-6 rounded-none" onClick={() => setEditingOrder(null)}>Annuler</Button>
                  <Button type="submit" className="h-11 px-8 rounded-none shadow-md">Enregistrer</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!orderToDelete || isBulkDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setOrderToDelete(null);
            setIsBulkDeleting(false);
          }
        }}
      >
        <AlertDialogContent 
          className="rounded-2xl border-destructive/20"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="font-serif text-xl">
              {isBulkDeleting ? `Supprimer ${selectedOrderIds.length} commandes` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {isBulkDeleting
                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedOrderIds.length} commandes ?`
                : "Êtes-vous vraiment sûr de vouloir supprimer cette commande ?"
              } <br />
              <span className="font-semibold text-destructive mt-2 inline-block">Attention : Cette action est irréversible et supprimera toutes les données associées.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-none border-border hover:bg-muted">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-none bg-destructive hover:bg-destructive/90 text-destructive-foreground px-8"
            >
              Supprimer {isBulkDeleting ? `(${selectedOrderIds.length})` : "définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminOrders;

