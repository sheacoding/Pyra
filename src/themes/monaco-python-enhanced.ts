import { catppuccin } from './catppuccin'

// Monaco theme type definitions
type MonacoThemeRule = {
  token: string
  foreground?: string
  background?: string
  fontStyle?: string
}

type MonacoThemeData = {
  base: 'vs' | 'vs-dark' | 'hc-black'
  inherit: boolean
  rules: MonacoThemeRule[]
  colors: { [colorId: string]: string }
}

// Create Catppuccin theme with proper token mappings
export function createCatppuccinTheme(flavor: 'mocha' | 'latte' = 'mocha'): MonacoThemeData {
  const colors = catppuccin[flavor]
  const isDark = flavor === 'mocha'

  // Remove # from hex colors
  const clean = (color: string) => color.replace('#', '')

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: false,
    rules: [
      // Comments
      { token: 'comment', foreground: clean(colors.overlay1), fontStyle: 'italic' },

      // Strings
      { token: 'string', foreground: clean(colors.green) },
      { token: 'string.escape', foreground: clean(colors.pink) },
      { token: 'string.invalid', foreground: clean(colors.red) },

      // Numbers
      { token: 'number', foreground: clean(colors.peach) },
      { token: 'number.hex', foreground: clean(colors.peach) },
      { token: 'number.octal', foreground: clean(colors.peach) },
      { token: 'number.binary', foreground: clean(colors.peach) },
      { token: 'number.float', foreground: clean(colors.peach) },

      // Keywords
      { token: 'keyword', foreground: clean(colors.mauve) },

      // Built-in functions
      { token: 'builtin', foreground: clean(colors.blue) },

      // Decorators
      { token: 'decorator', foreground: clean(colors.pink) },

      // Identifiers
      { token: 'identifier', foreground: clean(colors.text) },

      // Operators
      { token: 'operator', foreground: clean(colors.sky) },

      // Delimiters
      { token: 'delimiter', foreground: clean(colors.overlay2) },
      { token: 'delimiter.bracket', foreground: clean(colors.overlay2) },

      // Default
      { token: '', foreground: clean(colors.text) }
    ],
    colors: {
      'editor.background': colors.base,
      'editor.foreground': colors.text,
      'editorLineNumber.foreground': colors.overlay0,
      'editorLineNumber.activeForeground': colors.lavender,
      'editor.selectionBackground': colors.surface2,
      'editor.lineHighlightBackground': colors.surface0 + '50',
      'editorCursor.foreground': colors.rosewater,
      'editorWhitespace.foreground': colors.surface1,
      'editorIndentGuide.background': colors.surface0,
      'editorIndentGuide.activeBackground': colors.surface2,
      'editorBracketMatch.background': colors.surface2 + '50',
      'editorBracketMatch.border': colors.overlay2,
    }
  }
}