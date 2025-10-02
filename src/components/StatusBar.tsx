import { useTranslation } from 'react-i18next'

interface StatusBarProps {
  currentFile: string | null
  uvReady?: boolean
  uvInstalling?: boolean
}

export function StatusBar({ currentFile, uvReady = true, uvInstalling = false }: StatusBarProps) {
  const { t } = useTranslation()

  const getFileInfo = (filePath: string | null) => {
    if (!filePath) return { name: t('statusBar.noFileSelected'), language: '' }

    const name = filePath.split('/').pop() || filePath.split('\\').pop() || ''
    const ext = name.split('.').pop()?.toLowerCase()

    let language = ''
    switch (ext) {
      case 'py': language = t('statusBar.languages.python'); break
      case 'js': language = t('statusBar.languages.javascript'); break
      case 'ts': language = t('statusBar.languages.typescript'); break
      case 'json': language = t('statusBar.languages.json'); break
      case 'md': language = t('statusBar.languages.markdown'); break
      default: language = t('statusBar.languages.plainText')
    }

    return { name, language }
  }

  const { name, language } = getFileInfo(currentFile)

  return (
    <div className="h-6 text-xs flex items-center justify-between px-4"
      style={{
        backgroundColor: 'var(--ctp-mauve)',
        color: 'var(--ctp-base)'
      }}>
      <div className="flex items-center gap-4">
        <span>{name}</span>
        {language && <span>{language}</span>}
      </div>

      <div className="flex items-center gap-4">
        <span>{t('statusBar.version', { version: '0.1.0' })}</span>
        {uvInstalling ? (
          <span>{t('statusBar.preparing')}</span>
        ) : (
          <span>{uvReady ? t('statusBar.ready') : t('statusBar.settingUp')}</span>
        )}
      </div>
    </div>
  )
}
