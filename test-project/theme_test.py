#!/usr/bin/env python3
"""Theme Test File - Check syntax highlighting for all themes"""

import sys
import time
from typing import Optional, List, Dict, Union

# Constants
DEBUG = True
MAX_RETRIES = 3
API_KEY = "test_api_key_12345"

class ColorTester:
    """Test class for syntax highlighting"""

    def __init__(self, name: str, value: int = 0):
        self.name = name  # Instance variable
        self._value = value  # Private variable
        self.__secret = "hidden"  # Name mangling

    @property
    def value(self) -> int:
        """Property decorator test"""
        return self._value

    @value.setter
    def value(self, val: int) -> None:
        if val < 0:
            raise ValueError("Value must be positive")
        self._value = val

    @staticmethod
    def static_method() -> str:
        """Static method test"""
        return "Static method result"

    @classmethod
    def class_method(cls) -> 'ColorTester':
        """Class method test"""
        return cls("Class instance")

    def normal_method(self, param1: str, param2: float = 3.14) -> Dict[str, any]:
        """Normal method with type hints"""
        result = {
            'string': "Double quoted string",
            'single': 'Single quoted string',
            'fstring': f"F-string with {param1}",
            'raw': r"Raw string \n \t",
            'triple': """Triple quoted
            multiline string""",
            'number_int': 42,
            'number_float': 3.14159,
            'number_hex': 0xFF00FF,
            'number_oct': 0o755,
            'number_bin': 0b1010,
            'number_sci': 1.23e-4,
            'boolean_true': True,
            'boolean_false': False,
            'none_value': None,
        }
        return result

# Function definitions
def test_function(x: int, y: int = 10) -> int:
    """Test function with default parameter"""
    # Single line comment
    result = x + y * 2 - 1
    return result

async def async_function(data: List[str]) -> None:
    """Async function test"""
    for item in data:
        await process_item(item)
        yield item

# Control flow examples
def control_flow_test():
    """Test various control flow keywords"""
    try:
        if DEBUG:
            print("Debug mode enabled")
        elif MAX_RETRIES > 0:
            print("Retries available")
        else:
            print("Normal mode")

        for i in range(5):
            if i == 2:
                continue
            elif i == 4:
                break
            print(i)

        while True:
            user_input = input("Enter command: ")
            if user_input == "quit":
                break

    except ValueError as e:
        print(f"Error occurred: {e}")
    except Exception:
        raise
    finally:
        print("Cleanup")

    with open("file.txt", "r") as f:
        content = f.read()

    assert DEBUG is True, "Debug should be enabled"

    match user_input:
        case "start":
            return "Starting..."
        case "stop":
            return "Stopping..."
        case _:
            return "Unknown command"

# Lambda and comprehensions
lambda_func = lambda x, y: x * y + 2
list_comp = [x ** 2 for x in range(10) if x % 2 == 0]
dict_comp = {k: v for k, v in enumerate(range(5))}
set_comp = {x for x in "hello" if x != 'l'}
gen_exp = (x * 2 for x in range(5))

# Operators
arithmetic = 10 + 5 - 3 * 2 / 4 // 2 % 3 ** 2
comparison = 5 > 3 < 10 >= 5 <= 10 == 10 != 5
logical = True and False or not None
bitwise = 0b1010 & 0b1100 | 0b0011 ^ 0b0101 << 2 >> 1 ~ 0b1111
assignment = x := 10  # Walrus operator
membership = "a" in "abc" and "d" not in "abc"
identity = None is None and [] is not []

# Decorators
@property
@staticmethod
@classmethod
def decorated_function():
    pass

# Special methods and attributes
if __name__ == "__main__":
    print(__file__)
    print(__doc__)

    # Create instance
    tester = ColorTester("Test")
    tester.value = 100

    # Call methods
    print(ColorTester.static_method())
    print(ColorTester.class_method())
    print(tester.normal_method("param", 2.718))

    # Test control flow
    control_flow_test()