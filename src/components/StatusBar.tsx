import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface StatusBarProps {
  currentFile: string | null;
  uvReady?: boolean;
  uvInstalling?: boolean;
  isDebugging?: boolean;
  debugPanelVisible?: boolean;
  onShowDebugPanel?: () => void;
}

export function StatusBar({
  currentFile,
  uvReady = true,
  uvInstalling = false,
  isDebugging = false,
  debugPanelVisible = false,
  onShowDebugPanel,
}: StatusBarProps) {
  const { t } = useTranslation();

  const getFileInfo = (filePath: string | null) => {
    if (!filePath) return { name: t("statusBar.noFileSelected"), language: "", icon: "file" };

    const name = filePath.split("/").pop() || filePath.split("\\").pop() || "";
    const ext = name.split(".").pop()?.toLowerCase();

    let language = "";
    let icon = "file";
    switch (ext) {
      case "py":
        language = t("statusBar.languages.python");
        icon = "python";
        break;
      case "js":
        language = t("statusBar.languages.javascript");
        icon = "javascript";
        break;
      case "ts":
        language = t("statusBar.languages.typescript");
        icon = "typescript";
        break;
      case "json":
        language = t("statusBar.languages.json");
        icon = "json";
        break;
      case "md":
      case "markdown":
        language = t("statusBar.languages.markdown");
        icon = "markdown";
        break;
      case "toml":
        language = t("statusBar.languages.toml");
        icon = "config";
        break;
      default:
        language = t("statusBar.languages.plainText");
    }

    return { name, language, icon };
  };

  const { name, language, icon } = getFileInfo(currentFile);

  return (
    <div
      className="status-bar h-6 text-xs flex items-center justify-between px-3"
      style={{
        background: 'linear-gradient(90deg, var(--ctp-mauve) 0%, var(--ctp-blue) 100%)',
        color: "var(--ctp-crust)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Icon name={icon} size={10} />
          <span className="font-medium">{name}</span>
        </div>
        {language && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
            {language}
          </span>
        )}

        {/* Debug status indicator */}
        {isDebugging && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--ctp-green)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--ctp-green)' }}></span>
            </span>
            <span className="font-medium">{t("statusBar.debugging")}</span>
            {!debugPanelVisible && onShowDebugPanel && (
              <button
                onClick={onShowDebugPanel}
                className="underline cursor-pointer hover:opacity-80 transition-opacity ml-1"
                title={t("statusBar.showDebugPanel")}
              >
                {t("statusBar.showPanel")}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="opacity-80">{t("statusBar.version", { version: "0.1.1" })}</span>
        <div className="flex items-center gap-1.5">
          {uvInstalling ? (
            <>
              <Icon name="spinner" size={10} className="animate-spin" />
              <span>{t("statusBar.preparing")}</span>
            </>
          ) : (
            <>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: uvReady ? 'var(--ctp-green)' : 'var(--ctp-yellow)' }}
              ></span>
              <span className="font-medium">
                {uvReady ? t("statusBar.ready") : t("statusBar.settingUp")}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
