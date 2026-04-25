import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, History } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const FinanceManagement = () => {
  const { financialRecords } = useTeamData();
  const latest = financialRecords[0];

  if (!latest) return null;

  const totalExpenses = latest.expenses.reduce((sum, e: any) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border card-glow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Balance</p>
                <p className="text-xl font-heading text-foreground">KSh {latest.closingBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border card-glow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Income</p>
                <p className="text-xl font-heading text-green-600">KSh {latest.contributions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border card-glow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase">Expenses</p>
                <p className="text-xl font-heading text-destructive">KSh {totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {latest.expenses.map((exp: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/5 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-destructive/70" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-foreground text-sm">{exp.description}</p>
                    <p className="text-xs text-muted-foreground font-body">{exp.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading text-destructive">-KSh {exp.amount.toLocaleString()}</p>
                  <Badge variant="outline" className="text-[10px] uppercase font-body opacity-60">Expense</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
