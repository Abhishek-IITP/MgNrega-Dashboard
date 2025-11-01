"use client"
import { useEffect, useState } from "react"
import DistrictSelector from "../components/DistrictSelector"
import MetricCard from "../components/MetricCard"
import TrendChart from "../components/TrendChart"
import MetricInfo from "../components/MetricInfo"

export default function Page() {
  const [state, setState] = useState('Jharkhand')
  const [district, setDistrict] = useState('Ranchi')
  const [finYear, setFinYear] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  })
  const [records, setRecords] = useState<any[]>([])
  const [rawRecords, setRawRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'cards'|'table'>("cards")
  const [compare, setCompare] = useState(false)
  const [districtB, setDistrictB] = useState<string>('Dhanbad')
  const [recordsB, setRecordsB] = useState<any[]>([])
  const [cacheStatus, setCacheStatus] = useState<string>('')
  const [dataCount, setDataCount] = useState<{ received: number; total?: number }>({ received: 0 })
  const [limit, setLimit] = useState<number>(200)
  const [offset, setOffset] = useState<number>(0)
  const [loadingAll, setLoadingAll] = useState<boolean>(false)
  const [kpiRecord, setKpiRecord] = useState<any>({})
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalMonth, setModalMonth] = useState<string>("")
  const [modalFY, setModalFY] = useState<string>("")

  // Current month/year (calendar) and current FY string (Apr–Mar)
  const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const now = new Date()
  const currentMonthShort = monthShort[now.getMonth()]
  const y = now.getFullYear()
  const currentFY = now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`
  const apiPreview = `/api/mgnrega?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&fin_year=${encodeURIComponent(finYear)}&limit=${limit}&offset=${offset}`

  useEffect(() => {
    // Reset counters when FY or selection changes
    setCacheStatus('')
    setDataCount({ received: 0 })
    fetchData(state, district, finYear)
  }, [state, district, finYear, limit, offset])

  // Always fetch KPI for current month/current FY irrespective of FY selection
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/mgnrega?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&fin_year=${encodeURIComponent(currentFY)}&limit=500`)
        const json = await res.json()
        const recs: any[] = json.records || []
        // Filter to current calendar month label (matching first 3 letters)
        const target = recs.filter(r => String(r.month||'').slice(0,3).toLowerCase() === currentMonthShort.toLowerCase())
        const byMonth = new Map<string, any>()
        for (const r of target) {
          const key = `${(r.month||'').trim()}__${(r.fin_year||'').trim()}`
          const current = byMonth.get(key)
          if (!current) byMonth.set(key, r)
          else {
            const score = (x: any) => Number(x.Total_Exp||0)*1000 + Number(x.Total_Individuals_Worked||0)*10 + Number(x.Total_Households_Worked||0)
            if (score(r) > score(current)) byMonth.set(key, r)
          }
        }
        const val = Array.from(byMonth.values())[0] || {}
        setKpiRecord(val)
      } catch {
        setKpiRecord({})
      }
    })()
  }, [state, district])

  useEffect(() => {
    if (compare) fetchDataB(state, districtB, finYear)
  }, [compare, state, districtB, finYear])

  async function fetchData(s: string, d: string, fy: string) {
    const cacheKey = `mgnrega:${s}:${d}:${fy}:${limit}:${offset}`
    // show loader immediately when a new selection is made
    setLoading(true)

    // Check localStorage cache first (fast optimistic render)
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.ts && Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setCacheStatus('Client cache (localStorage)')
          setRecords(parsed.data || [])
          setDataCount({ received: parsed.data?.length || 0, total: parsed.total })
          // Still fetch fresh in background
        }
      }
    } catch {}

    try {
      const res = await fetch(`/api/mgnrega?state=${encodeURIComponent(s)}&district=${encodeURIComponent(d)}&fin_year=${encodeURIComponent(fy)}&limit=${limit}&offset=${offset}`)
      const json = await res.json()
      const source = json.source || 'unknown'
      setCacheStatus(source === 'cache' ? 'Server cache (1hr TTL)' : source === 'cache-stale' ? 'Stale cache (upstream failed)' : 'Fresh from API')
      
      const recs: any[] = json.records || []
      setRawRecords(recs)
      setDataCount({ received: recs.length, total: json.total })
      
      // De-duplicate by month within FY (pick latest snapshot - highest cumulative values)
      const byMonth = new Map<string, any>()
      for (const r of recs) {
        const key = `${(r.month||'').trim()}__${(r.fin_year||'').trim()}`
        const current = byMonth.get(key)
        if (!current) {
          byMonth.set(key, r)
        } else {
          // Score: prefer latest snapshot (highest cumulative totals)
          // These fields typically only increase as data gets updated
          const score = (x: any) =>
            Number(x.Total_Exp||0) * 1000 + // Most important indicator
            Number(x.Total_Individuals_Worked||0) * 10 +
            Number(x.Total_Households_Worked||0) +
            Number(x.Total_No_of_JobCards_issued||0) * 0.01 + // Cumulative total
            Number(x.Total_No_of_Workers||0) * 0.01 // Cumulative total
          if (score(r) > score(current)) byMonth.set(key, r)
        }
      }

      const deduped = Array.from(byMonth.values())

      // Sort month-wise in financial-year order: Apr..Mar
      const order = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
      const idx = (m: string) => {
        const i = order.indexOf((m || '').slice(0,3))
        return i === -1 ? 99 : i
      }
      const sorted = [...deduped].sort((a,b) => idx(a.month) - idx(b.month))
      setRecords(sorted)
      
      // Save to localStorage cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: sorted, total: json.total }))
      } catch {}
    } catch (e) {
      console.error(e)
      // Fallback to localStorage if network fails
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          setRecords(parsed.data || [])
          setCacheStatus('Offline: Using cached data')
        } else {
          setRecords([])
          setCacheStatus('Error: No cache available')
        }
      } catch {
        setRecords([])
        setCacheStatus('Error: Failed to load')
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllPages(s: string, d: string, fy: string) {
    setLoadingAll(true)
    try {
      const pageSize = limit
      let nextOffset = 0
      let total = Infinity as number
      const all: any[] = []
      while (nextOffset < total) {
        const url = `/api/mgnrega?state=${encodeURIComponent(s)}&district=${encodeURIComponent(d)}&fin_year=${encodeURIComponent(fy)}&limit=${pageSize}&offset=${nextOffset}`
        const res = await fetch(url)
        const json = await res.json()
        const recs: any[] = json.records || []
        total = Number(json.total || (nextOffset + recs.length))
        all.push(...recs)
        if (recs.length < pageSize) break
        nextOffset += pageSize
      }

      // Deduplicate and sort (pick latest snapshot)
      const byMonth = new Map<string, any>()
      for (const r of all) {
        const key = `${(r.month||'').trim()}__${(r.fin_year||'').trim()}__${(r.district_name||'').trim()}`
        const current = byMonth.get(key)
        if (!current) {
          byMonth.set(key, r)
        } else {
          // Score: prefer latest snapshot (highest cumulative totals)
          const score = (x: any) =>
            Number(x.Total_Exp||0) * 1000 +
            Number(x.Total_Individuals_Worked||0) * 10 +
            Number(x.Total_Households_Worked||0) +
            Number(x.Total_No_of_JobCards_issued||0) * 0.01 +
            Number(x.Total_No_of_Workers||0) * 0.01
          if (score(r) > score(current)) byMonth.set(key, r)
        }
      }
      const order = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
      const idx = (m: string) => { const i = order.indexOf((m||'').slice(0,3)); return i===-1?99:i }
      const sorted = Array.from(byMonth.values()).sort((a,b)=> idx(a.month)-idx(b.month))
      setRecords(sorted)
      setDataCount({ received: sorted.length, total })
      setCacheStatus('Merged pages')
    } finally {
      setLoadingAll(false)
    }
  }

  async function fetchDataB(s: string, d: string, fy: string) {
    try {
      const res = await fetch(`/api/mgnrega?state=${encodeURIComponent(s)}&district=${encodeURIComponent(d)}&fin_year=${encodeURIComponent(fy)}&limit=100`)
      const json = await res.json()
      const recs: any[] = json.records || []
      const byMonth = new Map<string, any>()
      for (const r of recs) {
        const key = `${(r.month||'').trim()}__${(r.fin_year||'').trim()}`
        if (!byMonth.has(key)) byMonth.set(key, r)
      }
      const order = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
      const idx = (m: string) => { const i = order.indexOf((m||'').slice(0,3)); return i===-1?99:i }
      const sorted = Array.from(byMonth.values()).sort((a,b)=> idx(a.month)-idx(b.month))
      setRecordsB(sorted)
    } catch {
      setRecordsB([])
    }
  }

  // KPI metrics should always show current calendar month of current FY
  const latest = Object.keys(kpiRecord).length ? kpiRecord : (records.length > 0 ? records[records.length - 1] : {})
  const households = latest.Total_Households_Worked || '—'
  const individuals = latest.Total_Individuals_Worked || '—'
  const avgWage = latest.Average_Wage_rate_per_day_per_person || '—'
  const pct15 = latest.percentage_payments_gererated_within_15_days || latest.percentage_payments_generated_within_15_days || '—'

  // build trend for last 12 months (FY-aware), include multiple series
  const trend = records.length > 0 
    ? records.slice(-12).map(r => ({
        month: r.month,
        individuals: Number(r.Total_Individuals_Worked || 0),
        households: Number(r.Total_Households_Worked || 0)
      }))
    : []

  // dynamic table headers from dataset
  const allFields: string[] = records[0] ? Object.keys(records[0]) : []
  const preferredOrder = [
    'month','fin_year','state_name','district_name',
    'Total_Households_Worked','Total_Individuals_Worked',
    'Average_Wage_rate_per_day_per_person','Wages','Total_Exp',
    'Women_Persondays','Number_of_Completed_Works','Number_of_Ongoing_Works',
    'Total_No_of_Active_Workers','Total_No_of_Active_Job_Cards'
  ]
  const orderedFields = allFields.sort((a,b)=>{
    const ia = preferredOrder.indexOf(a); const ib = preferredOrder.indexOf(b)
    return (ia===-1?999:ia) - (ib===-1?999:ib)
  })

  function labelize(key: string){
    return key.replaceAll('_',' ').replace(/\b([a-z])/g,(m)=>m.toUpperCase())
  }

  const displayKeys = orderedFields.slice(0, 14)

  function toNumber(x:any){ const n = Number(x); return Number.isFinite(n)? n : undefined }
  function fmtIN(x:any){ const n = toNumber(x); return n===undefined? String(x ?? '—') : n.toLocaleString('en-IN') }

  function downloadCsv(){
    if(!records.length) return
    const cols = orderedFields
    const head = cols.join(',')
    const lines = records.map(r=> cols.map(k=> JSON.stringify((r?.[k]??'')).replace(/^"|"$/g,'')).join(','))
    const csv = [head, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `mgnrega_${state}_${district}_${finYear}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-100vh max-w-9xl flex items-center justify-center bg-linear-to-b from-blue-50 via-white to-green-50 px-4 mx-auto sm:px-6 lg:px-8 py-8 ">
      {/* Full-page loader overlay when fetching new selection */}
      {loading && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="text-center text-blue-700 p-6 rounded-lg shadow-lg bg-white/80 max-w-md mx-4">
            <div className="flex items-center justify-center gap-4">
              {/* Simple chart/logo SVG */}
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-700">
                <rect x="3" y="10" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.9" />
                <rect x="9" y="6" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.75" />
                <rect x="15" y="3" width="3" height="15" rx="0.5" fill="currentColor" opacity="0.6" />
                <circle cx="19" cy="5" r="1" fill="currentColor" />
              </svg>

              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-block animate-spin text-3xl">⟳</div>
                  <h2 className="text-2xl font-bold">Fetching data for</h2>
                </div>
                <div className="mt-1 text-lg text-blue-800 font-semibold">{district}, {state}</div>
                <div className="text-sm text-gray-600">Financial Year {finYear}</div>
              </div>
            </div>

            {dataCount?.received ? (
              <p className="mt-4 text-sm text-gray-700">Showing cached {dataCount.received} records — updating to latest…</p>
            ) : (
              <p className="mt-4 text-sm text-gray-700">Fetching latest records from API…</p>
            )}
          </div>
        </div>
      )}
      {/* Main Container */}
      <div className="w-full mx-auto max-w-7xl px-6">
      {/* Header Section - Government Official Style */}
      <div className="mb-12 text-center border-b-4 border-blue-700 pb-8">
        <div className="mb-4">
        <div className="text-sm font-semibold text-blue-900 tracking-wider">भारत सरकार | Government of India</div>
        <div className="text-xs text-green-700 mt-1">ग्रामीण विकास मंत्रालय | Ministry of Rural Development</div>
        </div>
        <h1 className="text-5xl font-bold text-blue-900 mb-2 mt-6">MGNREGA</h1>
        <h2 className="text-2xl font-semibold text-green-700 mb-2">महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी योजना</h2>
        <p className="text-lg text-gray-700 mt-4">Employment Guarantee Scheme - District Dashboard</p>
        <div className="flex gap-2 justify-center mt-3 text-sm">
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">✓ Live Data</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">📊 Analytics</span>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">🏘️ Rural Focus</span>
        </div>
      </div>

      {/* Selector Card - Clean Government Style */}
      <div className="bg-white rounded-lg border-l-4 border-blue-700 shadow-md p-8 mb-12 w-full">
        <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">📍</span> Select District & Financial Year
        </h3>
        <DistrictSelector onChange={(s, d, fy) => { setState(s); setDistrict(d); setFinYear(fy); setOffset(0) }} />
        
        {cacheStatus && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <span className="px-4 py-2 rounded-lg bg-green-50 text-green-800 text-sm font-semibold border border-green-300">
            {cacheStatus === 'Server cache (1hr TTL)' ? '✓ Cached' : '✓ Live'}: {cacheStatus}
          </span>
          {dataCount.received > 0 && (
            <span className="px-4 py-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-semibold border border-blue-300">
            📊 {dataCount.received} records{dataCount.total && ` / ${dataCount.total}`}
            </span>
          )}
          <a href={apiPreview} target="_blank" className="px-4 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm font-semibold border border-gray-300 hover:bg-gray-100 transition-colors">
            🔗 API URL
          </a>
          </div>
        </div>
        )}
      </div>

      {/* KPI Section with Large Gaps */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-2">
        <span className="text-3xl">📈</span> Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        <MetricCard icon={<span>👨‍👩‍👧‍👦</span>} accent="emerald" title={`Households — ${currentMonthShort}`} value={formatNumber(households)} note="Beneficiary families" />
        <MetricCard icon={<span>💼</span>} accent="sky" title={`Workers — ${currentMonthShort}`} value={formatNumber(individuals)} note="Employment provided" />
        <MetricCard icon={<span>💰</span>} accent="amber" title={`Avg Daily Wage (₹)`} value={formatNumber(avgWage)} note={`On-time: ${formatNumber(pct15)}%`} />
        <MetricCard icon={<span>📊</span>} accent="rose" title={`FY ${finYear.split('-')[0]}`} value={finYear} note="Selected period" />
        </div>
      </div>

      {/* Help Section */}
      <MetricInfo />

      {/* Trends Chart - Government Style */}
      <div className="mb-14">
        <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-2">
        <span className="text-3xl">📊</span> 12-Month Employment Trend
        </h3>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        {loading ? (
          <div className="text-center py-16 text-blue-600">
          <div className="inline-block animate-spin text-2xl">⟳</div> 
          <p className="mt-3 font-semibold">Loading data...</p>
          </div>
        ) : trend.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
          <p>No trend data available</p>
          </div>
        ) : (
          <TrendChart key={`${state}-${district}-${finYear}`} data={trend} />
        )}
        </div>
      </div>

      {/* Controls Section - Government Style */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button onClick={()=>setView('cards')} className={`px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold transition-all ${view==='cards'?'bg-blue-700 text-white shadow-md':'bg-gray-100 text-blue-700 border border-gray-300 hover:bg-gray-200'}`}>
          📋 Card View
          </button>
          <button onClick={()=>setView('table')} className={`px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold transition-all ${view==='table'?'bg-blue-700 text-white shadow-md':'bg-gray-100 text-blue-700 border border-gray-300 hover:bg-gray-200'}`}>
          📊 Table View
          </button>
        </div>
        <label className="text-gray-700  flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={compare} onChange={(e)=>setCompare(e.target.checked)} className=" px-4 w-6 h-6 py-6  rounded accent-blue-700" />
          Compare with another district
        </label>
        </div>
        {compare && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ComparePicker value={districtB} onChange={setDistrictB} />
        </div>
        )}
      </div>

      {/* Monthly Data Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-18  mb-10">
        <div className="mb-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <span>📅</span> Monthly Records
        </h2>
        <div className="flex flex-wrap items-center gap-8 mb-10">
          <div className="flex items-center gap-3">
          <label className="text-gray-700 text-lg font-semibold">Records per page:</label>
          <select value={limit} onChange={(e)=>{ setOffset(0); setLimit(Number(e.target.value)) }} className="px-8 w-28 h-8 py-6 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:border-gray-400 focus:outline-none focus:border-blue-700">
            {[50,100,200,500].map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
          </div>
          <div className="flex items-center gap-3">
          <label className="text-gray-700 text-lg font-semibold">Offset:</label>
          <input type="number" min={0} value={offset} onChange={(e)=> setOffset(Math.max(0, Number(e.target.value)||0))} className="px-8 w-28 h-8 py-6 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:border-gray-400 focus:outline-none focus:border-blue-700" />
          </div>
          <button disabled={offset===0} onClick={()=> setOffset(Math.max(0, offset - limit))} className="px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">← Previous</button>
          <button disabled={dataCount.total!==undefined && (offset + limit) >= (dataCount.total||0)} onClick={()=> setOffset(offset + limit)} className="px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next →</button>
          <button onClick={()=> fetchAllPages(state, district, finYear)} disabled={loadingAll} className="px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loadingAll? '⟳ Merging…' : '⬇ Fetch All'}
          </button>
          <button onClick={downloadCsv} className="px-8 w-28 h-8 py-6 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors">📥 CSV Export</button>
        </div>
        </div>

        {records.length === 0 && <p className="text-gray-500 text-center py-12 font-medium">No data available</p>}

        {view==='cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-6 mt-10">
          {records.slice(0, 24).map((r,i)=> (
          <button key={i} onClick={()=>{ setModalMonth(r.month); setModalFY(r.fin_year); setModalOpen(true) }} className="text-left bg-linear-to-br from-blue-50 to-white rounded-lg p-6 border-l-4 border-blue-700 shadow-sm hover:shadow-md hover:border-blue-800 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
            <div className="font-bold text-blue-900">{r.month} {r.fin_year}</div>
            <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">{r.district_name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
            {displayKeys.filter(k=>!['month','fin_year','state_name','district_name'].includes(k)).slice(0, 6).map(k=> (
              <div key={k} className="bg-gray-50 rounded px-3 py-2 border border-gray-200">
              <div className="text-xs text-gray-600 font-semibold">{labelize(k).split(' ').slice(0, 2).join(' ')}</div>
              <div className="font-bold text-blue-900 text-sm">{fmtIN(r[k])}</div>
              </div>
            ))}
            </div>
          </button>
          ))}
        </div>
        ) : (
        <div className="overflow-x-auto pt-10">
          <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-blue-50 border-b-2 border-blue-200 sticky top-0">
            <tr>
            {orderedFields.map((k) => (
              <th key={k} className="text-left px-4 py-3 font-bold text-blue-900 whitespace-nowrap">{labelize(k)}</th>
            ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.slice(0, 200).map((r, i) => (
            <tr key={i} className="hover:bg-blue-50 transition-colors">
              {orderedFields.map((k) => (
              <td key={k} className="px-4 py-3 whitespace-nowrap">{fmtIN((r as any)[k])}</td>
              ))}
            </tr>
            ))}
          </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Comparison Section */}
      {compare && (
        <div className="mt-10 bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-2">
          <span>🔄</span> District Comparison
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CompareCard title={`📊 ${district} Employment Trend`} data={records} />
          <CompareCard title={`📊 ${districtB} Employment Trend`} data={recordsB} />
        </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>setModalOpen(false)}>
        <div className="bg-white max-w-5xl w-full rounded-lg shadow-2xl border border-gray-200 p-8 max-h-[80vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-900">📅 Monthly Snapshots</h3>
          <button onClick={()=>setModalOpen(false)} className="px-8 py-6 rounded-lg  text-gray-800 hover:bg-gray-100 transition-colors font-semibold">✕ Close</button>
          </div>
          <MonthSnapshots recs={rawRecords} month={modalMonth} finYear={modalFY} />
        </div>
        </div>
      )}
      </div>
    </main>
  )
}

function formatNumber(x: any) {
  if (x === '—' || x === undefined || x === null) return '—'
  return String(x)
}

function ComparePicker({ value, onChange }: { value: string; onChange: (v: string)=>void }) {
  const [options, setOptions] = useState<string[]>([] as string[])
  useEffect(()=>{
    (async ()=>{
      try {
        const res = await fetch('/data/jharkhand_districts.json')
        const json = await res.json()
        setOptions(json)
      } catch { setOptions([]) }
    })()
  },[])
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)} className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm font-medium hover:border-gray-400 focus:outline-none focus:border-blue-700">
      {options.map((d)=> <option key={d} value={d}>{d}</option>)}
    </select>
  )
}

function CompareCard({ title, data }: { title: string; data: any[] }) {
  const series = data.map(r=> ({
    month: r.month,
    individuals: Number(r.Total_Individuals_Worked || 0),
    households: Number(r.Total_Households_Worked || 0),
  }))
  return (
    <div className="bg-linear-to-br from-blue-50 to-white rounded-lg p-6 border-l-4 border-blue-700 shadow-md">
      <div className="text-sm text-blue-900 mb-6 font-bold uppercase tracking-wide">{title}</div>
      <TrendChart data={series} />
    </div>
  )
}

function MonthSnapshots({ recs, month, finYear }: { recs: any[]; month: string; finYear: string }) {
  const keyMatch = (r:any) => String(r.month||'').slice(0,3).toLowerCase() === String(month||'').slice(0,3).toLowerCase() && String(r.fin_year||'') === String(finYear||'')
  const arr = recs.filter(keyMatch)
  const score = (x: any) => Number(x.Total_Exp||0)*1000 + Number(x.Total_Individuals_Worked||0)*10 + Number(x.Total_Households_Worked||0)
  const sorted = arr.sort((a,b)=> score(a)-score(b))
  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        if (el) {
          // find modal overlay ancestor (the fixed inset-0 backdrop)
          let p: HTMLElement | null = el.parentElement
          while (p && !(p.classList && (p.classList.contains('fixed') || p.classList.contains('inset-0')))) {
            p = p.parentElement as HTMLElement | null
          }
          if (p) {
            p.classList.add('backdrop-blur-sm') // Tailwind backdrop blur
            p.setAttribute('data-mgnrega-modal', '1')
          }
          // disable background scroll
          document.documentElement.classList.add('overflow-hidden')
        } else {
          // cleanup when unmounted
          const overlay = document.querySelector('[data-mgnrega-modal="1"]')
          if (overlay) {
            overlay.classList.remove('backdrop-blur-sm')
            overlay.removeAttribute('data-mgnrega-modal')
          }
          document.documentElement.classList.remove('overflow-hidden')
        }
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-10 max-h-[60vh] overflow-y-auto"
    >
      {sorted.map((r, i) => (
        <div key={i} className="bg-linear-to-br from-blue-50 to-white rounded-lg p-16 border-l-4 ml-5 border-green-700 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between  mb-6 pb-4 h-12  w-78 ml-10 border-b-2 border-gray-200">
            <div className="font-bold text-blue-900 ">Snapshot {i+1}</div>
            <div className="text-xs bg font-semibold text-green-700 bg-green-50 px-3 py-1 rounded">{r.district_name}</div>
          </div>
          <div className="grid grid-cols-2 mt-10 gap-4 min-h-[22vh] bg-green-50  text-sm">
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-1">Households</span><span className="font-bold text-blue-900">{Number(r.Total_Households_Worked||0).toLocaleString('en-IN')}</span></div>
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-1">Workers</span><span className="font-bold text-blue-900">{Number(r.Total_Individuals_Worked||0).toLocaleString('en-IN')}</span></div>
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-1">Avg Wage ₹</span><span className="font-bold text-blue-900">{Number(r.Average_Wage_rate_per_day_per_person||0).toLocaleString('en-IN')}</span></div>
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-1">Total Exp</span><span className="font-bold text-blue-900">{Number(r.Total_Exp||0).toLocaleString('en-IN')}</span></div>
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-1">Done Works</span><span className="font-bold text-blue-900">{Number(r.Number_of_Completed_Works||0).toLocaleString('en-IN')}</span></div>
            <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200"><span className="text-gray-600 text-xs font-semibold block mb-2">Ongoing</span><span className="font-bold text-blue-900">{Number(r.Number_of_Ongoing_Works||0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      ))}
      {sorted.length===0 && <div className="col-span-full text-center py-12 text-gray-500 font-medium">No snapshots found for this month.</div>}
    </div>
  )
}
