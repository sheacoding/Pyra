import React from 'react'

export interface TabItem {
  path: string
  title?: string
}

interface TabsBarProps {
  tabs: TabItem[]
  activePath: string | null
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export function TabsBar({ tabs, activePath, onSelect, onClose }: TabsBarProps) {
  if (!tabs.length) return null

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b overflow-x-auto" style={{ borderColor: 'var(--ctp-surface1)', backgroundColor: 'var(--ctp-mantle)' }}>
      {tabs.map(tab => {
        const name = tab.title || tab.path.split('\\').pop() || tab.path.split('/').pop() || 'Untitled'
        const isActive = tab.path === activePath
        return (
          <div
            key={tab.path}
            className="flex items-center gap-2 px-3 py-1 text-xs rounded-t cursor-pointer select-none whitespace-nowrap"
            style={{
              backgroundColor: isActive ? 'var(--ctp-surface0)' : 'transparent',
              color: isActive ? 'var(--ctp-text)' : 'var(--ctp-subtext1)',
              borderTop: isActive ? '1px solid var(--ctp-surface1)' : '1px solid transparent',
              borderLeft: isActive ? '1px solid var(--ctp-surface1)' : '1px solid transparent',
              borderRight: isActive ? '1px solid var(--ctp-surface1)' : '1px solid transparent'
            }}
            onClick={() => onSelect(tab.path)}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--ctp-surface0)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
            title={tab.path}
          >
            <span className="truncate max-w-[14rem]">{name}</span>
            <button
              className="ml-1 text-[10px] px-1 py-0.5 rounded"
              onClick={(e) => { e.stopPropagation(); onClose(tab.path) }}
              style={{ color: 'var(--ctp-overlay0)' }}
              title="Close"
            >×</button>
          </div>
        )
      })}
    </div>
  )
}

