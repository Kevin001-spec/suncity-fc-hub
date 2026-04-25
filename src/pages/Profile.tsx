import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Helmet } from "react-helmet-async";

const Profile = () => {
  const { user, profile } = useAuth();
  const { profilePics } = useTeamData();

  if (!user || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground font-body">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  const pic = profilePics[profile.id];

  return (
    <Layout>
      <Helmet>
        <title>{profile.name} | SunCity FC Profile</title>
      </Helmet>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="bg-card border-border card-glow overflow-hidden">
          <div className="h-32 bg-primary/20 w-full" />
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col items-center -mt-16 text-center">
              <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                <AvatarFallback className="bg-secondary text-primary font-heading text-3xl">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h1 className="text-2xl font-heading font-bold text-foreground">{profile.name}</h1>
                <Badge variant="outline" className="mt-1 border-primary/30 text-primary uppercase tracking-wider font-body">
                  {profile.role}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Squad #</p>
                  <p className="text-xl font-heading text-primary">{profile.squadNumber || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Position</p>
                  <p className="text-xl font-heading text-primary">{profile.position || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Goals</p>
                  <p className="text-xl font-heading text-primary">{profile.goals || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Games</p>
                  <p className="text-xl font-heading text-primary">{profile.gamesPlayed || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
