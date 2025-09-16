// Catppuccin Color Palette
// Based on https://catppuccin.com/palette/

export const catppuccin = {
  mocha: {
    // Base colors
    base: "#1e1e2e",      // Background
    mantle: "#181825",    // Darker background
    crust: "#11111b",     // Darkest background
    
    // Text colors
    text: "#cdd6f4",      // Primary text
    subtext1: "#bac2de",  // Secondary text
    subtext0: "#a6adc8",  // Tertiary text
    
    // Surface colors
    surface2: "#585b70",  // Disabled/inactive
    surface1: "#45475a",  // Subtle borders
    surface0: "#313244",  // Interactive surfaces
    overlay2: "#9399b2",  // Overlay text
    overlay1: "#7f849c",  // Overlay elements
    overlay0: "#6c7086",  // Light overlay
    
    // Accent colors
    rosewater: "#f5e0dc",
    flamingo: "#f2cdcd", 
    pink: "#f5c2e7",
    mauve: "#cba6f7",    // Purple
    red: "#f38ba8",
    maroon: "#eba0ac",
    peach: "#fab387",    // Orange
    yellow: "#f9e2af",
    green: "#a6e3a1",
    teal: "#94e2d5",
    sky: "#89dceb",      // Light blue
    sapphire: "#74c7ec",
    blue: "#87ceeb",
    lavender: "#b4befe", // Light purple
  },
  
  latte: {
    // Base colors  
    base: "#eff1f5",      // Background
    mantle: "#e6e9ef",    // Darker background
    crust: "#dce0e8",     // Darkest background
    
    // Text colors
    text: "#4c4f69",      // Primary text
    subtext1: "#5c5f77",  // Secondary text
    subtext0: "#6c6f85",  // Tertiary text
    
    // Surface colors
    surface2: "#acb0be",  // Disabled/inactive
    surface1: "#bcc0cc",  // Subtle borders
    surface0: "#ccd0da",  // Interactive surfaces
    overlay2: "#7c7f93",  // Overlay text
    overlay1: "#8c8fa1",  // Overlay elements
    overlay0: "#9ca0b0",  // Light overlay
    
    // Accent colors
    rosewater: "#dc8a78",
    flamingo: "#dd7878",
    pink: "#ea76cb", 
    mauve: "#8839ef",    // Purple
    red: "#d20f39",
    maroon: "#e64553",
    peach: "#fe640b",    // Orange
    yellow: "#df8e1d",
    green: "#40a02b",
    teal: "#179299",
    sky: "#04a5e5",      // Light blue
    sapphire: "#209fb5",
    blue: "#1e66f5",
    lavender: "#7287fd", // Light purple
  }
}

export type CatppuccinFlavor = keyof typeof catppuccin
export type CatppuccinColors = typeof catppuccin.mocha

// Theme configuration for UI components
export const createCatppuccinTheme = (flavor: CatppuccinFlavor = 'mocha') => {
  const colors = catppuccin[flavor]
  
  return {
    // Main UI colors
    background: colors.base,
    backgroundSecondary: colors.mantle,
    backgroundTertiary: colors.crust,
    
    // Text colors
    textPrimary: colors.text,
    textSecondary: colors.subtext1,
    textTertiary: colors.subtext0,
    textDisabled: colors.surface2,
    
    // Border and surface colors
    border: colors.surface1,
    borderHover: colors.surface2,
    surface: colors.surface0,
    surfaceHover: colors.surface1,
    
    // Interactive colors
    primary: colors.mauve,
    primaryHover: colors.lavender,
    secondary: colors.blue,
    secondaryHover: colors.sky,
    
    // Status colors
    success: colors.green,
    successHover: colors.teal,
    warning: colors.yellow,
    warningHover: colors.peach,
    error: colors.red,
    errorHover: colors.maroon,
    info: colors.blue,
    infoHover: colors.sapphire,
    
    // Editor specific colors
    editorBackground: colors.base,
    editorForeground: colors.text,
    editorSelection: colors.surface2,
    editorSelectionHighlight: colors.surface1,
    editorLineHighlight: colors.surface0,
    editorCursor: colors.rosewater,
    editorWhitespace: colors.overlay0,
    
    // Syntax highlighting
    syntax: {
      comment: colors.overlay1,
      string: colors.green,
      number: colors.peach,
      boolean: colors.peach,
      keyword: colors.mauve,
      operator: colors.sky,
      function: colors.blue,
      variable: colors.text,
      type: colors.yellow,
      class: colors.yellow,
      interface: colors.yellow,
      namespace: colors.yellow,
      property: colors.rosewater,
      tag: colors.mauve,
      attribute: colors.blue,
      value: colors.green,
      punctuation: colors.overlay2,
      bracket: colors.overlay2,
      delimiter: colors.overlay2,
    }
  }
}

