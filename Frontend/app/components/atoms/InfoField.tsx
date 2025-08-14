interface InfoFieldProps {
  label: string;
  value: string;
  className?: string;
}

export function InfoField({ label, value, className = "" }: InfoFieldProps) {
  return (
    <div
      className={`flex justify-between py-2 border-b border-gray-100 ${className}`}
    >
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
