import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// 4-4-2 formation positions on the pitch (percentage based)
const positions = [
  { id: "gk", label: "GK", x: 50, y: 90 },
  { id: "lb", label: "LB", x: 15, y: 70 },
  { id: "cb1", label: "CB", x: 38, y: 72 },
  { id: "cb2", label: "CB", x: 62, y: 72 },
  { id: "rb", label: "RB", x: 85, y: 70 },
  { id: "lm", label: "LM", x: 15, y: 45 },
  { id: "cm1", label: "CM", x: 38, y: 48 },
  { id: "cm2", label: "CM", x: 62, y: 48 },
  { id: "rm", label: "RM", x: 85, y: 45 },
  { id: "st1", label: "ST", x: 35, y: 22 },
  { id: "st2", label: "ST", x: 65, y: 22 },
];

interface LineupBuilderProps {
  onFirst11Change?: (playerIds: string[]) => void;
}

const LineupBuilder = ({ onFirst11Change }: LineupBuilderProps) => {
  const { members, lineup, updateLineup } = useTeamData();
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  const allPlayers = members.filter((m) => m.role === "player" || m.role === "captain");
  const assignedIds = lineup.filter((p) => p.playerId).map((p) => p.playerId);
  const availablePlayers = allPlayers.filter((p) => !assignedIds.includes(p.id));

  const syncFirst11 = (updatedLineup: typeof lineup) => {
    if (onFirst11Change) {
      const ids = updatedLineup.filter(p => p.playerId).map(p => p.playerId!);
      onFirst11Change(ids);
    }
  };

  const assignPlayer = (posId: string, playerId: string) => {
    const updated = lineup.map((p) =>
      p.positionId === posId ? { ...p, playerId } : p
    );
    updateLineup(updated);
    syncFirst11(updated);
    setSelectedPos(null);
  };

  const removePlayer = (posId: string) => {
    const updated = lineup.map((p) =>
      p.positionId === posId ? { ...p, playerId: null } : p
    );
    updateLineup(updated);
    syncFirst11(updated);
  };

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return null;
    return members.find((m) => m.id === playerId)?.name || playerId;
  };

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground">⚽ 3D Lineup Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full mx-auto rounded-xl overflow-hidden border-2 border-green-800"
          style={{
            aspectRatio: "3/4",
            maxWidth: 500,
            background: "linear-gradient(180deg, hsl(120 40% 22%) 0%, hsl(120 45% 28%) 50%, hsl(120 40% 22%) 100%)",
            perspective: "800px",
          }}
        >
          {/* Field markings */}
          <div className="absolute inset-0" style={{ transform: "rotateX(15deg)", transformOrigin: "bottom center" }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30" />
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/30" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-20 border-2 border-t-0 border-white/30 rounded-b-lg" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-8 border-2 border-t-0 border-white/30 rounded-b-lg" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-20 border-2 border-b-0 border-white/30 rounded-t-lg" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-8 border-2 border-b-0 border-white/30 rounded-t-lg" />
            {[20, 40, 60, 80].map((pct) => (
              <div key={pct} className="absolute left-0 right-0 h-0.5 bg-white/5" style={{ top: `${pct}%` }} />
            ))}
          </div>

          {/* Position markers */}
          {positions.map((pos) => {
            const lineupPos = lineup.find((l) => l.positionId === pos.id);
            const playerName = getPlayerName(lineupPos?.playerId || null);
            const isSelected = selectedPos === pos.id;

            return (
              <motion.button
                key={pos.id}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPos(isSelected ? null : pos.id)}
                className={`absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${isSelected ? "ring-2 ring-primary rounded-lg" : ""}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-heading shadow-lg ${
                  playerName
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/20 text-white border border-white/40"
                }`}>
                  {playerName ? playerName.slice(0, 2).toUpperCase() : pos.label}
                </div>
                {playerName && (
                  <span className="text-[10px] font-body text-white bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {playerName}
                  </span>
                )}
                {!playerName && (
                  <span className="text-[9px] font-body text-white/60">{pos.label}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Player selector popup */}
        <AnimatePresence>
          {selectedPos && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 bg-secondary rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading text-xs text-primary">
                  {lineup.find(l => l.positionId === selectedPos)?.playerId
                    ? `Replace ${getPlayerName(lineup.find(l => l.positionId === selectedPos)?.playerId || null)}`
                    : `Select player for ${positions.find(p => p.id === selectedPos)?.label}`}
                </p>
                <div className="flex gap-1">
                  {lineup.find(l => l.positionId === selectedPos)?.playerId && (
                    <Button size="sm" variant="ghost" onClick={() => { removePlayer(selectedPos); setSelectedPos(null); }} className="text-destructive text-xs h-7">
                      <X className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedPos(null)} className="text-muted-foreground h-7">
                    Cancel
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 max-h-40 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => assignPlayer(selectedPos, player.id)}
                    className="text-xs font-body text-foreground bg-card hover:bg-primary/10 border border-border rounded px-2 py-1.5 text-left truncate transition-colors"
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default LineupBuilder;