// Monaco Editor theme configuration - CORRECTED for latest API
export const createMonacoCatppuccinTheme = (flavor: CatppuccinFlavor = 'mocha'): any => {
  const colors = catppuccin[flavor]
  const isDark = flavor === 'mocha'
  
  // Helper function to convert hex color to Monaco format (without #)
  const toMonacoColor = (hexColor: string) => hexColor.replace('#', '')
  
  // Create theme definition following Monaco Editor API specification
  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true, // Inherit base syntax rules, override colors
    rules: [
      // Basic tokens
      { token: '', foreground: toMonacoColor(colors.text) },
      { token: 'source', foreground: toMonacoColor(colors.text) },
      { token: 'text', foreground: toMonacoColor(colors.text) },
      
      // Comments - Gray, italic
      { token: 'comment', foreground: toMonacoColor(colors.overlay1), fontStyle: 'italic' },
      { token: 'comment.line', foreground: toMonacoColor(colors.overlay1), fontStyle: 'italic' },
      { token: 'comment.block', foreground: toMonacoColor(colors.overlay1), fontStyle: 'italic' },
      { token: 'comment.line.double-slash', foreground: toMonacoColor(colors.overlay1), fontStyle: 'italic' },
      { token: 'comment.block.documentation', foreground: toMonacoColor(colors.overlay1), fontStyle: 'italic' },
      
      // Strings - Green
      { token: 'string', foreground: toMonacoColor(colors.green) },
      { token: 'string.quoted', foreground: toMonacoColor(colors.green) },
      { token: 'string.quoted.single', foreground: toMonacoColor(colors.green) },
      { token: 'string.quoted.double', foreground: toMonacoColor(colors.green) },
      { token: 'string.quoted.triple', foreground: toMonacoColor(colors.green) },
      { token: 'string.template', foreground: toMonacoColor(colors.green) },
      { token: 'string.interpolated', foreground: toMonacoColor(colors.green) },
      { token: 'string.regexp', foreground: toMonacoColor(colors.green) },
      
      // Numbers - Peach (orange)
      { token: 'number', foreground: toMonacoColor(colors.peach) },
      { token: 'number.float', foreground: toMonacoColor(colors.peach) },
      { token: 'number.hex', foreground: toMonacoColor(colors.peach) },
      { token: 'number.octal', foreground: toMonacoColor(colors.peach) },
      { token: 'number.binary', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.numeric', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.numeric.integer', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.numeric.float', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.numeric.hex', foreground: toMonacoColor(colors.peach) },
      
      // Keywords - Mauve (purple), bold
      { token: 'keyword', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.flow', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.import', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.from', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.conditional', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.loop', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.exception', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.operator.logical', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'storage', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'storage.type', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'storage.modifier', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      
      // Operators - Sky (light blue)
      { token: 'operator', foreground: toMonacoColor(colors.sky) },
      { token: 'keyword.operator', foreground: toMonacoColor(colors.sky) },
      { token: 'keyword.operator.arithmetic', foreground: toMonacoColor(colors.sky) },
      { token: 'keyword.operator.assignment', foreground: toMonacoColor(colors.sky) },
      { token: 'keyword.operator.comparison', foreground: toMonacoColor(colors.sky) },
      { token: 'punctuation.operator', foreground: toMonacoColor(colors.sky) },
      
      // Functions - Blue
      { token: 'entity.name.function', foreground: toMonacoColor(colors.blue) },
      { token: 'support.function', foreground: toMonacoColor(colors.blue) },
      { token: 'support.function.builtin', foreground: toMonacoColor(colors.blue) },
      { token: 'entity.name.function.constructor', foreground: toMonacoColor(colors.blue) },
      { token: 'entity.name.function.member', foreground: toMonacoColor(colors.blue) },
      { token: 'variable.function', foreground: toMonacoColor(colors.blue) },
      
      // Classes and types - Yellow
      { token: 'entity.name.class', foreground: toMonacoColor(colors.yellow) },
      { token: 'entity.name.type', foreground: toMonacoColor(colors.yellow) },
      { token: 'support.type', foreground: toMonacoColor(colors.yellow) },
      { token: 'entity.name.namespace', foreground: toMonacoColor(colors.yellow) },
      { token: 'entity.other.inherited-class', foreground: toMonacoColor(colors.yellow) },
      { token: 'support.class', foreground: toMonacoColor(colors.yellow) },
      
      // Constants and language constants - Peach
      { token: 'constant', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.language', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.language.boolean', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.language.null', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.language.undefined', foreground: toMonacoColor(colors.peach) },
      { token: 'constant.other', foreground: toMonacoColor(colors.peach) },
      { token: 'support.constant', foreground: toMonacoColor(colors.peach) },
      
      // Variables - Text color (default)
      { token: 'variable', foreground: toMonacoColor(colors.text) },
      { token: 'variable.other', foreground: toMonacoColor(colors.text) },
      { token: 'variable.parameter', foreground: toMonacoColor(colors.rosewater) },
      { token: 'variable.language.self', foreground: toMonacoColor(colors.red) },
      { token: 'variable.language.this', foreground: toMonacoColor(colors.red) },
      { token: 'variable.other.readwrite', foreground: toMonacoColor(colors.text) },
      
      // Identifiers
      { token: 'identifier', foreground: toMonacoColor(colors.text) },
      { token: 'entity.name.variable', foreground: toMonacoColor(colors.text) },
      
      // Python-specific tokens
      { token: 'keyword.control.python', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.flow.python', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'keyword.control.import.python', foreground: toMonacoColor(colors.mauve), fontStyle: 'bold' },
      { token: 'support.function.builtin.python', foreground: toMonacoColor(colors.blue) },
      { token: 'support.type.python', foreground: toMonacoColor(colors.yellow) },
      { token: 'entity.name.function.decorator.python', foreground: toMonacoColor(colors.pink) },
      { token: 'support.function.magic.python', foreground: toMonacoColor(colors.pink) },
      { token: 'meta.function.decorator.python', foreground: toMonacoColor(colors.pink) },
      { token: 'entity.name.function.decorator', foreground: toMonacoColor(colors.pink) },
      
      // Punctuation and delimiters
      { token: 'punctuation', foreground: toMonacoColor(colors.overlay2) },
      { token: 'punctuation.separator', foreground: toMonacoColor(colors.overlay2) },
      { token: 'punctuation.terminator', foreground: toMonacoColor(colors.overlay2) },
      { token: 'punctuation.definition.string', foreground: toMonacoColor(colors.green) },
      { token: 'punctuation.definition.comment', foreground: toMonacoColor(colors.overlay1) },
      { token: 'delimiter', foreground: toMonacoColor(colors.overlay2) },
      { token: 'delimiter.bracket', foreground: toMonacoColor(colors.overlay2) },
      { token: 'delimiter.parenthesis', foreground: toMonacoColor(colors.overlay2) },
      { token: 'delimiter.square', foreground: toMonacoColor(colors.overlay2) },
      { token: 'delimiter.curly', foreground: toMonacoColor(colors.overlay2) },
      { token: 'punctuation.bracket', foreground: toMonacoColor(colors.overlay2) },
      { token: 'punctuation.parenthesis', foreground: toMonacoColor(colors.overlay2) },
      
      // Tags (for markup languages)
      { token: 'entity.name.tag', foreground: toMonacoColor(colors.mauve) },
      { token: 'entity.other.attribute-name', foreground: toMonacoColor(colors.blue) },
      
      // Invalid/Error tokens
      { token: 'invalid', foreground: toMonacoColor(colors.red), fontStyle: 'underline' },
      { token: 'invalid.illegal', foreground: toMonacoColor(colors.red), fontStyle: 'underline' },
      { token: 'invalid.deprecated', foreground: toMonacoColor(colors.yellow), fontStyle: 'strikethrough' },
    ],
    colors: {
      // Editor colors
      'editor.background': colors.base,
      'editor.foreground': colors.text,
      'editorLineNumber.foreground': colors.overlay0,
      'editorLineNumber.activeForeground': colors.text,
      'editorCursor.foreground': colors.rosewater,
      
      // Selection colors
      'editor.selectionBackground': colors.surface2,
      'editor.selectionHighlightBackground': colors.surface1,
      'editor.inactiveSelectionBackground': colors.surface1,
      'editor.lineHighlightBackground': colors.surface0,
      'editor.lineHighlightBorder': colors.surface1,
      
      // Scrollbar
      'scrollbarSlider.background': colors.surface2,
      'scrollbarSlider.hoverBackground': colors.overlay0,
      'scrollbarSlider.activeBackground': colors.overlay1,
      
      // Widgets
      'editorWidget.background': colors.surface0,
      'editorWidget.foreground': colors.text,
      'editorWidget.border': colors.surface1,
      'editorHoverWidget.background': colors.surface0,
      'editorHoverWidget.foreground': colors.text,
      'editorHoverWidget.border': colors.surface1,
      
      // Bracket matching
      'editorBracketMatch.background': colors.surface2,
      'editorBracketMatch.border': colors.overlay2,
      
      // Find widget
      'editorFindMatch.background': colors.yellow + '40', // Add alpha
      'editorFindMatchHighlight.background': colors.yellow + '20',
      'editorFindRangeHighlight.background': colors.surface1,
      
      // Minimap
      'minimap.background': colors.mantle,
      'minimap.foregroundOpacity': isDark ? '#ffffff30' : '#00000030',
      
      // Gutter
      'editorGutter.background': colors.base,
      'editorGutter.modifiedBackground': colors.yellow,
      'editorGutter.addedBackground': colors.green,
      'editorGutter.deletedBackground': colors.red,
      
      // Overview ruler
      'editorOverviewRuler.border': colors.surface1,
      'editorOverviewRuler.findMatchForeground': colors.yellow,
      'editorOverviewRuler.selectionHighlightForeground': colors.surface2,
    }
  }
}