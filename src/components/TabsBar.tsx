// No explicit React import needed with React 17+ JSX transform
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'

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

// Get file icon based on extension
function getFileIcon(fileName: string): { icon: string; color: string } {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'py':
      return { icon: 'python', color: 'var(--ctp-yellow)' }
    case 'js':
      return { icon: 'javascript', color: 'var(--ctp-yellow)' }
    case 'ts':
    case 'tsx':
      return { icon: 'typescript', color: 'var(--ctp-blue)' }
    case 'json':
      return { icon: 'json', color: 'var(--ctp-peach)' }
    case 'md':
    case 'markdown':
      return { icon: 'markdown', color: 'var(--ctp-sapphire)' }
    case 'toml':
    case 'yaml':
    case 'yml':
      return { icon: 'config', color: 'var(--ctp-mauve)' }
    case 'html':
      return { icon: 'html', color: 'var(--ctp-peach)' }
    case 'css':
      return { icon: 'css', color: 'var(--ctp-blue)' }
    case 'txt':
      return { icon: 'file-lines', color: 'var(--ctp-subtext0)' }
    default:
      return { icon: 'file', color: 'var(--ctp-subtext0)' }
  }
}

export function TabsBar({ tabs, activePath, onSelect, onClose }: TabsBarProps) {
  const { t } = useTranslation()
  if (!tabs.length) return null

  return (
    <div
      className="tabs-bar flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto"
      style={{
        backgroundColor: 'var(--ctp-mantle)',
        borderBottom: '1px solid var(--ctp-surface0)'
      }}
    >
      {tabs.map(tab => {
        const name = tab.title || tab.path.split('\\').pop() || tab.path.split('/').pop() || t('tabsBar.untitled')
        const isActive = tab.path === activePath
        const { icon, color } = getFileIcon(name)

        return (
          <div
            key={tab.path}
            className={`tab-item group flex items-center gap-2 px-3 py-1.5 text-xs rounded-md cursor-pointer select-none whitespace-nowrap transition-all duration-150 ${isActive ? 'tab-active' : ''}`}
            style={{
              backgroundColor: isActive ? 'var(--ctp-surface0)' : 'transparent',
              color: isActive ? 'var(--ctp-text)' : 'var(--ctp-subtext0)',
              boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => onSelect(tab.path)}
            title={tab.path}
          >
            <Icon name={icon} size={11} color={isActive ? color : 'var(--ctp-overlay0)'} />
            <span className="truncate max-w-[140px] font-medium">{name}</span>
            <button
              className="tab-close opacity-0 group-hover:opacity-100 ml-1 w-4 h-4 flex items-center justify-center rounded transition-all duration-100"
              onClick={(e) => { e.stopPropagation(); onClose(tab.path) }}
              style={{
                color: 'var(--ctp-overlay1)',
                fontSize: '10px'
              }}
              title={t('tabsBar.close')}
            >
              <Icon name="close" size={10} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
