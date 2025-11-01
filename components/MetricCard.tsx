export default function MetricCard({ title, value, note, accent = "emerald", icon }: { title: string; value: string; note?: string; accent?: "emerald" | "sky" | "amber" | "rose"; icon?: React.ReactNode }) {
  const gradients = {
    emerald: "from-emerald-500 to-teal-500",
    sky: "from-blue-500 to-cyan-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  }[accent]
  
  const bgColors = {
    emerald: "bg-emerald-50",
    sky: "bg-blue-50",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
  }[accent]
  
  const textColors = {
    emerald: "text-emerald-700",
    sky: "text-blue-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  }[accent]

  return (
    <div className={`w-full bg-white/90 backdrop-blur-sm rounded-2xl border-2 m-1 border-slate-200 shadow-lg hover:shadow-2xl p-4 hover:scale-[1.02] transition-all duration-200 min-h-[120px] flex flex-col justify-between`}>
      <div className="flex  mb-2">
        <div className="flex-1 items-center justify-center">
          <div className={`inline-flex items-center text-lg gap-2 px-4 py-2 ${bgColors} rounded-xl mb-3`}>
            <div className={`w-2 h-2 rounded-full bg-linear-to-r ${gradients}`}></div>
            <div className={`text-xs font-bold ${textColors} uppercase tracking-wider`}>{title}</div>
          </div>
        </div>
        {icon && <div className="text-lg ml-2 opacity-80">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl text-center font-extrabold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">{value}</div>
        {note && <div className="text-lg text-slate-600 text-center font-medium">{note}</div>}
      </div>
    </div>
  )
}
