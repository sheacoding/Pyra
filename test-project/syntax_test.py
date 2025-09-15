# Python syntax highlighting test file
# This file tests various Python syntax elements

# Import statements
import os
import sys
from typing import List, Dict, Optional, Union
from collections import defaultdict
import numpy as np

# Constants
DEBUG = True
MAX_SIZE = 1000
API_KEY = "sk-1234567890"
PI = 3.14159


# Class definition
class MyClass:
    """A sample class with various features"""

    class_variable = "shared"

    def __init__(self, name: str, value: int = 0):
        """Initialize the class"""
        self.name = name
        self.value = value
        self._private = "hidden"

    @property
    def formatted_name(self) -> str:
        """Property decorator example"""
        return f"Name: {self.name}"

    @staticmethod
    def static_method(x: float, y: float) -> float:
        """Static method example"""
        return x + y

    @classmethod
    def from_dict(cls, data: Dict[str, any]):
        """Class method example"""
        return cls(data.get("name", ""), data.get("value", 0))

    def __str__(self) -> str:
        """String representation"""
        return f"MyClass({self.name}, {self.value})"

    def __repr__(self) -> str:
        """Repr representation"""
        return self.__str__()


# Function definitions
def simple_function():
    """A simple function"""
    pass


def complex_function(
    param1: str, param2: int = 10, *args: tuple, **kwargs: dict
) -> Optional[Dict[str, Union[str, int]]]:
    """A complex function with various parameter types"""
    result = {}

    # String operations
    single_quote = "single quoted string"
    double_quote = "double quoted string"
    triple_quote = """
    Multi-line
    string
    """
    f_string = f"Formatted: {param1} and {param2}"
    raw_string = r"Raw string with \n no escapes"

    # Numbers
    integer = 42
    float_num = 3.14
    scientific = 1.5e-10
    binary = 0b1010
    octal = 0o755
    hexadecimal = 0xFF

    # Collections
    my_list = [1, 2, 3, 4, 5]
    my_tuple = (1, 2, 3)
    my_set = {1, 2, 3}
    my_dict = {"key": "value", "number": 42}

    # Control flow
    if param2 > 0:
        result["positive"] = True
    elif param2 < 0:
        result["negative"] = True
    else:
        result["zero"] = True

    # Loops
    for i in range(5):
        if i == 2:
            continue
        elif i == 4:
            break
        result[f"item_{i}"] = i

    while len(result) < 10:
        result[f"extra_{len(result)}"] = "filled"

    # Exception handling
    try:
        risky_operation = 10 / param2
    except ZeroDivisionError as e:
        print(f"Error: {e}")
    except Exception as e:
        raise ValueError(f"Unexpected error: {e}")
    finally:
        print("Cleanup")

    # Comprehensions
    list_comp = [x * 2 for x in range(10) if x % 2 == 0]
    dict_comp = {k: v for k, v in enumerate(range(5))}
    set_comp = {x for x in range(10) if x > 5}

    # Generator expression
    gen_exp = (x**2 for x in range(10))

    # Lambda functions
    square = lambda x: x**2
    add = lambda x, y: x + y

    # With statement
    with open("test.txt", "w") as f:
        f.write("test")

    # Assert statement
    assert param2 != 0, "Parameter must not be zero"

    # Return statement
    return result if result else None


# Async/await syntax
async def async_function():
    """Async function example"""
    await some_async_operation()
    return "done"


# Generator function
def generator_function():
    """Generator example"""
    for i in range(10):
        yield i**2


# Decorator usage
@decorator_example
@another_decorator(param="value")
def decorated_function():
    """Function with decorators"""
    pass


# Global and nonlocal
global_var = "global"


def outer_function():
    nonlocal_var = "nonlocal"

    def inner_function():
        nonlocal nonlocal_var
        global global_var
        nonlocal_var = "modified"
        global_var = "modified"

    inner_function()


# Type hints and annotations
def typed_function(
    text: str,
    number: int | float,
    items: List[str],
    mapping: Dict[str, int],
    optional: Optional[str] = None,
) -> Union[str, None]:
    """Function with comprehensive type hints"""
    return text if optional else None


# Match statement (Python 3.10+)
def match_example(value):
    match value:
        case 0:
            return "zero"
        case 1 | 2 | 3:
            return "small"
        case [x, y]:
            return f"list with {x} and {y}"
        case {"key": value}:
            return f"dict with key={value}"
        case _:
            return "other"


# Walrus operator (Python 3.8+)
if (n := len(my_list)) > 10:
    print(f"List is too long ({n} elements)")

# Main execution
if __name__ == "__main__":
    print("Testing syntax highlighting")
    obj = MyClass("Test", 42)
    print(obj)
    result = complex_function("test", 5)
    print(result)
