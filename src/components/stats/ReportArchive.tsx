import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, BarChart3, Trophy } from "lucide-react";

interface ReportArchiveProps {
  isOfficial: boolean;
  weeklyArchives: any[];
  monthlyArchives: any[];
  seasonArchives: any[];
  onSelectArchive: (archive: any) => void;
}

export const ReportArchive = ({
  isOfficial,
  weeklyArchives,
  monthlyArchives,
  seasonArchives,
  onSelectArchive,
}: ReportArchiveProps) => {
  if (!isOfficial || (weeklyArchives.length === 0 && monthlyArchives.length === 0 && seasonArchives.length === 0)) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Report Archive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyArchives.length > 0 && (
            <div>
              <h4 className="font-heading text-xs text-primary tracking-wider mb-2">WEEKLY REPORTS</h4>
              <div className="flex flex-wrap gap-3">
                {weeklyArchives.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArchive(a)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow"
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {monthlyArchives.length > 0 && (
            <div>
              <h4 className="font-heading text-xs text-primary tracking-wider mb-2">MONTHLY REPORTS</h4>
              <div className="flex flex-wrap gap-3">
                {monthlyArchives.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArchive(a)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow"
                  >
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {seasonArchives.length > 0 && (
            <div>
              <h4 className="font-heading text-xs text-primary tracking-wider mb-2">SEASON REPORTS</h4>
              <div className="flex flex-wrap gap-3">
                {seasonArchives.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArchive(a)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow"
                  >
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
