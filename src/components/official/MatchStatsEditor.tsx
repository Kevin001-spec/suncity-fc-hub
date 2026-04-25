import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamData } from "@/contexts/TeamDataContext";

interface MatchStatsEditorProps {
  gameId: string;
  opponent: string;
  onClose: () => void;
}

const initialHalfStats = { 
  shots: 0, shotsOnTarget: 0, penalties: 0, freekicks: 0, 
  cornerKicks: 0, fouls: 0, offsides: 0, yellowCards: 0, redCards: 0 
};

export const MatchStatsEditor = ({ gameId, opponent, onClose }: MatchStatsEditorProps) => {
  const { saveGameStats } = useTeamData();
  const { toast } = useToast();
  const [firstHalf, setFirstHalf] = useState(initialHalfStats);
  const [secondHalf, setSecondHalf] = useState(initialHalfStats);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveGameStats(gameId, "first", firstHalf),
        saveGameStats(gameId, "second", secondHalf)
      ]);

      toast({ title: "Match Stats Saved", description: `Advanced stats for vs ${opponent} recorded.` });
      onClose();
    } catch (error: any) {
      toast({ title: "Error saving stats", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <Card className="bg-primary/5 border-primary/20 border-2 card-glow mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Advanced Stats: vs {opponent}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <HalfEditor title="1st Half" stats={firstHalf} setStats={setFirstHalf} />
              <HalfEditor title="2nd Half" stats={secondHalf} setStats={setSecondHalf} />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full font-heading h-12 text-lg">
              {isSaving ? "Saving..." : "Save Match Statistics"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

const HalfEditor = ({ title, stats, setStats }: any) => {
  const fields = [
    { key: "shots", label: "Shots" },
    { key: "shotsOnTarget", label: "On Target" },
    { key: "cornerKicks", label: "Corners" },
    { key: "fouls", label: "Fouls" },
    { key: "offsides", label: "Offsides" },
    { key: "yellowCards", label: "Yellows" },
    { key: "redCards", label: "Reds" },
    { key: "penalties", label: "Pens" },
    { key: "freekicks", label: "FKs" },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-heading text-sm text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{title}</h4>
      <div className="grid grid-cols-3 gap-3">
        {fields.map(f => (
          <div key={f.key} className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-body uppercase">{f.label}</label>
            <Input 
              type="number"
              value={stats[f.key]}
              onChange={(e) => setStats((prev: any) => ({ ...prev, [f.key]: parseInt(e.target.value) || 0 }))}
              className="h-8 bg-background border-border text-center font-body"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
