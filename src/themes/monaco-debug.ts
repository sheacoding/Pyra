// Diagnostic utility to check Monaco token names
export function debugMonacoTokens(monaco: any, code: string, language: string = 'python') {
  const tokens = monaco.editor.tokenize(code, language)
  const uniqueTokens = new Set<string>()

  tokens.forEach((line: any[]) => {
    line.forEach((token: any) => {
      uniqueTokens.add(token.type)
    })
  })

  console.log('🔍 Unique token types found:')
  Array.from(uniqueTokens).sort().forEach(token => {
    console.log(`  - ${token}`)
  })

  return Array.from(uniqueTokens)
}

// Test code for token analysis
export const pythonTestCode = `
# Comment
import sys
from typing import List

class MyClass:
    def __init__(self, name: str):
        self.name = name

    @property
    def value(self) -> int:
        return 42

def my_function(param1: str, param2: float = 3.14):
    """Docstring"""
    result = param1 + str(param2)
    return result

# Variables and constants
DEBUG = True
API_KEY = "test_key"
number = 123
float_num = 3.14

# Control flow
if DEBUG:
    print("Debug mode")
else:
    pass

for i in range(10):
    continue

while True:
    break

try:
    raise ValueError("Error")
except Exception as e:
    print(f"Error: {e}")
finally:
    pass
`.trim()