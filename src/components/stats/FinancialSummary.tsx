import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Download } from "lucide-react";

interface FinancialSummaryProps {
  financialRecords: any[];
  isOfficial: boolean;
  exportFinancialPdf: () => void;
}

export const FinancialSummary = ({ financialRecords, isOfficial, exportFinancialPdf }: FinancialSummaryProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Financial Summary
          </CardTitle>
          {isOfficial && (
            <Button size="sm" variant="outline" onClick={exportFinancialPdf} className="font-body text-xs border-primary/30 text-primary">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {financialRecords.map((f) => {
            const totalExpenses = f.expenses.reduce((sum, e: any) => sum + e.amount, 0);
            return (
              <div key={f.month} className="border border-border rounded-lg p-4 navy-accent">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading text-sm text-primary">{f.month}</h4>
                  <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">
                    {f.contributors} contributors
                  </Badge>
                </div>
                {f.contributorNote && <p className="text-xs text-muted-foreground font-body mb-2 italic">{f.contributorNote}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Opening</p>
                    <p className="text-foreground">KSh {f.openingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contributions</p>
                    <p className="text-green-600">+KSh {f.contributions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="text-destructive">-KSh {totalExpenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Closing</p>
                    <p className={f.closingBalance >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                      KSh {f.closingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                {f.expenses.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border">
                    {f.expenses.map((exp: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground py-0.5">
                        <span>
                          {exp.date} — {exp.description}
                        </span>
                        <span className="text-destructive/70">-KSh {exp.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
