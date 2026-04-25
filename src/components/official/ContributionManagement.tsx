import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths } from "@/data/team-data";
import { useTeamData } from "@/contexts/TeamDataContext";

export const ContributionManagement = () => {
  const { members, updateContributionDirect, approveContribution, rejectContribution } = useTeamData();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(contributionMonths[0].key);

  const playerMembers = useMemo(() => 
    members.filter(m => ["player", "captain", "finance", "manager", "coach"].includes(m.role || "")),
    [members]
  );

  const canManage = true;

  const handleUpdate = async (memberId: string, month: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      await updateContributionDirect(memberId, month, newStatus as any);
      toast({ title: "Status Updated", description: `Marked as ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Monthly Contributions
        </CardTitle>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-9 rounded-md border border-input bg-secondary px-3 text-xs">
          {contributionMonths.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[600px] space-y-2">
          <div className="grid grid-cols-[1fr,repeat(1,120px)] gap-4 px-4 py-2 text-[10px] text-muted-foreground uppercase font-heading border-b border-border mb-2">
            <span>Member Name</span>
            <span className="text-center">Payment Status</span>
          </div>
          {playerMembers.map((player) => {
            const status = (player.contributions && player.contributions[selectedMonth]) || "unpaid";
            const isPending = status === "pending";
            const isPaid = status === "paid";

            return (
              <div key={player.id} className="grid grid-cols-[1fr,repeat(1,120px)] gap-4 px-4 py-3 items-center rounded-xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isPaid ? "#22c55e" : isPending ? "#eab308" : "#ef4444" }} />
                  <span className="font-body text-sm font-medium">{player.name}</span>
                </div>
                <div className="flex justify-center">
                  {isPending ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => approveContribution(player.id, selectedMonth)}><CheckCircle className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => rejectContribution(player.id, selectedMonth)}><XCircle className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <Badge variant={isPaid ? "default" : "outline"} 
                           className={cn("cursor-pointer h-7 px-3 capitalize font-body text-[10px]", isPaid ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-red-500/20 text-red-500 border-red-500/30")}
                           onClick={() => canManage && handleUpdate(player.id, selectedMonth, status)}>
                      {status}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
