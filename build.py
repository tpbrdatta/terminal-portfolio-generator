import os
import json
import re

def parse_issue_and_build():
    # 1. Grab the raw form response from the GitHub environment
    issue_body = os.environ.get("ISSUE_BODY", "")
    if not issue_body:
        print("Error: No issue context found.")
        return

    # 2. Professional Parsing Helper
    def extract_field(field_name, text):
        pattern = rf"### {field_name}\s*\n+(.*?)(?=\n+### |\Z)"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            # If the user leaves an optional field blank, GitHub passes "_No response_"
            if val == "_No response_" or not val:
                return ""
            return val
        return ""

    # 3. Extract the primary fields
    name = extract_field("Full Name", issue_body)
    title = extract_field("Job Title / Core Focus", issue_body)
    status_text = extract_field("Current Status Header", issue_body)
    bio = extract_field("Biography", issue_body)
    current_activity = extract_field("What You Are Doing Now \\(now.log\\)", issue_body)
    
    # --- UPGRADED COLOR DROPDOWN PARSER ---
    accent_raw = extract_field("Choose Your Theme Color", issue_body)
    color_match = re.search(r"\((#[A-Fa-f0-9]{6})\)", accent_raw)
    accent_color = color_match.group(1) if color_match else "#D4A24C"
    # --------------------------------------

    github_user = extract_field("GitHub Username", issue_body)
    leetcode_user = extract_field("LeetCode Username \\(Optional\\)", issue_body)
    contact_email = extract_field("Contact Email Address \\(Optional\\)", issue_body)
    
    # 4. Handle arrays safely (Tech Stack)
    tech_raw = extract_field("Tech Stack & Tools \\(Comma separated\\)", issue_body)
    tech_stack = [tech.strip() for tech in tech_raw.split(",") if tech.strip()]

    # 5. Professional Quiz Parser
    quiz_raw = extract_field("Personality Quiz Configuration \\(Up to 4 Questions\\)", issue_body)
    quiz_blocks = quiz_raw.split("---")
    quiz_list = []
    
    for block in quiz_blocks:
        q_match = re.search(r"Q:\s*(.*)", block)
        a_match = re.search(r"A:\s*(.*)", block)
        x_match = re.search(r"X:\s*(.*)", block)
        if q_match and a_match:
            decoys = [d.strip() for d in x_match.group(1).split(",") if d.strip()] if x_match else []
            if len(decoys) > 0:
                quiz_list.append({
                    "q": q_match.group(1).strip(),
                    "correct": a_match.group(1).strip(),
                    "decoys": decoys
                })

    if not quiz_list:
        quiz_list = [{
            "q": "System verification test: Is this profile live?",
            "correct": "Yes",
            "decoys": ["No", "Error", "Offline"]
        }]

    # 6. Open base template layout code
    if not os.path.exists("template.html"):
        print("Error: template.html file missing in root directory.")
        return

    with open("template.html", "r") as f:
        html = f.read()

    # 7. Convert Arrays to UI elements
    tech_chips = "".join([f'<span class="chip">{tech}</span>' for tech in tech_stack])
    
    # 8. Inject mandatory structural values
    html = html.replace('{{NAME}}', name)
    html = html.replace('{{TITLE}}', title)
    html = html.replace('{{STATUS_TEXT}}', status_text if status_text else "Online")
    html = html.replace('{{BIO}}', bio)
    html = html.replace('{{CURRENT_ACTIVITY}}', current_activity)
    html = html.replace('{{ACCENT_COLOR}}', accent_color)
    html = html.replace('{{TECH_STACK_CHIPS}}', tech_chips)
    html = html.replace('{{GITHUB_USERNAME}}', github_user)
    html = html.replace('{{GITHUB_PROJECTS_BLOCK}}', '')
    
    html = html.replace('{{QUIZ_DATA_JSON}}', json.dumps(quiz_list))

    # 9. Professional Graceful Degradation (Handling Optional Cards)
    if leetcode_user:
        html = html.replace('{{LEETCODE_USERNAME}}', leetcode_user)
        html = html.replace('{{LEETCODE_DISPLAY}}', 'block')
    else:
        html = html.replace('{{LEETCODE_USERNAME}}', '')
        html = html.replace('{{LEETCODE_DISPLAY}}', 'none')

    if contact_email:
        html = html.replace('{{CONTACT_EMAIL}}', contact_email)
        html = html.replace('{{EMAIL_DISPLAY}}', 'flex')
    else:
        html = html.replace('{{CONTACT_EMAIL}}', '')
        html = html.replace('{{EMAIL_DISPLAY}}', 'none')

    # 10. Save pristine production artifact
    with open("index.html", "w") as f:
        f.write(html)
        
    print("Success: Processed form inputs and generated structural portfolio page safely.")

if __name__ == "__main__":
    parse_issue_and_build()