#!/usr/bin/env python3
"""
Simple script to concatenate all files in the outputs folder
Usage: python concat_all.py <output_filename>
"""

import os
import sys
from pathlib import Path

def concat_all_outputs(output_file):
    """Concatenate all markdown files in outputs folder"""
    
    outputs_dir = Path("outputs")
    
    # Get all .md files in outputs directory
    md_files = sorted(outputs_dir.glob("*.md"))
    
    if not md_files:
        print("No markdown files found in outputs directory!")
        return
    
    print(f"Concatenating {len(md_files)} files:")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for i, file_path in enumerate(md_files):
            print(f"  - {file_path.name}")
            
            # Add separator between files (except first one)
            if i > 0:
                outfile.write("\n\n" + "="*60 + "\n")
                outfile.write(f"FILE: {file_path.name}\n")
                outfile.write("="*60 + "\n\n")
            
            # Read and write file content
            with open(file_path, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
    
    # Show result
    file_size = os.path.getsize(output_file)
    print(f"\nCreated: {output_file}")
    print(f"Size: {file_size:,} bytes")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python concat_all.py <output_filename>")
        print("Example: python concat_all.py combined_files.md")
        sys.exit(1)
    
    output_filename = sys.argv[1]
    concat_all_outputs(output_filename)