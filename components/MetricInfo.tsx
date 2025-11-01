"use client"
import { useState } from "react"

export default function MetricInfo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6">
      <button 
        onClick={()=>setOpen(!open)} 
        className="px-6 py-3 bg-white/70 backdrop-blur-xl border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-white hover:border-indigo-300 transition-all shadow-lg hover:shadow-xl"
      >
        {open? '▼ Hide Definitions' : '▶ What do these mean?'}
      </button>
      {open && (
        <div className="mt-6 bg-white/70 backdrop-blur-xl border-2 border-slate-200 rounded-3xl shadow-xl p-8 lg:p-10">
          <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-3 text-xl">
            <span className="text-3xl">📖</span> Key Metric Definitions
          </h4>
          <ul className="space-y-6 text-sm">
            <li className="flex gap-5">
              <span className="text-2xl text-emerald-600 font-bold">●</span>
              <div>
                <b className="text-slate-900 text-base font-bold block mb-2">Households Worked</b>
                <div className="text-slate-600 leading-relaxed">महीने में काम पाने वाले घरों की संख्या (Number of beneficiary households that worked in this month)</div>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-2xl text-emerald-600 font-bold">●</span>
              <div>
                <b className="text-slate-900 text-base font-bold block mb-2">Individuals Worked</b>
                <div className="text-slate-600 leading-relaxed">महीने में काम पाने वाले लोगों की संख्या (Total number of individuals employed during the month)</div>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-2xl text-amber-600 font-bold">●</span>
              <div>
                <b className="text-slate-900 text-base font-bold block mb-2">Average Wage per Day (₹)</b>
                <div className="text-slate-600 leading-relaxed">एक दिन का औसत मजदूरी दर (Average daily wage rate paid to workers)</div>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-2xl text-amber-600 font-bold">●</span>
              <div>
                <b className="text-slate-900 text-base font-bold block mb-2">Payment Within 15 Days (%)</b>
                <div className="text-slate-600 leading-relaxed">15 दिनों में किए गए भुगतान की प्रतिशता (Percentage of payments generated within 15 days of completion)</div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
