import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { InboxDialog } from "./InboxDialog";

export const ProfileSummaryCard = () => {
  const { profile } = useAuth();

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <Card className="bg-card/80 backdrop-blur-xl border-border/50 relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20 p-1 bg-background">
                <AvatarImage src={profile?.profile_pic} className="rounded-full object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-heading text-2xl">
                  {profile?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-background p-1.5 rounded-full border border-border">
                <Shield className="w-4 h-4 text-primary fill-primary/10" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
                  Welcome back, {profile?.name}
                </h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 animate-pulse font-heading text-[10px] uppercase tracking-widest">
                  {profile?.role} Access
                </Badge>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground font-body">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>Joined {new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary/60" />
                  <span className="capitalize">{profile?.role} Authority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary/60" />
                  <span>Nairobi, Kenya</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <InboxDialog />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
