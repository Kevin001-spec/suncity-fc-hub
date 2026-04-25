import { Layout } from "@/components/layout/Layout";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { getFullPositionName } from "@/data/team-data";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Players = () => {
  const { members, profilePics } = useTeamData();
  const navigate = useNavigate();

  const playersOnly = members.filter((m) => 
    m.role === "player" || m.role === "captain" || m.role === "finance"
  );

  return (
    <Layout>
      <Helmet>
        <title>SunCity FC Squad | Meet the Players</title>
      </Helmet>
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold gold-text">Our Squad</h1>
          <p className="text-muted-foreground font-body mt-2">The talent behind SunCity FC's success</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playersOnly.map((player, index) => {
            const pic = profilePics[player.id];
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/player/${player.id}`)}
                className="cursor-pointer"
              >
                <Card className="bg-card border-border hover:border-primary/40 transition-all card-glow h-full overflow-hidden group">
                  <div className="h-24 bg-primary/10 w-full group-hover:bg-primary/20 transition-colors" />
                  <CardContent className="relative pt-0 pb-6 flex flex-col items-center">
                    <Avatar className="w-24 h-24 border-4 border-card -mt-12 shadow-lg group-hover:scale-105 transition-transform">
                      {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                      <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">
                        {player.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-center">
                      <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        {getFullPositionName(player.position)}
                      </p>
                      {player.squadNumber && (
                        <Badge className="mt-3 bg-primary/10 text-primary border-primary/20 font-heading">
                          #{player.squadNumber}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Players;
