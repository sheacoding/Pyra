// Monaco Catppuccin Theme - Working Implementation
import { catppuccin, CatppuccinFlavor } from './catppuccin'

export const createMonacoCatppuccinTheme = (flavor: CatppuccinFlavor = 'mocha'): any => {
  const colors = catppuccin[flavor]
  const isDark = flavor === 'mocha'

  // Remove # from hex colors for Monaco
  const clean = (color: string) => color.replace('#', '')

  // Helper function to convert decimal opacity to hex (0-1 to 00-FF)
  const opacityToHex = (opacity: number): string => {
    const hex = Math.round(opacity * 255).toString(16).padStart(2, '0')
    return hex
  }

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
      { token: 'attribute.name', foreground: clean(colors.blue) },
      { token: 'metatag', foreground: clean(colors.peach), fontStyle: 'bold' },
      { token: 'delimiter', foreground: clean(colors.sky) },
      { token: 'delimiter.square', foreground: clean(colors.sky) },
      { token: 'delimiter.curly', foreground: clean(colors.sky) },
      { token: 'delimiter.parenthesis', foreground: clean(colors.sky) },
      { token: 'string.quote', foreground: clean(colors.green) },
      { token: 'string.escape', foreground: clean(colors.peach) },
      { token: 'string.escape.invalid', foreground: clean(colors.red), fontStyle: 'bold' },

      // Default
      { token: '', foreground: clean(colors.text) },
    ],
    colors: {
      'editor.foreground': colors.text,
      'editor.background': colors.base,

      // Selection colors - using 8-digit hex format (#RRGGBBAA) for Monaco
      'editor.selectionBackground': colors.blue + opacityToHex(0.40), // 40% opacity = 0x66
      'editor.selectionHighlightBackground': colors.blue + opacityToHex(0.20), // 20% opacity = 0x33
      'editor.inactiveSelectionBackground': colors.surface2 + opacityToHex(0.60), // 60% opacity = 0x99
      'editor.findMatchBackground': colors.yellow + opacityToHex(0.50), // 50% opacity = 0x80
      'editor.findMatchHighlightBackground': colors.yellow + opacityToHex(0.30), // 30% opacity = 0x4D
      'editor.findRangeHighlightBackground': colors.surface2 + opacityToHex(0.40),

      'editor.lineHighlightBackground': colors.surface0 + opacityToHex(0.50), // 50% opacity
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
      'scrollbarSlider.background': colors.surface1 + opacityToHex(0.50),
      'scrollbarSlider.hoverBackground': colors.surface2,
      'scrollbarSlider.activeBackground': colors.surface2,

      // Word highlight
      'editor.wordHighlightBackground': colors.surface2 + opacityToHex(0.60),
      'editor.wordHighlightStrongBackground': colors.surface2 + opacityToHex(0.80), // 80% opacity
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
