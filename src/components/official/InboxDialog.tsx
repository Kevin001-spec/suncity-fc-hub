import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Clock, User } from "lucide-react";

interface InboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InboxDialog = ({ open, onOpenChange }: InboxDialogProps) => {
  const messages = [
    { id: 1, sender: "Coach Fabian", subject: "Training Schedule Change", time: "2h ago", unread: true },
    { id: 2, sender: "Karatina Sports Office", subject: "Match Confirmation: vs Nyeri Allstars", time: "5h ago", unread: false },
    { id: 3, sender: "Team Finance", subject: "Monthly Contribution Report Ready", time: "1d ago", unread: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-heading text-xl text-primary flex items-center gap-2">
            <Mail className="w-5 h-5" /> Communications
          </DialogTitle>
        </DialogHeader>
        <div className="px-2 pb-6 max-h-[400px] overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`p-4 mx-2 rounded-xl border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer group ${msg.unread ? "bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-heading text-foreground">{msg.sender}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {msg.time}
                </span>
              </div>
              <p className={`text-sm font-body truncate ${msg.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {msg.subject}
              </p>
              {msg.unread && (
                <Badge className="mt-2 bg-primary text-[8px] h-4 px-1.5 font-heading">New</Badge>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
