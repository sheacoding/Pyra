/**
 * Custom SVG Icon component
 * Icons inspired by iconfont.cn style - clean, minimal, consistent stroke width
 */

interface IconProps {
  name: string
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

const icons: Record<string, React.ReactNode> = {
  // Project & Folder
  'plus': (
    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
  ),
  'folder': (
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeWidth="1.5" fill="none"/>
  ),
  'folder-open': (
    <>
      <path d="M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" strokeWidth="1.5" fill="none"/>
      <path d="M3 12h18" strokeWidth="1.5"/>
    </>
  ),
  'folder-plus': (
    <>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeWidth="1.5" fill="none"/>
      <path d="M12 10v6M9 13h6" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'folder-tree': (
    <>
      <path d="M4 6a1 1 0 011-1h3l1.5 1.5H14a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V6z" strokeWidth="1.5" fill="none"/>
      <path d="M8 14.5h8a1 1 0 011 1v3a1 1 0 01-1 1H8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M6 11.5v7" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  // File
  'file-plus': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
      <path d="M12 12v6M9 15h6" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'file-code': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
      <path d="M10 13l-2 2 2 2M14 13l2 2-2 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'save': (
    <>
      <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" strokeWidth="1.5" fill="none"/>
      <path d="M17 3v4H7V3" strokeWidth="1.5" fill="none"/>
      <path d="M7 14h10v7H7v-7z" strokeWidth="1.5" fill="none"/>
    </>
  ),
  // Actions
  'refresh': (
    <>
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 3v5h-5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 21v-5h5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'play': (
    <path d="M6 4l15 8-15 8V4z" strokeWidth="1.5" fill="currentColor" strokeLinejoin="round"/>
  ),
  'stop': (
    <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth="1.5" fill="currentColor"/>
  ),
  'bug': (
    <>
      <circle cx="12" cy="14" r="5" strokeWidth="1.5" fill="none"/>
      <path d="M12 9V5M8 6l-3-2M16 6l3-2" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 12H3M17 12h4" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 17l-3 2M17 17l3 2" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 14h4" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'step': (
    <>
      <path d="M4 19h4v-4H4v4zM10 19h4v-4h-4v4zM16 19h4v-4h-4v4z" strokeWidth="1.5" fill="none"/>
      <path d="M6 15V8l6-4 6 4v7" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'eye': (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" fill="none"/>
    </>
  ),
  // Tools
  'wand': (
    <>
      <path d="M15 4l5 5-11 11H4v-5L15 4z" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M13.5 6.5l4 4" strokeWidth="1.5"/>
    </>
  ),
  'search-code': (
    <>
      <circle cx="10" cy="10" r="6" strokeWidth="1.5" fill="none"/>
      <path d="M14.5 14.5L20 20" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 8l-1.5 2L8 12M12 8l1.5 2-1.5 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  // Panels
  'cubes': (
    <>
      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'gear': (
    <>
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" fill="none"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  // File types for TabsBar
  'python': (
    <>
      <path d="M12 4c-2.5 0-4.5.5-4.5 2v2.5c0 1.5 2 2.5 4.5 2.5s4.5-1 4.5-2.5V6c0-1.5-2-2-4.5-2z" strokeWidth="1.5" fill="none"/>
      <path d="M7.5 8.5V14c0 1.5 2 2.5 4.5 2.5s4.5-1 4.5-2.5V8.5" strokeWidth="1.5" fill="none"/>
      <path d="M12 11v5.5c0 1.5 2 2.5 4.5 2.5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="9.5" cy="6.5" r="0.8" fill="currentColor"/>
      <circle cx="14.5" cy="14.5" r="0.8" fill="currentColor"/>
    </>
  ),
  'javascript': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" fill="none"/>
      <path d="M12 8v6c0 1-1 2-2 2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M15 11c1 0 2 .5 2 1.5s-1 1.5-2 1.5-2 .5-2 1.5 1 1.5 2 1.5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'typescript': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" fill="none"/>
      <path d="M9 11h5M11.5 11v6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 14c0-1.5-1-2.5-2-2.5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'json': (
    <>
      <path d="M8 4c-2 0-3 1-3 3v2c0 2-1 3-2 3 1 0 2 1 2 3v2c0 2 1 3 3 3" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M16 4c2 0 3 1 3 3v2c0 2 1 3 2 3-1 0-2 1-2 3v2c0 2-1 3-3 3" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'markdown': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.5" fill="none"/>
      <path d="M7 15V9l2.5 3L12 9v6M17 12l-2-3h1.5v6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'config': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
      <path d="M8 13h8M8 17h5" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'file': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
    </>
  ),
  // Status indicators
  'close': (
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round"/>
  ),
  'times': (
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round"/>
  ),
  // Additional icons
  'rocket': (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" strokeWidth="1.5" fill="none"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" strokeWidth="1.5" fill="none"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" strokeWidth="1.5" fill="none"/>
    </>
  ),
  'lightbulb': (
    <>
      <path d="M9 18h6M10 22h4" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A5.997 5.997 0 0012 3a6 6 0 00-4.5 9.5c.76.76 1.23 1.52 1.41 2.5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'external-link': (
    <>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M15 3h6v6M10 14L21 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'trash': (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeWidth="1.5" fill="none"/>
      <path d="M10 11v6M14 11v6" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'list': (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4" cy="6" r="1" fill="currentColor"/>
      <circle cx="4" cy="12" r="1" fill="currentColor"/>
      <circle cx="4" cy="18" r="1" fill="currentColor"/>
    </>
  ),
  'sitemap': (
    <>
      <rect x="9" y="2" width="6" height="4" rx="1" strokeWidth="1.5" fill="none"/>
      <rect x="2" y="18" width="6" height="4" rx="1" strokeWidth="1.5" fill="none"/>
      <rect x="9" y="18" width="6" height="4" rx="1" strokeWidth="1.5" fill="none"/>
      <rect x="16" y="18" width="6" height="4" rx="1" strokeWidth="1.5" fill="none"/>
      <path d="M12 6v4M5 18v-4h14v4M12 14v4" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'spinner': (
    <>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'download': (
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M7 10l5 5 5-5M12 15V3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'box': (
    <>
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" strokeWidth="1.5" fill="none"/>
      <path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'search': (
    <>
      <circle cx="11" cy="11" r="7" strokeWidth="1.5" fill="none"/>
      <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'bolt': (
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  ),
  'check': (
    <path d="M5 12l5 5L20 7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'exclamation-triangle': (
    <>
      <path d="M12 2L2 20h20L12 2z" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M12 9v4M12 16v1" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  'server': (
    <>
      <rect x="2" y="3" width="20" height="6" rx="1" strokeWidth="1.5" fill="none"/>
      <rect x="2" y="15" width="20" height="6" rx="1" strokeWidth="1.5" fill="none"/>
      <circle cx="6" cy="6" r="1" fill="currentColor"/>
      <circle cx="6" cy="18" r="1" fill="currentColor"/>
    </>
  ),
  'home': (
    <>
      <path d="M3 12l9-9 9 9" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" strokeWidth="1.5" fill="none"/>
      <path d="M9 20v-6h6v6" strokeWidth="1.5" fill="none"/>
    </>
  ),
  'cog': (
    <>
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" fill="none"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="1.5" fill="none"/>
    </>
  ),
  'chevron-down': (
    <path d="M6 9l6 6 6-6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'chevron-right': (
    <path d="M9 6l6 6-6 6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'info-circle': (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" fill="none"/>
      <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  'cube': (
    <>
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" strokeWidth="1.5" fill="none"/>
      <path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'package': (
    <>
      <path d="M16.5 9.4l-9-5.19" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" strokeWidth="1.5" fill="none"/>
      <path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'list-ul': (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
    </>
  ),
  'arrow-right': (
    <path d="M5 12h14M13 5l7 7-7 7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'arrow-down': (
    <path d="M12 5v14M5 12l7 7 7-7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'arrow-up': (
    <path d="M12 19V5M5 12l7-7 7 7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" fill="none"/>
      <path d="M9 12l2 2 4-4" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'clock': (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" fill="none"/>
      <path d="M12 6v6l4 2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'edit': (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="1.5" fill="none"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="1.5" fill="none"/>
    </>
  ),
  'palette': (
    <>
      <path d="M12 2a10 10 0 00-1.64 19.87 2 2 0 002.28-1.53l.14-.68a2 2 0 012-1.66h.34a2 2 0 002-2V14a10 10 0 00-5.12-12z" strokeWidth="1.5" fill="none"/>
      <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    </>
  ),
  'language': (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" fill="none"/>
      <path d="M2 12h20" strokeWidth="1.5"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth="1.5" fill="none"/>
    </>
  ),
  'undo': (
    <>
      <path d="M3 7v6h6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.219 2.5L3 13" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'clipboard-list': (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeWidth="1.5" fill="none"/>
      <rect x="8" y="2" width="8" height="4" rx="1" strokeWidth="1.5" fill="none"/>
      <path d="M9 14h6M9 18h6M9 10h6" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'xmark': (
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round"/>
  ),
  'html': (
    <>
      <path d="M4 3l1.5 15L12 21l6.5-3L20 3H4z" strokeWidth="1.5" fill="none"/>
      <path d="M7 7h10M7.5 11h9M8 15l4 1 4-1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  'css': (
    <>
      <path d="M4 3l1.5 15L12 21l6.5-3L20 3H4z" strokeWidth="1.5" fill="none"/>
      <path d="M16 7H8l.5 4h6l-.5 4-2 .5-2-.5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'file-lines': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
      <path d="M8 13h8M8 17h5" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'file-alt': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" strokeWidth="1.5" fill="none"/>
      <path d="M14 3v6h6" strokeWidth="1.5" fill="none"/>
      <path d="M8 13h8M8 17h8M8 9h2" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  'tools': (
    <>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'wrench': (
    <>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'sync-alt': (
    <>
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 3v5h-5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 21v-5h5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'code': (
    <>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'js-square': (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" fill="none"/>
      <path d="M12 8v6c0 1-1 2-2 2" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M15 11c1 0 2 .5 2 1.5s-1 1.5-2 1.5-2 .5-2 1.5 1 1.5 2 1.5" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>
  ),
}

export function Icon({ name, size = 16, color, className = '', style = {} }: IconProps) {
  const iconPath = icons[name]

  if (!iconPath) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      className={`icon icon-${name} ${className}`}
      style={style}
    >
      {iconPath}
    </svg>
  )
}

export default Icon
