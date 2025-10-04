; Pyra IDE NSIS Installer Hooks
; Custom installer interface configuration

; MUI Icon Configuration - Must be defined BEFORE MUI2.nsh is included
; This is included by Tauri before the MUI includes, so we can set these here
!ifndef MUI_UNICON
  !define MUI_UNICON "${INSTALLERICON}"
!endif

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "正在准备安装 Pyra IDE..."
  DetailPrint "Pyra 是一个现代化、轻量级的 Python IDE"
  DetailPrint "特性：与 uv 无缝集成、Monaco 编辑器、内置 Ruff"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Pyra IDE 安装完成！"
  DetailPrint "感谢您选择 Pyra IDE"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "======================================"
  DetailPrint "      Pyra IDE 卸载向导"
  DetailPrint "======================================"
  DetailPrint ""
  DetailPrint "正在准备卸载 Pyra IDE..."
  DetailPrint "感谢您使用 Pyra IDE！"
  DetailPrint ""
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint ""
  DetailPrint "======================================"
  DetailPrint "  Pyra IDE 已成功从您的计算机中移除"
  DetailPrint "======================================"
  DetailPrint ""
  DetailPrint "我们很遗憾看到您离开。"
  DetailPrint "如果您有任何反馈或建议，"
  DetailPrint "欢迎访问我们的 GitHub 仓库。"
  DetailPrint ""
  MessageBox MB_ICONINFORMATION|MB_OK "感谢您使用 Pyra IDE！$\r$\n$\r$\n如果您遇到任何问题或有改进建议，$\r$\n欢迎在 GitHub 上反馈。"
!macroend
