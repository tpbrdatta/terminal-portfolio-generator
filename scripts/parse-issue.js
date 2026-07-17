const fs = require('fs');
const path = require('path');

// Extract environment variable from GitHub Action
const issueBody = process.env.ISSUE_BODY || '';

function parseMarkdown(body) {
  const data = {
    name: 'Anonymous Hacker',
    title: 'Software Engineer',
    bio: 'No bio provided.',
    skills: [],
    projects: []
  };

  // Extract simple fields using Regex
  const nameMatch = body.match(/### Name\s+([\s\S]*?)(?=\n###|$)/);
  const titleMatch = body.match(/### Title\s+([\s\S]*?)(?=\n###|$)/);
  const bioMatch = body.match(/### Bio\s+([\s\S]*?)(?=\n###|$)/);
  const skillsMatch = body.match(/### Skills\s+([\s\S]*?)(?=\n###|$)/);
  const projectsMatch = body.match(/### Projects\s+([\s\S]*?)(?=\n###|$)/);

  if (nameMatch) data.name = nameMatch[1].trim();
  if (titleMatch) data.title = titleMatch[1].trim();
  if (bioMatch) data.bio = bioMatch[1].trim();

  if (skillsMatch) {
    data.skills = skillsMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  if (projectsMatch) {
    // Parse markdown lines as projects: "- [Name](URL) - Description"
    const lines = projectsMatch[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/-\s*\[(.*?)\]\((.*?)\)\s*-\s*(.*)/);
      if (match) {
        data.projects.push({
          name: match[1].trim(),
          url: match[2].trim(),
          description: match[3].trim()
        });
      }
    });
  }

  return data;
}

function generateHTML() {
  const parsedData = parseMarkdown(issueBody);
  const templatePath = path.join(__dirname, '../template.html');
  const outputPath = path.join(__dirname, '../index.html');

  if (!fs.existsSync(templatePath)) {
    console.error("Error: template.html not found!");
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Deep-Defense XSS: Injecting raw data as safe JSON into a <script> tag.
  // The front-end will render this strictly using .textContent bindings.
  const safeJsonPayload = JSON.stringify(parsedData).replace(/</g, '\\u003c');
  
  htmlContent = htmlContent.replace(
    '<script id="profile-data" type="application/json"></script>',
    `<script id="profile-data" type="application/json">${safeJsonPayload}</script>`
  );

  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log("Successfully generated index.html!");
}

generateHTML();