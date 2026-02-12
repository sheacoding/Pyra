#!/usr/bin/env python3
"""
CLI Application Template
"""

import argparse
import sys
from typing import Optional

def main() -> int:
    """Main entry point for the CLI application."""
    parser = argparse.ArgumentParser(
        description="CLI Application created with Pyra IDE"
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 1.0.0"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "command",
        nargs="?",
        default="hello",
        help="Command to execute (default: hello)"
    )

    args = parser.parse_args()

    if args.verbose:
        print(f"Executing command: {args.command}")

    if args.command == "hello":
        print("Hello from your CLI application!")
        return 0
    else:
        print(f"Unknown command: {args.command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
