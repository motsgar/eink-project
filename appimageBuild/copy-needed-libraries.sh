#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <AppDir>"
    exit 1
fi

APPDIR="$1"
SCRIPT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

IGNORE_FILE="/library_ignore_list.txt"

echo "Copying needed libraries to $APPDIR"

# Read the ignore list into an array
readarray -t ignore_list < "$IGNORE_FILE"

# Filter out libraries listed in the ignore file
filter_libraries() {
    local libraries=("$@")
    local filtered_libraries=()

    for lib in "${libraries[@]}"; do
        # Check if the library is in the ignore list
        if ! grep -Fxq "$lib" <<< "${ignore_list[@]}"; then
            filtered_libraries+=("$lib")
        fi
    done

    # Return the filtered libraries
    echo "${filtered_libraries[@]}"
}

# This technically works, but since everything has all the dependencies until libc etc,
# It is not actually what we want.
: '
list_recursive_so_files() {
    # Ensure at least one package is provided
    if [ "$#" -eq 0 ]; then
        echo "Usage: list_recursive_so_files <package-name> [package-name...]"
        return 1
    fi

    # Function to find all .so files for a single package
    find_so_files() {
        local package=$1

        # Get all files installed by the package
        local files
'
#        files=$(dpkg-query -L "$package" 2>/dev/null | grep -E '\.so($|\.)')
: '
        # List unique paths
        echo "$files"
    }

    # Recursive function to find dependencies and their files
    find_recursive_so_files() {
        local package=$1
        local visited=()
        local queue=("$package")

        while [ "${#queue[@]}" -gt 0 ]; do
            local current=${queue[0]}
            queue=("${queue[@]:1}")

            # Skip already visited packages
            if [[ " ${visited[*]} " == *" $current "* ]]; then
                continue
            fi
            visited+=("$current")

            # List .so files for the current package
            find_so_files "$current"

            # Get dependencies for the current package and add to the queue
            local dependencies
'
#            dependencies=$(apt-cache depends "$current" 2>/dev/null | grep "Depends:" | awk '{print $2}')
: '
            queue+=($dependencies)
        done
    }

    # Process each provided package
    for package in "$@"; do
        find_recursive_so_files "$package"
    done | sort -u
}

packages=(
    libpixman-1-dev
    libcairo2-dev
    libjpeg-dev
    libpango1.0-dev
    libgif-dev
    librsvg2-dev
)


# Get the list of libraries recursively
libraries=$(list_recursive_so_files "${packages[@]}")

# Filter out ignored libraries
filtered_libraries=$(filter_libraries $libraries)
'

raw_libraries=(
    libpixman-1.so
    libcairo.so.2
    libjpeg.so.8
    libpango-1.0.so.0
    libgif.so.7
    librsvg-2.so.2
)

libraries=()
lib_dirs=("/usr/lib" "/usr/lib/$(uname -m)-linux-gnu" "/usr/lib64")

echo "Filtering libraries"

for lib in "${raw_libraries[@]}"; do
    echo "Checking $lib"
    for dir in "${lib_dirs[@]}"; do
        echo "Checking $dir/$lib"
        if [ -f "$dir/$lib" ]; then
            echo "Found $dir/$lib"
            libraries+=("$dir/$lib")
            break
        fi
    done
done

# Copy all filtered libraries to the AppDir¨
mkdir -p "$APPDIR"/usr/lib
for library in "${libraries[@]}"; do
    echo "Copying $library"
    cp "$library" "$APPDIR"/usr/lib
done
