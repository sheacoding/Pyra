# Debug test script for Pyra IDE
# Instructions:
# 1. Set breakpoints on lines 8, 12, and 17
# 2. Start debugging
# 3. Use Continue/Step Over/Step Into to navigate
# 4. Check variable values in the debug panel

def calculate(a, b):
    result = a + b  # Breakpoint here (line 8)
    return result

def main():
    print("Starting debugger test")
    x = 10  # Breakpoint here (line 12)
    y = 20

    numbers = [1, 2, 3, 4, 5]
    total = 0
    for num in numbers:  # Breakpoint here (line 17)
        total += num

    result = calculate(x, y)

    # Test complex data structures
    data = {
        "name": "Pyra IDE",
        "version": "1.0",
        "features": ["debugging", "syntax highlighting", "linting"],
        "config": {
            "theme": "catppuccin-mocha",
            "fontSize": 14
        }
    }

    print(f"Sum of x and y: {result}")
    print(f"Sum of numbers: {total}")
    print(f"Project: {data['name']}")
    print("Debug test completed successfully!")

if __name__ == "__main__":
    main()
