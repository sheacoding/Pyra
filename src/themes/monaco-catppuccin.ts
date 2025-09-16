// Monaco Editor Catppuccin Theme with correct token names
import { catppuccin, CatppuccinFlavor } from './catppuccin'

export const createMonacoCatppuccinTheme = (flavor: CatppuccinFlavor = 'mocha'): any => {
  const colors = catppuccin[flavor]
  const isDark = flavor === 'mocha'

  // Create theme definition using Monaco's actual token names
  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: false, // Don't inherit, define all colors explicitly
    rules: [
      // Comments - must be first to override defaults
      { token: 'comment', foreground: colors.overlay1.replace('#', ''), fontStyle: 'italic' },

      // Strings
      { token: 'string', foreground: colors.green.replace('#', '') },
      { token: 'string.escape', foreground: colors.pink.replace('#', '') },
      { token: 'string.sql', foreground: colors.green.replace('#', '') },

      // Numbers
      { token: 'number', foreground: colors.peach.replace('#', '') },
      { token: 'number.hex', foreground: colors.peach.replace('#', '') },
      { token: 'number.binary', foreground: colors.peach.replace('#', '') },
      { token: 'number.octal', foreground: colors.peach.replace('#', '') },
      { token: 'number.float', foreground: colors.peach.replace('#', '') },

      // Keywords
      { token: 'keyword', foreground: colors.mauve.replace('#', '') },
      { token: 'keyword.flow', foreground: colors.mauve.replace('#', '') },
      { token: 'keyword.json', foreground: colors.mauve.replace('#', '') },

      // Operators
      { token: 'operator', foreground: colors.sky.replace('#', '') },
      { token: 'operator.sql', foreground: colors.sky.replace('#', '') },
      { token: 'operator.scss', foreground: colors.sky.replace('#', '') },

      // Types/Classes
      { token: 'type', foreground: colors.yellow.replace('#', '') },

      // Functions/Methods
      { token: 'function', foreground: colors.blue.replace('#', '') },
      { token: 'predefined', foreground: colors.blue.replace('#', '') },

      // Variables/Identifiers
      { token: 'identifier', foreground: colors.text.replace('#', '') },
      { token: 'variable', foreground: colors.text.replace('#', '') },

      // Decorators and special
      { token: 'decorator', foreground: colors.pink.replace('#', '') },
      { token: 'annotation', foreground: colors.pink.replace('#', '') },

      // Constants
      { token: 'constant', foreground: colors.peach.replace('#', '') },

      // Tags (HTML/XML)
      { token: 'tag', foreground: colors.mauve.replace('#', '') },
      { token: 'attribute.name', foreground: colors.blue.replace('#', '') },
      { token: 'attribute.value', foreground: colors.green.replace('#', '') },

      // Delimiters
      { token: 'delimiter', foreground: colors.overlay2.replace('#', '') },
      { token: 'delimiter.html', foreground: colors.overlay2.replace('#', '') },
      { token: 'delimiter.xml', foreground: colors.overlay2.replace('#', '') },

      // Regexp
      { token: 'regexp', foreground: colors.pink.replace('#', '') },

      // Namespace
      { token: 'namespace', foreground: colors.yellow.replace('#', '') },

      // Default text
      { token: '', foreground: colors.text.replace('#', '') },
      { token: 'white', foreground: colors.text.replace('#', '') },
      { token: 'text', foreground: colors.text.replace('#', '') },
      { token: 'source', foreground: colors.text.replace('#', '') },
    ],
    colors: {
      // Editor colors
      'editor.background': colors.base,
      'editor.foreground': colors.text,
      'editorCursor.foreground': colors.rosewater,
      'editor.lineHighlightBackground': colors.surface0 + '40',
      'editor.selectionBackground': colors.surface2 + '80',
      'editor.inactiveSelectionBackground': colors.surface1 + '60',

      // Line numbers
      'editorLineNumber.foreground': colors.overlay0,
      'editorLineNumber.activeForeground': colors.lavender,

      // Scrollbar
      'scrollbar.shadow': colors.base + '00',
      'scrollbarSlider.background': colors.surface2 + '60',
      'scrollbarSlider.hoverBackground': colors.overlay0 + '60',
      'scrollbarSlider.activeBackground': colors.overlay1 + '60',

      // Widgets
      'editorWidget.background': colors.surface0,
      'editorWidget.foreground': colors.text,
      'editorWidget.border': colors.surface1,
      'editorSuggestWidget.background': colors.surface0,
      'editorSuggestWidget.border': colors.surface1,
      'editorSuggestWidget.foreground': colors.text,
      'editorSuggestWidget.selectedBackground': colors.surface2,
      'editorSuggestWidget.highlightForeground': colors.blue,

      // Hover widget
      'editorHoverWidget.background': colors.surface0,
      'editorHoverWidget.foreground': colors.text,
      'editorHoverWidget.border': colors.surface1,

      // Bracket matching
      'editorBracketMatch.background': colors.surface2 + '40',
      'editorBracketMatch.border': colors.overlay2 + '00',

      // Find/Search
      'editor.findMatchBackground': colors.yellow + '40',
      'editor.findMatchHighlightBackground': colors.yellow + '20',
      'editor.findRangeHighlightBackground': colors.surface2 + '30',

      // Word highlight
      'editor.wordHighlightBackground': colors.surface2 + '40',
      'editor.wordHighlightStrongBackground': colors.surface2 + '60',

      // Indentation
      'editorIndentGuide.background': colors.surface0,
      'editorIndentGuide.activeBackground': colors.surface2,

      // Gutter
      'editorGutter.background': colors.base,
      'editorGutter.modifiedBackground': colors.yellow,
      'editorGutter.addedBackground': colors.green,
      'editorGutter.deletedBackground': colors.red,

      // Errors and warnings
      'editorError.foreground': colors.red,
      'editorWarning.foreground': colors.yellow,
      'editorInfo.foreground': colors.blue,

      // Minimap
      'minimap.background': colors.mantle + '80',
      'minimap.findMatchHighlight': colors.yellow,
      'minimap.selectionHighlight': colors.surface2,
      'minimap.errorHighlight': colors.red,
      'minimap.warningHighlight': colors.yellow,

      // Overview ruler
      'editorOverviewRuler.border': colors.surface1 + '00',
      'editorOverviewRuler.findMatchForeground': colors.yellow,
      'editorOverviewRuler.modifiedForeground': colors.yellow,
      'editorOverviewRuler.addedForeground': colors.green,
      'editorOverviewRuler.deletedForeground': colors.red,
      'editorOverviewRuler.errorForeground': colors.red,
      'editorOverviewRuler.warningForeground': colors.yellow,
      'editorOverviewRuler.infoForeground': colors.blue,
    }
  }
}