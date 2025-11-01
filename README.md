# MGNREGA Analytics Dashboard

A modern, professional dashboard for real-time MGNREGA employment data analysis and visualization.

## 🎯 Overview

This dashboard provides comprehensive analytics and insights for MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) employment data. It features a beautiful dark-themed interface with real-time data fetching from data.gov.in, advanced visualization, and powerful filtering capabilities.

**Original Code Base**: Migrated and redesigned from [bharatfellowship](../bharatfellowship)
- ✅ Same functionality and data processing
- ✅ Completely redesigned UI (dark theme, modern SaaS style)
- ✅ Enhanced user experience
- ✅ Professional appearance

## ⚡ Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

## 📊 Features

### Dashboard Capabilities
✅ **Real-time Data**: Direct integration with data.gov.in API  
✅ **Advanced Visualization**: 12-month trends with Recharts  
✅ **Multi-view Display**: Card and table views for data  
✅ **District Comparison**: Side-by-side analysis of two regions  
✅ **Pagination**: Browse large datasets efficiently  
✅ **CSV Export**: Download data for external analysis  
✅ **Offline Support**: PWA with service worker caching  

### Smart Data Processing
✅ **Intelligent Caching**: Server-side (1hr) + client-side (24hr)  
✅ **Auto-fallback**: Handles uppercase/mixed-case field names  
✅ **De-duplication**: Automatic aggregation of monthly snapshots  
✅ **Smart Sorting**: Financial-year-aware month ordering (Apr-Mar)  

### User Experience
✅ **Responsive Design**: Mobile-first, works on all devices  
✅ **Dark Theme**: Modern, easy on the eyes  
✅ **Professional UI**: Frosted glass cards, smooth transitions  
✅ **Location Detection**: Auto-select your district  
✅ **Real-time Feedback**: Cache status and data source indicators  

## 🎨 Design Highlights

### Modern Interface
- **Background**: Smooth gradient from slate-900 to purple-900
- **Components**: Frosted glass cards with backdrop blur effect
- **Colors**: Purple primary with blue/cyan/emerald accents
- **Typography**: Clean hierarchy with large, readable fonts
- **Spacing**: Generous padding and breathing room

### Responsive Layouts
```
Mobile (<640px)   → Single column, stacked
Tablet (640-1024) → 2-column grid
Desktop (>1024)   → 3-4 column grid
4K+ (>1536px)     → 5-column grid
```

### Interactive Elements
- Smooth hover transitions on all interactive elements
- Loading animations and states
- Modal dialogs for detailed views
- Form validation and error handling

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── api/
│   │   └── mgnrega/
│   │       └── route.ts           # API endpoint
│   ├── globals.css                # Dark theme CSS
│   ├── layout.tsx                 # Root layout + PWA setup
│   └── page.tsx                   # Main dashboard
│
├── components/
│   ├── DistrictSelector.tsx       # Selection controls
│   ├── MetricCard.tsx             # KPI cards
│   ├── MetricInfo.tsx             # Contextual help
│   └── TrendChart.tsx             # Chart visualization
│
├── lib/
│   ├── cache.ts                   # TTL cache system
│   └── mgnrega.ts                 # API client
│
├── public/
│   ├── data/
│   │   ├── jharkhand_districts.json
│   │   └── uttar_pradesh_districts.json
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
│
├── .env.local                     # API configuration
├── MIGRATION_SUMMARY.md           # Detailed migration info
├── QUICKSTART.md                  # Quick start guide
└── README.md                      # This file
```

## 🔐 Configuration

### Environment Variables (.env.local)
```env
DATA_GOV_API_KEY=your_api_key_here
MGNREGA_RESOURCE_ID=ee03643a-ee4c-48c2-ac30-9f2ff26ab722
NEXT_PUBLIC_DEFAULT_STATE=Jharkhand
```

### Customizable Fields
```env
MGNREGA_FIELD_STATE=state_name
MGNREGA_FIELD_DISTRICT=district_name
MGNREGA_FIELD_MONTH=month
MGNREGA_FIELD_YEAR=fin_year
```

## 📊 Data Metrics

The dashboard displays:
- **Households Worked**: Beneficiary households per month
- **Individuals Worked**: Individual workers employed
- **Average Wage**: Daily wage rate (₹)
- **Payment Timeliness**: % payments within 15 days
- **Total Expenditure**: Total spending
- **Women Workers**: Female beneficiaries
- **Works Status**: Completed vs ongoing projects
- And more...

## 🚀 Technologies Used

| Tech | Version | Purpose |
|------|---------|---------|
| **Next.js** | 16.0.1 | React framework |
| **React** | 19.2.0 | UI library |
| **Recharts** | 2.12.0 | Data visualization |
| **Tailwind CSS** | 4 | Styling |
| **TypeScript** | 5 | Type safety |

## 📱 PWA Features

- **Installable**: Can be installed as app on mobile/desktop
- **Offline Support**: Service worker caches API responses
- **Manifest**: PWA manifest with theme colors
- **Cache Strategy**: Cache-first for API, network-first for pages

## 🔗 Data Source

All data is sourced from **data.gov.in**:
- **Dataset**: MGNREGA State wise, District wise data
- **Resource ID**: ee03643a-ee4c-48c2-ac30-9f2ff26ab722
- **Update Frequency**: Monthly
- **Access**: Public API (requires API key)

## 📚 Documentation

- **QUICKSTART.md** - Get up and running quickly
- **MIGRATION_SUMMARY.md** - Detailed migration information
- **API Documentation**: [data.gov.in](https://data.gov.in)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## 🐛 Troubleshooting

### No data showing?
- Verify `.env.local` has correct API key
- Check district name matches dataset
- Try different financial year
- Check browser console for errors

### Styling issues?
- Clear build cache: `rm -rf .next`
- Rebuild: `npm run build`
- Clear browser cache

### API errors?
- Confirm data.gov.in is accessible
- Verify API key is active on data.gov.in
- Check rate limits

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Other Platforms
1. Build: `npm run build`
2. Set environment variables
3. Start: `npm start`

### Environment Variables (Production)
Add to your hosting platform:
- `DATA_GOV_API_KEY`
- `MGNREGA_RESOURCE_ID`

## 📝 License & Credits

**Migration & Redesign**: Complete modern redesign of bharatfellowship dashboard
- Original functionality preserved
- UI completely redesigned
- Styled with dark theme and frosted glass effects

**Data Source**: data.gov.in (MGNREGA datasets)

## 🤝 Contributing

This is a personal project. For improvements or bug reports, please document them clearly.

## 📞 Support

- **Issue**: Check browser console
- **Data Questions**: Refer to data.gov.in
- **Deployment Help**: Check platform documentation

---

**Built with ❤️ using modern web technologies**

Happy analyzing! 📊✨
