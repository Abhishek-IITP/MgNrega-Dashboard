"use client"
import { useState, useEffect } from "react"

export default function DistrictSelector({ onChange }: { onChange: (state: string, district: string, finYear: string) => void }) {
  const [state, setState] = useState('Jharkhand')
  const [district, setDistrict] = useState('Ranchi')
  const [finYear, setFinYear] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const fy = now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
    return fy;
  })
  const [detectedText, setDetectedText] = useState<string>("")

  const districts = [
    'Ranchi', 'East Singhbhum', 'West Singhbhum', 'Seraikela Kharsawan',
    'Dhanbad', 'Bokaro', 'Hazaribagh', 'Giridih', 'Koderma', 'Chatra',
    'Palamu', 'Garhwa', 'Latehar', 'Lohardaga', 'Gumla', 'Simdega',
    'Khunti', 'Ramgarh', 'Deoghar', 'Dumka', 'Jamtara', 'Godda',
    'Pakur', 'Sahebganj'
  ]

  useEffect(() => {
    onChange(state, district, finYear)
  }, [state, district, finYear])

  async function detectLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation not supported in your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
        const json = await res.json()
        const addr = json.address || {}
        const d = addr.county || addr.district || addr.town || addr.city || district
        setDistrict(d)
        if (addr.state) setState(addr.state)
        setDetectedText(`${d}${addr.state ? `, ${addr.state}` : ''}`)
      } catch (e) {
        console.error(e)
      }
    }, (err) => {
      console.error(err)
    })
  }

  const finYears = (() => {
    const out: string[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentFYEnd = currentMonth >= 3 ? currentYear + 1 : currentYear;
    const maxEndYear = 2026;
    const startEndYear = Math.max(currentFYEnd, maxEndYear);
    
    for (let i = 0; i < 8; i++) {
      const endYear = startEndYear - i;
      if (endYear >= 2020) {
        out.push(`${endYear - 1}-${endYear}`);
      }
    }
    
    return out;
  })();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2.5">State</label>
          <select 
            value={state} 
            onChange={(e) => setState(e.target.value)} 
            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option>Jharkhand</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2.5">District</label>
          <select 
            value={district} 
            onChange={(e) => setDistrict(e.target.value)} 
            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2.5">Financial Year</label>
          <select 
            value={finYear} 
            onChange={(e) => setFinYear(e.target.value)} 
            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            {finYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
        </div>
      </div>

      <div>
        {/* <button 
          onClick={detectLocation} 
          className="w-full sm:w-auto px-8 py-3.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20"
        >
          📍 Auto-detect Location
        </button> */}
      </div>

      {detectedText && (
        <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-800 font-semibold">
            <span className="font-bold">✓ Detected:</span> {detectedText}
          </p>
        </div>
      )}
    </div>
  )
}
