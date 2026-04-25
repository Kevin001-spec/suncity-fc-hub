import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useAuth } from "@/contexts/AuthContext";

export const GalleryManagement = () => {
  const { uploadMediaToStorage } = useTeamData();
  const { profile } = useAuth();
  const { toast } = useToast();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      toast({ title: "Compressing & uploading...", description: `Processing ${files.length} photo(s)...` });
      await uploadMediaToStorage(Array.from(files), profile?.name || "Official");
      toast({ title: "Media Uploaded", description: `${files.length} photo(s) uploaded to gallery.` });
      e.target.value = "";
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Gallery Manager</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div 
          onClick={() => mediaInputRef.current?.click()}
          className="h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-body">Upload Match Photos</p>
          <input ref={mediaInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleMediaUpload} />
        </div>
        <Button variant="outline" className="w-full" onClick={() => {
            toast({ title: "Feature coming soon", description: "Gallery group management is being optimized." });
        }}>
          <FolderOpen className="w-4 h-4 mr-2" /> View Gallery Groups
        </Button>
      </CardContent>
    </Card>
  );
};
