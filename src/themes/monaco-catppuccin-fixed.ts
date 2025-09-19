// Monaco Catppuccin Theme - Working Implementation
import { catppuccin, CatppuccinFlavor } from './catppuccin'

export const createMonacoCatppuccinTheme = (flavor: CatppuccinFlavor = 'mocha'): any => {
  const colors = catppuccin[flavor]
  const isDark = flavor === 'mocha'

  // Remove # from hex colors for Monaco
  const clean = (color: string) => color.replace('#', '')

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // CRITICAL: These are the actual token types Monaco uses
      // Test with vs-dark theme to verify these work

      // Python keywords
      { token: 'keyword.python', foreground: clean(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.import.python', foreground: clean(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.flow.python', foreground: clean(colors.mauve), fontStyle: 'bold' },

      // Strings
      { token: 'string.quoted.single.python', foreground: clean(colors.green) },
      { token: 'string.quoted.double.python', foreground: clean(colors.green) },
      { token: 'string.quoted.docstring.multi.python', foreground: clean(colors.green) },

      // Comments
      { token: 'comment.line.number-sign.python', foreground: clean(isDark ? colors.overlay1 : colors.overlay2), fontStyle: 'italic' },

      // Functions
      { token: 'entity.name.function.python', foreground: clean(colors.blue) },
      { token: 'support.function.builtin.python', foreground: clean(colors.blue) },
      { token: 'support.function.magic.python', foreground: clean(colors.pink) },

      // Classes
      { token: 'entity.name.type.class.python', foreground: clean(colors.yellow) },
      { token: 'entity.other.inherited-class.python', foreground: clean(colors.yellow) },

      // Variables
      { token: 'variable.parameter.function.python', foreground: clean(colors.rosewater) },
      { token: 'variable.language.special.self.python', foreground: clean(colors.red) },

      // Constants
      { token: 'constant.language.python', foreground: clean(colors.peach) },
      { token: 'constant.numeric.python', foreground: clean(colors.peach) },

      // Decorators
      { token: 'entity.name.function.decorator.python', foreground: clean(colors.pink) },
      { token: 'meta.function.decorator.python', foreground: clean(colors.pink) },

      // Storage
      { token: 'storage.type.function.python', foreground: clean(colors.mauve) },
      { token: 'storage.type.class.python', foreground: clean(colors.mauve) },

      // Operators
      { token: 'keyword.operator.python', foreground: clean(colors.sky) },
      { token: 'keyword.operator.logical.python', foreground: clean(colors.sky) },

      // Support
      { token: 'support.type.python', foreground: clean(colors.yellow) },

      // Generic fallbacks for any language
      { token: 'keyword', foreground: clean(colors.mauve), fontStyle: 'bold' },
      { token: 'comment', foreground: clean(isDark ? colors.overlay1 : colors.overlay2), fontStyle: 'italic' },
      { token: 'string', foreground: clean(colors.green) },
      { token: 'number', foreground: clean(colors.peach) },
      { token: 'regexp', foreground: clean(colors.pink) },
      { token: 'operator', foreground: clean(colors.sky) },
      { token: 'namespace', foreground: clean(colors.yellow) },
      { token: 'type', foreground: clean(colors.yellow) },
      { token: 'struct', foreground: clean(colors.yellow) },
      { token: 'class', foreground: clean(colors.yellow) },
      { token: 'interface', foreground: clean(colors.yellow) },
      { token: 'enum', foreground: clean(colors.yellow) },
      { token: 'typeParameter', foreground: clean(colors.rosewater) },
      { token: 'function', foreground: clean(colors.blue) },
      { token: 'member', foreground: clean(colors.blue) },
      { token: 'macro', foreground: clean(colors.teal) },
      { token: 'variable', foreground: clean(colors.text) },
      { token: 'parameter', foreground: clean(colors.rosewater) },
      { token: 'property', foreground: clean(colors.blue) },
      { token: 'label', foreground: clean(colors.sapphire) },
      { token: 'constant', foreground: clean(colors.peach) },
      { token: 'annotation', foreground: clean(colors.pink) },
      { token: 'decorator', foreground: clean(colors.pink) },

      // Default
      { token: '', foreground: clean(colors.text) },
    ],
    colors: {
      'editor.foreground': colors.text,
      'editor.background': colors.base,
      'editor.selectionBackground': colors.surface2,
      'editor.lineHighlightBackground': colors.surface0 + '50',
      'editorCursor.foreground': colors.rosewater,
      'editorWhitespace.foreground': isDark ? colors.surface1 : colors.surface2,

      // Line numbers - improved contrast for light theme
      'editorLineNumber.foreground': isDark ? colors.overlay0 : colors.subtext1,
      'editorLineNumber.activeForeground': colors.text,

      // Indent guides - improved visibility for light theme
      'editorIndentGuide.background': isDark ? colors.surface0 : colors.surface1,
      'editorIndentGuide.activeBackground': colors.surface2,

      // Scrollbar
      'scrollbar.shadow': colors.base,
      'scrollbarSlider.background': colors.surface1 + '80',
      'scrollbarSlider.hoverBackground': colors.surface2,
      'scrollbarSlider.activeBackground': colors.surface2,
    }
  }
}

// Force apply theme with Monaco's internal API
export function forceApplyTheme(monaco: any, themeName: string) {
  const themeService = (monaco as any)._themeService
  if (themeService) {
    themeService.setTheme(themeName)
  } else {
    monaco.editor.setTheme(themeName)
  }
}
