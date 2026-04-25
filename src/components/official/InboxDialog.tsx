import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Send, User } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const InboxDialog = () => {
  const { messages, members, markMessageRead } = useTeamData();
  const { profile } = useAuth();
  
  const myMessages = messages.filter(m => m.toId === profile?.id || m.fromId === profile?.id);
  const unreadCount = messages.filter(m => m.toId === profile?.id && !m.read).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative group overflow-hidden">
          <Inbox className="w-4 h-4 mr-2" /> 
          <span className="font-heading text-xs">Official Inbox</span>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary animate-bounce">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" /> Management Inbox
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-3 mt-4 pr-2 custom-scrollbar">
          {myMessages.length === 0 ? (
            <div className="text-center py-12 opacity-40 font-body">No secure messages yet.</div>
          ) : (
            myMessages.map(msg => {
              const isFromMe = msg.fromId === profile?.id;
              const otherParty = members.find(m => m.id === (isFromMe ? msg.toId : msg.fromId));
              
              return (
                <div 
                  key={msg.id} 
                  className={`p-4 rounded-2xl border transition-all ${!msg.read && !isFromMe ? "bg-primary/5 border-primary/30" : "bg-secondary/10 border-border"}`}
                  onClick={() => !msg.read && !isFromMe && markMessageRead(msg.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-heading text-primary">{otherParty?.name || "Official"}</span>
                      {isFromMe && <Badge variant="outline" className="text-[8px] h-4">SENT</Badge>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-sm font-body text-foreground leading-relaxed">{msg.content}</p>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Button className="w-full font-heading" variant="secondary">
            <Send className="w-4 h-4 mr-2" /> Create New Announcement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
