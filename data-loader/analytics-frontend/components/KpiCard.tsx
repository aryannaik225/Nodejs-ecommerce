import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function KpiCard({ title, value, icon: Icon, trend, trendUp }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-card-foreground">{value}</h3>
        {trend && (
          <span className={`flex items-center text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trendUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}