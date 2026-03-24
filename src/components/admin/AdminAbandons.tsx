import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#FF8042", "#8884d8"];

interface AdminAbandonsProps {
  data: {
    abandonMap?: Record<string, number>;
    abandonByQuestion?: Record<string, number>;
    questionLabels?: Record<string, string>;
  };
}

export function AdminAbandons({ data }: AdminAbandonsProps) {
  const stepOrder = ["Profil", "Activité physique", "Santé & Conditions", "Habitudes", "Coordonnées"];
  const abandonData = stepOrder.map(s => ({ name: s, value: data.abandonMap?.[s] || 0 }));
  const totalAbandonsScreen = abandonData.reduce((a, b) => a + b.value, 0);

  const questionOrder = [
    "sexe", "situation_particuliere", "age", "taille_cm", "poids_kg",
    "temperature_ext", "sport_pratique", "metier_physique",
    "sports_selectionnes", "frequence", "duree_minutes", "transpiration",
    "crampes", "courbatures", "urine_couleur",
    "boissons_journalieres", "firstName", "email"
  ];

  const abandonByQuestionData = (() => {
    if (!data.abandonByQuestion || !data.questionLabels) return [];
    return questionOrder.map(q => ({
      name: data.questionLabels![q] || q,
      value: data.abandonByQuestion![q] || 0,
    }));
  })();

  const totalAbandonsQuestion = abandonByQuestionData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6">
      {/* Abandons par question */}
      {abandonByQuestionData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Abandons par question ({totalAbandonsQuestion} abandons)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, abandonByQuestionData.length * 28)}>
              <BarChart data={abandonByQuestionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[1]} name="Abandons" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
