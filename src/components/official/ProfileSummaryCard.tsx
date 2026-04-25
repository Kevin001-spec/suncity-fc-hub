import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Trophy, Mail, Settings, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfileSummaryCard = () => {
  const { profile } = useAuth();
  const { profilePics } = useTeamData();

  if (!profile) return null;
  const pic = profilePics[profile.id];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card border-border card-glow overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent w-full" />
        <CardContent className="relative pt-0 pb-8 px-6 sm:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
            <Avatar className="w-32 h-32 border-4 border-card shadow-2xl">
              {pic && <AvatarImage src={pic} className="aspect-square object-cover" />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-4xl">
                {profile.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-foreground">{profile.name}</h1>
                <Badge className="bg-primary text-primary-foreground font-body uppercase tracking-wider text-[10px] px-3 py-1 w-fit mx-auto md:mx-0">
                  {profile.role}
                </Badge>
              </div>
              <p className="text-muted-foreground font-body mt-2 flex items-center justify-center md:justify-start gap-2">
                <Trophy className="w-4 h-4 text-primary" /> SunCity FC Official Management
              </p>
            </div>
            <div className="flex gap-2 pb-2">
              <Button size="sm" variant="outline" className="font-heading text-xs border-primary/20 hover:bg-primary/5">
                <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Profile
              </Button>
              <Button size="icon" variant="outline" className="h-9 w-9 border-primary/20">
                <Mail className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
