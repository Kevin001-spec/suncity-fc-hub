import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BarChart3, Calendar, Trophy } from "lucide-react";

interface StatsOverviewCardsProps {
  weeklyArchivesCount: number;
  seasonConfig: any;
  setOverviewDialog: (dialog: string) => void;
}

export const StatsOverviewCards = ({
  weeklyArchivesCount,
  seasonConfig,
  setOverviewDialog,
}: StatsOverviewCardsProps) => {
  const dayOfWeek = new Date().getDay();
  const isWeekendWindow = dayOfWeek >= 5 || dayOfWeek === 0;
  const canOpenMonthly = weeklyArchivesCount >= 3;
  const canOpenSeason = seasonConfig && new Date(seasonConfig.end_date) <= new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Overview Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Weekly */}
            <button
              onClick={() => (isWeekendWindow ? setOverviewDialog("weekly") : null)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isWeekendWindow
                  ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow"
                  : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
              }`}
            >
              <Calendar className="w-8 h-8 text-primary" />
              <span className="text-xs font-heading text-primary">WEEKLY</span>
              <span className="text-[10px] text-muted-foreground font-body">{isWeekendWindow ? "Available now" : "Opens Fri-Sun"}</span>
            </button>
            {/* Monthly */}
            <button
              onClick={() => (canOpenMonthly ? setOverviewDialog("monthly") : null)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                canOpenMonthly
                  ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow"
                  : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
              }`}
            >
              <BarChart3 className="w-8 h-8 text-primary" />
              <span className="text-xs font-heading text-primary">MONTHLY</span>
              <span className="text-[10px] text-muted-foreground font-body">{canOpenMonthly ? "Available" : `${weeklyArchivesCount}/3 weeks`}</span>
            </button>
            {/* Season */}
            <button
              onClick={() => (canOpenSeason ? setOverviewDialog("season") : null)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                canOpenSeason
                  ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow"
                  : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
              }`}
            >
              <Trophy className="w-8 h-8 text-primary" />
              <span className="text-xs font-heading text-primary">SEASON</span>
              <span className="text-[10px] text-muted-foreground font-body">{canOpenSeason ? "Available" : seasonConfig ? `Ends ${seasonConfig.end_date}` : "Not set"}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
