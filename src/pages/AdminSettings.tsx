import { useState, useEffect } from "react";
import { useBanner, useUpdateBanner, BannerSettings } from "@/hooks/useBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Layout, Type, Palette, MoveHorizontal, AlertTriangle, Truck, ChevronDown, ChevronUp } from "lucide-react";

const AdminSettings = () => {
  const { data: banner, isLoading } = useBanner();
  const updateBanner = useUpdateBanner();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<Partial<BannerSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(true);
  const [isShippingOpen, setIsShippingOpen] = useState(true);

  useEffect(() => {
    if (banner) {
      setSettings(banner);
    }
  }, [banner]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBanner.mutateAsync(settings);
      toast({ title: "Paramètres enregistrés" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les paramètres.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto py-4 sm:py-8 px-2 sm:px-4 space-y-6 sm:space-y-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6 w-full">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1">Paramètres du site</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gérez l'apparence et les messages globaux de votre boutique.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="gap-2 px-6 sm:px-8 h-10 sm:h-11 shrink-0 btn-premium w-full sm:w-auto"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden w-full">
        <CardHeader 
          className="bg-muted/30 border-b border-border/50 cursor-pointer select-none transition-colors hover:bg-muted/50 p-4 sm:p-6"
          onClick={() => setIsBannerOpen(!isBannerOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary shrink-0" />
              <CardTitle className="font-serif text-lg sm:text-xl">Barre d'annonce</CardTitle>
            </div>
            {isBannerOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground/70 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground/70 shrink-0" />
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">Configurez le message qui s'affiche tout en haut du site.</CardDescription>
        </CardHeader>
        {isBannerOpen && (
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted/20 rounded-lg border border-border/50">
              <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                <label className="text-xs sm:text-sm font-medium">Activer la barre</label>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Afficher ou masquer la barre d'annonce pour les clients.</p>
              </div>
              <Switch 
                checked={settings.enabled || false} 
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })} 
                className="shrink-0"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  Message de la barre
                </label>
                <Input 
                  value={settings.message || ""} 
                  onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                  placeholder="Ex: Livraison gratuite partout au Maroc ! 🚚"
                  className="h-10 text-xs sm:text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    Couleur du texte
                  </label>
                  <div className="flex items-center gap-3 w-full">
                    <input 
                      type="color"
                      value={settings.text_color || "#FFFFFF"} 
                      onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                      className="w-10 h-10 rounded border border-border shadow-sm shrink-0 cursor-pointer p-0 bg-transparent" 
                    />
                    <Input 
                      value={settings.text_color || "#FFFFFF"} 
                      onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                      placeholder="#FFFFFF"
                      className="font-mono uppercase h-10 text-xs sm:text-sm flex-1 min-w-0 w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <MoveHorizontal className="w-4 h-4 text-muted-foreground" />
                    Animation de défilement
                  </label>
                  <div className="flex items-center gap-3 min-h-10 p-3 bg-muted/20 rounded border border-border/50 w-full">
                    <Switch 
                      checked={settings.scrolling_enabled || false} 
                      onCheckedChange={(checked) => setSettings({ ...settings, scrolling_enabled: checked })} 
                      className="shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-snug flex-1 min-w-0">
                      {settings.scrolling_enabled ? "Activée (Défilement)" : "Désactivée (Fixe)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-muted/20 rounded-lg border border-border/50 space-y-3">
              <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary">Aperçu en direct</h3>
              <div 
                className="py-2 overflow-hidden border border-primary/20 text-center rounded bg-primary"
                style={{ color: settings.text_color }}
              >
                {settings.scrolling_enabled ? (
                  <div className="flex whitespace-nowrap animate-scroll">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] px-8">
                        {settings.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] px-4">
                    {settings.message}
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        )}
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader 
          className="bg-muted/30 border-b border-border/50 cursor-pointer select-none transition-colors hover:bg-muted/50 p-4 sm:p-6"
          onClick={() => setIsShippingOpen(!isShippingOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary shrink-0" />
              <CardTitle className="font-serif text-lg sm:text-xl">Livraison Gratuite</CardTitle>
            </div>
            {isShippingOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground/70 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground/70 shrink-0" />
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">Configurez le montant minimum d'achat pour lequel la livraison devient gratuite.</CardDescription>
        </CardHeader>
        {isShippingOpen && (
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Seuil de livraison gratuite (DH)</label>
              <div className="w-full sm:max-w-[240px]">
                <Input 
                  type="number"
                  value={settings.free_shipping_threshold !== undefined && settings.free_shipping_threshold !== null ? settings.free_shipping_threshold : ""} 
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Ex: 500"
                  className="h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden border-destructive/20">
        <CardHeader 
          className="bg-destructive/5 border-b border-destructive/10 cursor-pointer select-none transition-colors hover:bg-destructive/10 p-4 sm:p-6"
          onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <CardTitle className="font-serif text-lg sm:text-xl text-destructive">Mode Maintenance</CardTitle>
            </div>
            {isMaintenanceOpen ? (
              <ChevronUp className="w-5 h-5 text-destructive/70 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-destructive/70 shrink-0" />
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">Activer le mode maintenance rendra le site inaccessible pour les clients.</CardDescription>
        </CardHeader>
        {isMaintenanceOpen && (
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-muted/20 rounded-lg border border-border/50">
              <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                <label className="text-xs sm:text-sm font-medium">Activer la maintenance</label>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">Bloque l'accès au site client et affiche la page de maintenance.</p>
              </div>
              <Switch 
                checked={settings.maintenance_mode || false} 
                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })} 
                className="shrink-0"
              />
            </div>

          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AdminSettings;
