# This file contains intentional style violations for testing Ruff
import os, sys, time  # Multiple imports on one line with extra spaces
import scipy


def bad_function(x, y, z):  # Poor spacing
    if x > y:  # Missing spaces around operator
        print("x is greater")  # Single quotes in double quote style
    unused_variable = 42  # Unused variable
    return x + y + z  # Missing spaces


class MyClass:  # Extra spaces
    def __init__(self, name):  # Missing space after comma
        self.name = name  # Missing spaces around equals


# Long line that exceeds the recommended limit - this is intentionally a very long line that should trigger a line length warning from ruff
very_long_variable_name_that_makes_this_line_too_long = "this is a very long string that when combined with the variable name makes this line exceed the normal length limits"


def function_with_bad_formatting(a, b, c, d, e, f):
    result = a + b + c + d + e + f
    if result > 10:
        if result > 20:
            if result > 30:
                return "too nested"
    return result
