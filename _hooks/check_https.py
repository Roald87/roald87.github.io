#!/usr/bin/env python

import argparse

def fix_file(filename):
    # Open the file
    with open(filename, 'r') as fd:
        original_lines = fd.readlines()
    new_lines = []
    changed = False
    # For each line in the file check if a http:// is found. 
    # If so, replace it with https://
    for line in original_lines:
        if "http://" in line:
            line = line.replace("http://", "https://")
            changed = True
        new_lines.append(line)

    # If a line was changed, print a message in the console and overwrite the 
    # original file with the fixed one.
    if changed:
        print(f'Fixing {filename}')
        with open(filename, 'w') as fd:
            fd.write(''.join(new_lines))


def main(args=None):
    # Parse the filename arguments:
    # e.g. Namespace(filenames=['README.md', 'about.md'])
    if args is None:
        parser = argparse.ArgumentParser()
        parser.add_argument('filenames', nargs='*')
        args = parser.parse_args()
    # For each filename execute the file fixer on it
    try:
        for filename in args.filenames:
            fix_file(filename)
        # Return 0, which means the hook executed successfully and pre-commit is happy
        return 0
    except Exception as exc:
        print(exc)
        # If something went wrong return an error code other than 0 and pre-commit
        # then knows something went wrong
        return 1


if __name__ == "__main__":
    exit(main())
