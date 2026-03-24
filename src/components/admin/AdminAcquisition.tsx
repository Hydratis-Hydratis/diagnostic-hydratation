import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

interface AdminAcquisitionProps {
  data: {
    sourceMap: Record<string, number>;
    deviceMap: Record<string, number>;
    pageViews?: {
      viewByUtmSourceMedium?: Record<string, number>;
      conversionRate: number;
    };
  };
}

export function AdminAcquisition({ data }: AdminAcquisitionProps) {
  const sourceData = Object.entries(data.sourceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const deviceData = Object.entries(data.deviceMap).map(([name, value]) => ({ name, value }));

  const utmCombinedData = (() => {
    const smMap = data.pageViews?.viewByUtmSourceMedium || {};
    return Object.entries(smMap)
      .map(([name, value]) => ({ name, vues: value as number }))
      .sort((a, b) => b.vues - a.vues)
      .slice(0, 12);
  })();

  return (
    <div className="space-y-6">
      {/* UTM Source/Medium */}
      {utmCombinedData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Trafic par Source / Medium (UTM)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(240, utmCombinedData.length * 28)}>
              <BarChart data={utmCombinedData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={160} />
                <Tooltip />
                <Bar dataKey="vues" fill="#FF8042" name="Vues" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sources diagnostics */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sources des diagnostics</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Répartition par device</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion rate */}
      {data.pageViews && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Taux de conversion vues → diagnostics : <span className="font-bold text-foreground text-lg">{data.pageViews.conversionRate.toFixed(1)}%</span></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
