import { TopProduct } from "@/lib/api";
import { Package } from "lucide-react";

export default function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Top Products</h3>
      
      <div className="overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="rounded-l-lg py-3 pl-4 font-medium">Product</th>
              <th className="py-3 text-right font-medium">Units</th>
              <th className="rounded-r-lg py-3 pr-4 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.product_name} className="group transition-colors hover:bg-muted/50">
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                      {p.product_name}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right text-muted-foreground">
                  {p.units_sold.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-card-foreground">
                  ${p.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}