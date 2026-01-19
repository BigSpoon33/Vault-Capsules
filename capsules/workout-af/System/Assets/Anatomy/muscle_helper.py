#!/usr/bin/env python3
"""
Muscle Mapper Helper Script
Extracts muscle paths from SVG and helps generate mapping JSON
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path


class MuscleMapper:
    def __init__(self, svg_path):
        self.svg_path = Path(svg_path)
        self.tree = ET.parse(self.svg_path)
        self.root = self.tree.getroot()
        self.muscle_color = "#f39079"  # The muscle color in your SVG

    def extract_muscle_paths(self):
        """Extract all paths with muscle color"""
        muscle_paths = []

        for elem in self.root.iter():
            if elem.tag.endswith('path'):
                style = elem.get('style', '')
                if self.muscle_color in style:
                    path_id = elem.get('id')
                    d = elem.get('d', '')
                    muscle_paths.append({
                        'id': path_id,
                        'd': d,
                        'style': style
                    })

        return muscle_paths

    def export_path_ids(self, output_file):
        """Export just the path IDs to a text file"""
        paths = self.extract_muscle_paths()

        with open(output_file, 'w') as f:
            f.write("# Muscle Path IDs\n")
            f.write(f"# Total: {len(paths)}\n\n")
            for i, p in enumerate(paths, 1):
                f.write(f"{i:2d}. {p['id']}\n")

        print(f"✓ Exported {len(paths)} path IDs to {output_file}")
        return len(paths)

    def create_template_mapping(self, output_file):
        """Create a template JSON mapping file"""
        paths = self.extract_muscle_paths()

        # Create template structure
        mapping = {
            "_instructions": "Fill in the muscle information for each path ID below",
            "_total_paths": len(paths),
            "example_chest": {
                "label": "Pectoralis Major",
                "svg_ids": ["path2223"],
                "view": "anterior"
            }
        }

        # Add placeholders for each path
        for i, p in enumerate(paths[:5]):  # Just first 5 as examples
            mapping[f"muscle_{i+1}"] = {
                "label": "FILL_IN_MUSCLE_NAME",
                "svg_ids": [p['id']],
                "view": "anterior_or_posterior"
            }

        with open(output_file, 'w') as f:
            json.dump(mapping, f, indent=2)

        print(f"✓ Created template mapping: {output_file}")

    def validate_mapping(self, mapping_file):
        """Validate a muscle mapping JSON file"""
        with open(mapping_file, 'r') as f:
            mapping = json.load(f)

        all_muscle_paths = {p['id'] for p in self.extract_muscle_paths()}
        mapped_paths = set()
        errors = []

        for muscle_key, data in mapping.items():
            if muscle_key.startswith('_'):
                continue

            # Check required fields
            if 'label' not in data:
                errors.append(f"{muscle_key}: missing 'label' field")
            if 'svg_ids' not in data:
                errors.append(f"{muscle_key}: missing 'svg_ids' field")
            if 'view' not in data:
                errors.append(f"{muscle_key}: missing 'view' field")

            # Check path IDs exist
            for path_id in data.get('svg_ids', []):
                if path_id not in all_muscle_paths:
                    errors.append(f"{muscle_key}: path '{path_id}' not found in SVG")
                mapped_paths.add(path_id)

        # Check for unmapped paths
        unmapped = all_muscle_paths - mapped_paths
        if unmapped:
            print(f"\n⚠️  {len(unmapped)} unmapped paths:")
            for path_id in sorted(unmapped):
                print(f"   - {path_id}")

        # Report errors
        if errors:
            print(f"\n❌ {len(errors)} validation errors:")
            for error in errors:
                print(f"   - {error}")
            return False
        else:
            print(f"\n✓ Mapping is valid!")
            print(f"  - {len(mapped_paths)}/{len(all_muscle_paths)} paths mapped")
            return True

    def export_paths_to_separate_svg(self, output_dir):
        """Export each muscle path as a separate SVG file (useful for inspection)"""
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        paths = self.extract_muscle_paths()
        viewbox = self.root.get('viewBox')

        for p in paths:
            svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}">
    <rect width="100%" height="100%" fill="white"/>
    <path id="{p['id']}" d="{p['d']}" style="{p['style']}"/>
</svg>'''

            output_file = output_dir / f"{p['id']}.svg"
            with open(output_file, 'w') as f:
                f.write(svg_content)

        print(f"✓ Exported {len(paths)} individual SVG files to {output_dir}")


def main():
    """Command line interface"""
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python muscle_helper.py extract        - Extract path IDs")
        print("  python muscle_helper.py template        - Create template mapping")
        print("  python muscle_helper.py validate <file> - Validate mapping JSON")
        print("  python muscle_helper.py separate        - Export individual SVGs")
        return

    svg_file = "Muscles_front_and_back.svg"
    mapper = MuscleMapper(svg_file)

    command = sys.argv[1]

    if command == "extract":
        mapper.export_path_ids("muscle_path_ids.txt")

    elif command == "template":
        mapper.create_template_mapping("muscle_mapping_template.json")

    elif command == "validate":
        if len(sys.argv) < 3:
            print("Error: Please provide mapping file to validate")
            return
        mapper.validate_mapping(sys.argv[2])

    elif command == "separate":
        mapper.export_paths_to_separate_svg("individual_muscles")

    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
