import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, Plus, Trash2, Calendar as CalendarIcon, Download, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { contributionMonths } from "@/data/team-data";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { exportFinancialPdf } from "@/lib/financial-export";

export const FinanceManagement = () => {
  const { 
    financialRecords, addFinancialTransaction, members, 
    contribEvents, setContribEvents, contribPayments, 
    toggleContribPayment, deleteContribEvent 
  } = useTeamData();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [finType, setFinType] = useState<"in" | "out">("in");
  const [finMonth, setFinMonth] = useState(contributionMonths[0].label);
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finDate, setFinDate] = useState<Date>();

  const [ceTitle, setCeTitle] = useState("");
  const [ceDesc, setCeDesc] = useState("");
  const [ceTarget, setCeTarget] = useState("");
  const [ceAmountPer, setCeAmountPer] = useState("");

  const handleRecordTransaction = async () => {
    if (!finAmount || !finDesc || !finDate) return;
    try {
      await addFinancialTransaction(finMonth, finDesc, parseInt(finAmount), format(finDate, "MMM d"), finType);
      toast({ title: "Transaction Recorded", description: `${finType === "in" ? "Income" : "Expense"}: KSh ${finAmount}` });
      setFinAmount(""); setFinDesc(""); setFinDate(undefined);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddContribEvent = async () => {
    if (!ceTitle || !ceAmountPer || !ceTarget || !user) return;
    try {
      const { data, error } = await supabase.from("contribution_events").insert({
        title: ceTitle, goal_description: ceDesc,
        target_amount: parseInt(ceTarget), amount_per_person: parseInt(ceAmountPer),
        creator_id: user.id
      } as any).select().single();
      
      if (error) throw error;
      if (data) {
        setContribEvents(prev => [data, ...prev]);
        toast({ title: "Contribution Event Created", description: ceTitle });
      }
      setCeTitle(""); setCeDesc(""); setCeAmountPer(""); setCeTarget("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleExport = () => {
    exportFinancialPdf(financialRecords);
    toast({ title: "Export Started", description: "Your financial report is being generated." });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Treasury Dashboard */}
        <Card className="bg-card border-border card-glow border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Treasury Dashboard
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> PDF Report</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase mb-1">Total Treasury</p>
                <p className="text-2xl font-heading text-primary">KSh {financialRecords.reduce((sum, r) => sum + r.closingBalance, 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase mb-1">Contributors</p>
                <p className="text-2xl font-heading text-foreground">{members.filter(m => m.contributions && Object.values(m.contributions).includes("paid")).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Record Transaction */}
        <Card className="bg-card border-border card-glow">
          <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Record Transaction</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={finType === "in" ? "default" : "outline"} onClick={() => setFinType("in")} className="flex-1 text-xs">Income</Button>
              <Button variant={finType === "out" ? "default" : "outline"} onClick={() => setFinType("out")} className="flex-1 text-xs">Expense</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={finMonth} onChange={(e) => setFinMonth(e.target.value)} className="h-10 rounded-md border border-input bg-secondary px-3 text-sm">
                {contributionMonths.map(m => <option key={m.key} value={m.label}>{m.label}</option>)}
              </select>
              <Input placeholder="Amount (KSh)" type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Input placeholder="Description" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="bg-secondary border-border" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !finDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" /> {finDate ? format(finDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={finDate} onSelect={setFinDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Button onClick={handleRecordTransaction} className="w-full font-heading">Record Transaction</Button>
          </CardContent>
        </Card>
      </div>

      {/* Contribution Events */}
      <Card className="bg-card border-border card-glow">
        <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Project & Contribution Events</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border">
            <p className="text-xs font-heading text-primary uppercase">Create New Event</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Event Title" value={ceTitle} onChange={(e) => setCeTitle(e.target.value)} className="bg-secondary" />
              <Input placeholder="Target (KSh)" type="number" value={ceTarget} onChange={(e) => setCeTarget(e.target.value)} className="bg-secondary" />
              <Input placeholder="Amount Per Person" type="number" value={ceAmountPer} onChange={(e) => setCeAmountPer(e.target.value)} className="bg-secondary" />
              <Input placeholder="Description" value={ceDesc} onChange={(e) => setCeDesc(e.target.value)} className="bg-secondary" />
            </div>
            <Button onClick={handleAddContribEvent} className="w-full h-11 font-heading"><Plus className="w-4 h-4 mr-2" /> Initialize Event</Button>
          </div>

          <div className="grid gap-4">
            {contribEvents.map(event => (
              <div key={event.id} className="p-4 rounded-xl border border-border bg-secondary/10 space-y-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-heading text-base text-foreground">{event.title}</h4>
                    <p className="text-xs text-muted-foreground font-body">{event.goal_description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteContribEvent(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-background/50 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Target</p>
                    <p className="font-heading text-primary">KSh {event.target_amount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Per Person</p>
                    <p className="font-heading text-foreground">KSh {event.amount_per_person.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-heading text-muted-foreground uppercase">Player Contributions</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {members.filter(m => m.role === "player").map(player => {
                      const paid = contribPayments.some(p => p.event_id === event.id && p.member_id === player.id && p.paid);
                      return (
                        <div key={player.id} className={cn("p-2 rounded-lg border text-[10px] flex items-center justify-between cursor-pointer transition-all", paid ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")}
                             onClick={() => toggleContribPayment(event.id, player.id)}>
                          <span className="truncate mr-1">{player.name}</span>
                          {paid ? <CheckCircle className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
