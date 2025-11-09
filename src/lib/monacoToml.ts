const brackets = [
  { open: '[', close: ']', token: 'delimiter.square' },
  { open: '{', close: '}', token: 'delimiter.curly' },
  { open: '(', close: ')', token: 'delimiter.parenthesis' }
]

const escapes = /\\(?:["'\\bfnrt]|u[0-9A-Fa-f]{4})/

export const tomlConf = {
  comments: {
    lineComment: '#'
  },
  brackets: [
    ['[', ']'],
    ['{', '}'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ]
}

export const tomlLanguage = {
  defaultToken: '',
  tokenPostfix: '.toml',
  brackets,
  keywords: ['true', 'false', 'inf', '+inf', '-inf', 'nan', '+nan', '-nan'],
  tokenizer: {
    root: [
      [/\s+/, 'white'],
      [/#.*$/, 'comment'],
      [/\[\[[^\]]*\]\]/, 'metatag'],
      [/\[[^\]]*\]/, 'metatag'],
      [/([A-Za-z0-9_\-\.]+)(\s*)(=)/, ['attribute.name', 'white', 'delimiter']],
      [/(\b|[-+])(?:0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/, 'number'],
      [/\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?/, 'number'],
      [/,\s*/, 'delimiter'],
      [/"""/, { token: 'string.quote', next: '@multistring_double' }],
      [/'''/, { token: 'string.quote', next: '@multistring_single' }],
      [/"/, { token: 'string.quote', next: '@string_double' }],
      [/'/, { token: 'string.quote', next: '@string_single' }]
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [escapes, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', next: '@pop' }]
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape.invalid'],
      [/'/, { token: 'string.quote', next: '@pop' }]
    ],

    multistring_double: [
      [/"""/, { token: 'string.quote', next: '@pop' }],
      [/[^\\"]+/, 'string'],
      [escapes, 'string.escape'],
      [/\\./, 'string.escape.invalid']
    ],

    multistring_single: [
      [/'''/, { token: 'string.quote', next: '@pop' }],
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape.invalid']
    ]
  }
}
