import re
import subprocess
import os

def run_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Stderr: {e.stderr}")
        return None

def parse_roadmap(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    milestones = []

    # Split by Milestone headers
    # regex to find ## Milestone X - Description
    sections = re.split(r'^## Milestone', content, flags=re.MULTILINE)

    # Skip the first section (header)
    for section in sections[1:]:
        lines = section.strip().split('\n')

        # First line is the milestone title
        # "1 – MIDI Control Integration" or similar
        header_line = lines[0].strip()
        milestone_title = f"Milestone {header_line}"

        print(f"Found Milestone: {milestone_title}")

        issues = []

        # Find the table
        # Table rows start with |
        for line in lines:
            if line.strip().startswith('|') and '---' not in line and 'Issue' not in line:
                # | **Issue Title** | Description |
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3:
                    title_raw = parts[1]
                    description = parts[2]

                    # Remove bold markdown
                    title = title_raw.replace('**', '')

                    issues.append({'title': title, 'body': description})

        milestones.append({'title': milestone_title, 'issues': issues})

    return milestones

def create_github_items(milestones):
    for m in milestones:
        title = m['title']

        # Create Milestone
        print(f"Creating/Checking Milestone: {title}")
        # Check if exists first to get ID, or create
        # gh release list doesn't give milestones.
        # gh api repos/:owner/:repo/milestones
        # Easier to just try create, if fails, assume exists? No, duplicate names fail.

        # Try to find existing
        milestone_number = None
        existing = run_command(f'gh milestone list --json number,title')
        if existing:
            import json
            data = json.loads(existing)
            for item in data:
                if item['title'] == title:
                    milestone_number = item['number']
                    print(f"  Milestone already exists: {milestone_number}")
                    break

        if not milestone_number:
            # Create it
            # Title might have spaces, quote it
            out = run_command(f'gh milestone create --title "{title}" --description "Milestone from Roadmap"')
            if out:
                # "http://github.com/user/repo/milestone/1"
                # Extract number
                match = re.search(r'/(\d+)$', out.strip())
                if match:
                    milestone_number = match.group(1)
                    print(f"  Created Milestone: {milestone_number}")
                else:
                    # sometimes it outputs just the number or nothing?
                    # Let's re-query or parse the output better if needed.
                    # Usually gh commands output the URL or the object.
                    pass

        if milestone_number:
            for issue in m['issues']:
                i_title = issue['title']
                i_body = issue['body']
                print(f"    Creating Issue: {i_title}")
                run_command(f'gh issue create --title "{i_title}" --body "{i_body}" --milestone "{milestone_number}"')

if __name__ == "__main__":
    roadmap_path = os.path.join(os.path.dirname(__file__), '../ROADMAP.md')
    roadmap_path = os.path.abspath(roadmap_path)

    if not os.path.exists(roadmap_path):
        print(f"Roadmap not found at {roadmap_path}")
        exit(1)

    data = parse_roadmap(roadmap_path)
    create_github_items(data)
