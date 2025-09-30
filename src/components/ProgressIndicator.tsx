interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export const ProgressIndicator = ({ current, total }: ProgressIndicatorProps) => {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Question {current + 1} sur {total}
          </span>
          <span className="text-xs font-medium text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
