import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Minus, TrendingDown, Info } from "lucide-react";

export const LeagueStandings = () => {
  const standings = [
    { pos: 1, team: "SunCity FC", mp: 12, w: 9, d: 2, l: 1, gf: 28, ga: 10, gd: 18, pts: 29, form: ["W", "W", "W", "D", "W"] },
    { pos: 2, team: "Karatina United", mp: 12, w: 8, d: 3, l: 1, gf: 24, ga: 12, gd: 12, pts: 27, form: ["W", "D", "W", "W", "L"] },
    { pos: 3, team: "Nyeri Stars", mp: 12, w: 7, d: 2, l: 3, gf: 21, ga: 15, gd: 6, pts: 23, form: ["L", "W", "W", "L", "W"] },
    { pos: 4, team: "Mount Kenya FC", mp: 12, w: 6, d: 4, l: 2, gf: 19, ga: 14, gd: 5, pts: 22, form: ["D", "W", "D", "W", "D"] },
  ];

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> League Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2">Pos</th>
                <th className="text-left py-2">Team</th>
                <th className="text-center py-2">MP</th>
                <th className="text-center py-2">GD</th>
                <th className="text-right py-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.team} className={`border-b border-border last:border-0 ${row.team === "SunCity FC" ? "bg-primary/10" : ""}`}>
                  <td className={`py-3 font-heading ${i === 0 ? "text-primary" : "text-foreground"}`}>{row.pos}</td>
                  <td className="py-3 font-medium text-foreground">{row.team}</td>
                  <td className="py-3 text-center text-muted-foreground">{row.mp}</td>
                  <td className="py-3 text-center text-muted-foreground">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td className="py-3 text-right font-heading text-primary">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground font-body">
          <p className="flex items-center gap-1"><Info className="w-3 h-3" /> Regional League East</p>
          <p>Updated: 2h ago</p>
        </div>
      </CardContent>
    </Card>
  );
};
