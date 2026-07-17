const fs = require('fs');
const path = require('path');

const issueBody = process.env.ISSUE_BODY || '';

function parseMarkdown(body) {
  const data = {
    name: '', title: '', accent: '#4CAE7F', status: '🟢 Active',
    bio: '', activity: '', tech: '', github: '', leetcode: '', email: '', quiz: '[]'
  };

  const matches = {
    name: body.match(/### Name\s+([\s\S]*?)(?=\n###|$)/),
    title: body.match(/### Title\s+([\s\S]*?)(?=\n###|$)/),
    accent: body.match(/### Accent Color\s+([\s\S]*?)(?=\n###|$)/),
    status: body.match(/### Status Text\s+([\s\S]*?)(?=\n###|$)/),
    bio: body.match(/### Bio\s+([\s\S]*?)(?=\n###|$)/),
    activity: body.match(/### Current Activity\s+([\s\S]*?)(?=\n###|$)/),
    tech: body.match(/### Tech Stack\s+([\s\S]*?)(?=\n###|$)/),
    github: body.match(/### GitHub Username\s+([\s\S]*?)(?=\n###|$)/),
    leetcode: body.match(/### LeetCode Username\s+([\s\S]*?)(?=\n###|$)/),
    email: body.match(/### Contact Email\s+([\s\S]*?)(?=\n###|$)/),
    quiz: body.match(/### Quiz Data\s+([\s\S]*?)(?=\n###|$)/)
  };

  if (matches.name) data.name = matches.name[1].trim();
  if (matches.title) data.title = matches.title[1].trim();
  if (matches.accent) data.accent = matches.accent[1].trim();
  if (matches.status) data.status = matches.status[1].trim();
  if (matches.bio) data.bio = matches.bio[1].trim();
  if (matches.activity) data.activity = matches.activity[1].trim();
  if (matches.github) data.github = matches.github[1].trim();
  if (matches.leetcode) data.leetcode = matches.leetcode[1].trim();
  if (matches.email) data.email = matches.email[1].trim();
  
  if (matches.tech) {
    const chips = matches.tech[1].split(',').map(t => `<span class="chip">${t.trim()}</span>`).join('\n');
    data.tech = chips;
  }
  
  if (matches.quiz) {
    try {
      // Validate that it is safe, real JSON data
      const cleanJson = matches.quiz[1].trim();
      JSON.parse(cleanJson); 
      data.quiz = cleanJson;
    } catch(e) {
      data.quiz = '[]';
    }
  }

  return data;
}

function generateHTML() {
  const values = parseMarkdown(issueBody);
  const templatePath = path.join(__dirname, '../template.html');
  const outputPath = path.join(__dirname, '../index.html');

  let html = fs.readFileSync(templatePath, 'utf8');

  // Multi-target dynamic replacement engine matching your exact template definitions
  html = html.replace(/\{\{NAME\}\}/g, values.name)
             .replace(/\{\{TITLE\}\}/g, values.title)
             .replace(/\{\{ACCENT_COLOR\}\}/g, values.accent)
             .replace(/\{\{STATUS_TEXT\}\}/g, values.status)
             .replace(/\{\{BIO\}\}/g, values.bio)
             .replace(/\{\{CURRENT_ACTIVITY\}\}/g, values.activity)
             .replace(/\{\{TECH_STACK_CHIPS\}\}/g, values.tech)
             .replace(/\{\{GITHUB_USERNAME\}\}/g, values.github)
             .replace(/\{\{LEETCODE_USERNAME\}\}/g, values.leetcode)
             .replace(/\{\{CONTACT_EMAIL\}\}/g, values.email)
             .replace(/\{\{QUIZ_DATA_JSON\}\}/g, values.quiz)
             .replace(/\{\{LEETCODE_DISPLAY\}\}/g, values.leetcode ? 'block' : 'none')
             .replace(/\{\{EMAIL_DISPLAY\}\}/g, values.email ? 'flex' : 'none');

  fs.writeFileSync(outputPath, html, 'utf8');
}

generateHTML();