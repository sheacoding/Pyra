interface StatusBarProps {
  currentFile: string | null
  uvReady?: boolean
  uvInstalling?: boolean
}

export function StatusBar({ currentFile, uvReady = true, uvInstalling = false }: StatusBarProps) {
  const getFileInfo = (filePath: string | null) => {
    if (!filePath) return { name: 'No file selected', language: '' }
    
    const name = filePath.split('/').pop() || filePath.split('\\').pop() || ''
    const ext = name.split('.').pop()?.toLowerCase()
    
    let language = ''
    switch (ext) {
      case 'py': language = 'Python'; break
      case 'js': language = 'JavaScript'; break
      case 'ts': language = 'TypeScript'; break
      case 'json': language = 'JSON'; break
      case 'md': language = 'Markdown'; break
      default: language = 'Plain Text'
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
        <span>Pyra IDE v0.1.0</span>
        {uvInstalling ? (
          <span>Preparing environment…</span>
        ) : (
          <span>{uvReady ? 'Ready' : 'Setting up…'}</span>
        )}
      </div>
    </div>
  )
}
