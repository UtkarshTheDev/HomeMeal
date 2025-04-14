#!/bin/bash

# Function to add default export to a file if it doesn't have one
add_default_export() {
  local file=$1
  local component_name=$(basename "$file" .tsx)
  
  # Convert kebab-case to PascalCase for component name
  component_name=$(echo "$component_name" | sed -E 's/(^|-)([a-z])/\U\2/g')
  
  # Check if file already has a default export
  if ! grep -q "export default" "$file"; then
    # Add default export at the end of the file
    echo -e "\nexport default $component_name;" >> "$file"
    echo "Added default export to $file"
  else
    echo "File $file already has a default export"
  fi
}

# Process all .tsx files in the app directory
find /home/utkarsh/development/HomeMeal/app -name "*.tsx" | while read file; do
  add_default_export "$file"
done

echo "Done adding default exports to all files"
