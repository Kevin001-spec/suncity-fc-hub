import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Clock } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { type TeamMember } from "@/data/team-data";

export const ContributionManagement = () => {
  const { members } = useTeamData();
  const [selectedMonth, setSelectedMonth] = useState("Jan-2026");

  const paidMembers = members.filter(m => m.contributions[selectedMonth] === "paid");
  const unpaidMembers = members.filter(m => m.contributions[selectedMonth] !== "paid" && m.role !== "fan");

  return (
    <Card className="bg-card border-border card-glow h-full">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" /> Contributions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Jan-2026", "Feb-2026", "Mar-2026"].map(m => (
            <Button
              key={m}
              size="sm"
              variant={selectedMonth === m ? "default" : "outline"}
              onClick={() => setSelectedMonth(m)}
              className="text-xs font-body whitespace-nowrap"
            >
              {m}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-heading text-green-500 uppercase tracking-wider mb-2">Paid ({paidMembers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {paidMembers.map(m => (
                <Badge key={m.id} variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 font-body py-1">
                  {m.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-heading text-destructive uppercase tracking-wider mb-2">Unpaid ({unpaidMembers.length})</h4>
            <div className="flex flex-wrap gap-2">
              {unpaidMembers.map(m => (
                <Badge key={m.id} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 font-body py-1">
                  {m.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
