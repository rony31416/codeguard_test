import os

def collect_code(start_dir, output_file):
    # Extensions to include
    extensions = (
        '.py', '.json', '.ts','.html'
    )
    # Directories to skip
    skip_dirs = {'.git', '.venv', 'node_modules', '__pycache__', '.vscode', 'dist', 'build', '.next', '.mypy_cache','vsix', 'venv' , 'services',}

    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write('CODEGUARD - COMPLETE CODEBASE SNAPSHOT\n')
        outfile.write('=' * 60 + '\n')
        outfile.write('Root: ' + start_dir + '\n')
        outfile.write('=' * 60 + '\n\n')

        file_count = 0
        for root, dirs, files in os.walk(start_dir):
            # Skip unwanted directories (in-place modification)
            dirs[:] = sorted([d for d in dirs if d not in skip_dirs])

            for file in sorted(files):
                # Skip the output file itself
                file_path = os.path.join(root, file)
                if os.path.abspath(file_path) == os.path.abspath(output_file):
                    continue

                if not any(file.lower().endswith(ext) for ext in extensions):
                    continue

                rel_path = os.path.relpath(file_path, start_dir)
                rel_path = rel_path.replace(os.sep, '/')

                sep = '=' * 60
                outfile.write('\n' + sep + '\n')
                outfile.write('File: ' + rel_path + '\n')
                outfile.write(sep + '\n\n')

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write('Error reading file: ' + str(e) + '\n')

                outfile.write('\n\n')
                file_count += 1

        outfile.write('\n' + '=' * 60 + '\n')
        outfile.write('Total files collected: ' + str(file_count) + '\n')
        outfile.write('=' * 60 + '\n')

    return file_count


if __name__ == '__main__':
    target_dir = r'f:\Codeguard'
    output_path = r'f:\Codeguard\codeguard.txt'
    count = collect_code(target_dir, output_path)
    print('Done! Code collected to ' + output_path)
    print('Total files: ' + str(count))
    size = os.path.getsize(output_path)
    print('File size: {:,} bytes ({:.2f} MB)'.format(size, size / 1024 / 1024))
