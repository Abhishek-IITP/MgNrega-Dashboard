"use client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function TrendChart({ data }: { data: any[] }) {
  const order = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
  const idx = (m: string) => {
    const key = (m || '').slice(0,3)
    const i = order.indexOf(key)
    return i === -1 ? 99 : i
  }
  const ordered = [...(data || [])].sort((a,b)=> idx(a.month) - idx(b.month))
  
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl border-2 border-slate-200">
          <p className="font-bold text-slate-900 mb-3 text-base">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold mb-1" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}:</span> {Number(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ordered} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorIndividuals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorHouseholds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} 
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} 
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
              tickLine={{ stroke: '#cbd5e1' }}
              width={70}
            />
            <Tooltip content={customTooltip} />
            <Legend 
              wrapperStyle={{ fontSize: 13, paddingTop: '24px', fontWeight: 600 }}
              iconType="line"
            />
            <Area 
              type="monotone" 
              dataKey="individuals" 
              name="Workers Employed" 
              stroke="#4f46e5" 
              strokeWidth={3}
              fill="url(#colorIndividuals)"
              dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 7, fill: '#4f46e5', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="households" 
              name="Households Benefited" 
              stroke="#10b981" 
              strokeWidth={3}
              fill="url(#colorHouseholds)"
              dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 7, fill: '#10b981', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
