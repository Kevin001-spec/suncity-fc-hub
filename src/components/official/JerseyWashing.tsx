import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shirt, CheckCircle2, Clock, Droplets } from "lucide-react";

export const JerseyWashing = () => {
  const [status, setStatus] = useState("In Progress");

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Shirt className="w-5 h-5 text-primary" /> Kit Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Droplets className={`w-6 h-6 text-primary ${status === "In Progress" ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-body uppercase">Current Status</p>
            <h4 className="font-heading text-foreground">{status}</h4>
          </div>
          <Badge variant="outline" className={status === "Clean" ? "border-green-500 text-green-500" : "border-primary text-primary"}>
            {status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground font-body uppercase">Last Washed</p>
            <p className="font-heading text-xs text-foreground mt-1">April 24, 2026</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-secondary/20">
            <p className="text-[10px] text-muted-foreground font-body uppercase">Next Match</p>
            <p className="font-heading text-xs text-foreground mt-1">April 27, 2026</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setStatus("Clean")}
            className="flex-1 py-2 rounded-lg border border-green-500/30 text-green-500 font-heading text-[10px] hover:bg-green-500/5 transition-colors"
          >
            Mark Clean
          </button>
          <button 
            onClick={() => setStatus("In Progress")}
            className="flex-1 py-2 rounded-lg border border-primary/30 text-primary font-heading text-[10px] hover:bg-primary/5 transition-colors"
          >
            Mark Washing
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
