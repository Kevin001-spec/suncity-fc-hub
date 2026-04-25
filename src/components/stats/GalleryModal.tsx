import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface GalleryModalProps {
  date: string | null;
  mediaByDate: Record<string, any>;
  onClose: () => void;
}

export const GalleryModal = ({ date, mediaByDate, onClose }: GalleryModalProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  if (!date || !mediaByDate[date]) return null;
  const items = mediaByDate[date] as { id: string; url: string; caption?: string }[];

  return (
    <Dialog open={!!date} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">
            {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {items.map((item) => (
              <div key={item.id} className="flex-[0_0_100%] min-w-0 px-1">
                <div className="relative">
                  <img
                    src={item.url}
                    alt={item.caption || "Team photo"}
                    className="w-full h-72 sm:h-96 object-cover rounded-lg"
                  />
                  <a
                    href={item.url}
                    download
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body text-center">Swipe to view all {items.length} photos</p>
      </DialogContent>
    </Dialog>
  );
};
