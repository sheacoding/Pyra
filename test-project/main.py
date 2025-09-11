import time
import sys

print("Hello from Pyra IDE!")
print("This is a test Python script.")

# Simple calculations
x = 10
y = 20
result = x + y

print(f"Result: {x} + {y} = {result}")

# Test error handling
try:
    # This will work
    division = result / 2
    print(f"Division result: {division}")
    
    # Uncomment this line to test error display
    # error_result = 1 / 0
except Exception as e:
    print(f"Error occurred: {e}")

print("Script completed successfully!")


while True:
    # Simple calculations
    x = 10
    y = 20
    result = x + y

    print(f"Result: {x} + {y} = {result}", flush=True)
    sys.stdout.flush()
    time.sleep(1)