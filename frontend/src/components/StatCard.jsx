const colorMap = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  amber: 'bg-amber-500',
};

export default function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  return (
    <div className={`${colorMap[color]} rounded-xl p-4 text-white flex items-center gap-3 shadow-sm`}>
      <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-white/80">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
