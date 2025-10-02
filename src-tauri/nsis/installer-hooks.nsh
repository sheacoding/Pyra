; Pyra IDE NSIS Installer Hooks
; Custom installer interface configuration

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
  DetailPrint "正在准备卸载 Pyra IDE..."
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint "Pyra IDE 已成功卸载"
  MessageBox MB_OK "感谢您使用 Pyra IDE！"
!macroend
