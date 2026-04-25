import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { getFullPositionName } from "@/data/team-data";

const PlayerProfile = () => {
  const { id } = useParams();
  const { members, profilePics } = useTeamData();
  const player = members.find((m) => m.id === id);

  if (!player) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground font-body">Player not found.</p>
        </div>
      </Layout>
    );
  }

  const pic = profilePics[player.id];

  return (
    <Layout>
      <Helmet>
        <title>{player.name} | SunCity FC Player Profile</title>
      </Helmet>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="bg-card border-border card-glow overflow-hidden">
          <div className="h-32 bg-primary/20 w-full" />
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col items-center -mt-16 text-center">
              <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                <AvatarFallback className="bg-secondary text-primary font-heading text-3xl">
                  {player.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h1 className="text-2xl font-heading font-bold text-foreground">{player.name}</h1>
                <Badge variant="outline" className="mt-1 border-primary/30 text-primary uppercase tracking-wider font-body">
                  {player.role}
                </Badge>
              </div>
              <p className="mt-4 text-muted-foreground font-body max-w-md mx-auto">
                Official profile of {player.name} at SunCity FC. 
                {player.position && ` Playing as a ${getFullPositionName(player.position)}.`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Squad #</p>
                  <p className="text-xl font-heading text-primary">{player.squadNumber || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Position</p>
                  <p className="text-xl font-heading text-primary">{player.position || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Goals</p>
                  <p className="text-xl font-heading text-primary">{player.goals || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground font-body uppercase">Games</p>
                  <p className="text-xl font-heading text-primary">{player.gamesPlayed || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlayerProfile;
