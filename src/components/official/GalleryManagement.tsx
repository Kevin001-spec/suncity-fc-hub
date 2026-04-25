import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const GalleryManagement = () => {
  const { mediaItems } = useTeamData();

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" /> Gallery
        </CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Media
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mediaItems.slice(0, 4).map((item) => (
            <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="destructive" className="h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {mediaItems.length > 4 && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-body">+{mediaItems.length - 4} more</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
