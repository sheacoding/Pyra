/**
 * [INPUT]: 依赖 react-i18next, ../Icon
 * [OUTPUT]: 对外提供 VenvDialog 组件
 * [POS]: dialogs/ 的虚拟环境创建对话框，从 App.tsx 提取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'

/* ================================================================
 * Props
 * ================================================================ */

interface VenvDialogProps {
  isOpen: boolean
  onCreateVenv: (pythonVersion: string) => void
  onSkip: () => void
}

/* ================================================================
 * VenvDialog
 * ================================================================ */

export function VenvDialog({ isOpen, onCreateVenv, onSkip }: VenvDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleCreate = () => {
    const select = document.getElementById('python-version') as HTMLSelectElement
    onCreateVenv(select.value)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-90vw">
        <h3 className="text-xl font-bold text-white mb-4">
          <Icon name="python" size={24} color="var(--ctp-blue)" /> {t('venvDialog.title')}
        </h3>
        <p className="text-gray-300 mb-6">{t('venvDialog.message')}</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('venvDialog.pythonVersion')}
          </label>
          <select
            id="python-version"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            defaultValue="3.11"
          >
            <option value="3.12">Python 3.12</option>
            <option value="3.11">Python 3.11 {t('venvDialog.recommended')}</option>
            <option value="3.10">Python 3.10</option>
            <option value="3.9">Python 3.9</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            {t('venvDialog.skipForNow')}
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Icon name="rocket" size={14} /> {t('venvDialog.createEnvironment')}
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
          <Icon name="lightbulb" size={14} color="var(--ctp-yellow)" /> {t('venvDialog.tip')}
        </div>
      </div>
    </div>
  )
}
