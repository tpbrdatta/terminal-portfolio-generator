const fs = require('fs');
const path = require('path');

const issueBody = process.env.ISSUE_BODY || '';

function parseMarkdown(body) {
  const data = {
    name: '', title: '', accent: '#4CAE7F', status: '🟢 Active',
    bio: '', activity: '', tech: '', github: '', leetcode: '', quiz: '[]',
    socials: {}, projects: []
  };

  const matches = {
    name: body.match(/### Full Name\s+([\s\S]*?)(?=\n###|$)/),
    title: body.match(/### Job Title \/ Core Focus\s+([\s\S]*?)(?=\n###|$)/),
    accent: body.match(/### Accent Color\s+([\s\S]*?)(?=\n###|$)/),
    status: body.match(/### Status Text\s+([\s\S]*?)(?=\n###|$)/),
    bio: body.match(/### Biography\s+([\s\S]*?)(?=\n###|$)/),
    activity: body.match(/### Current Activity\s+([\s\S]*?)(?=\n###|$)/),
    tech: body.match(/### Tech Stack\s+([\s\S]*?)(?=\n###|$)/),
    github: body.match(/### GitHub Username\s+([\s\S]*?)(?=\n###|$)/),
    leetcode: body.match(/### LeetCode Username\s+([\s\S]*?)(?=\n###|$)/),
    projects: body.match(/### Featured GitHub Projects\s+([\s\S]*?)(?=\n###|$)/),
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
  
  if (matches.tech) {
    data.tech = matches.tech[1].split(',').map(t => `<span class="chip">${t.trim()}</span>`).join('\n');
  }

  if (matches.projects && matches.projects[1].trim()) {
    data.projects = matches.projects[1].split(',').map(p => p.trim()).filter(p => p.length > 0);
  }
  
  if (matches.quiz) {
    try {
      const cleanJson = matches.quiz[1].trim();
      JSON.parse(cleanJson); 
      data.quiz = cleanJson;
    } catch(e) {
      data.quiz = '[]';
    }
  }

  const socialTargets = ['Contact Email', 'LinkedIn', 'X', 'Website'];
  socialTargets.forEach(target => {
    const regex = new RegExp(`### ${target}\\s+([\\s\\S]*?)(?=\\n###|$)`);
    const found = body.match(regex);
    if (found && found[1].trim()) {
      data.socials[target] = found[1].trim();
    }
  });

  return data;
}

function generateHTML() {
  const values = parseMarkdown(issueBody);
  const templatePath = path.join(__dirname, '../template.html');
  const outputPath = path.join(__dirname, '../index.html');

  let html = fs.readFileSync(templatePath, 'utf8');

  // Build the individual Project Repository visual layout
  let projectsHTML = '';
  if (values.projects.length > 0 && values.github) {
    values.projects.forEach(repo => {
      projectsHTML += `
      <div style="border: 1px dashed ${values.accent}80; padding: 10px; border-radius: 4px; background: rgba(0,0,0,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <a href="https://github.com/${values.github}/${repo}" target="_blank" style="color: ${values.accent}; font-weight: bold; text-decoration: none;">📦 ${repo}</a>
          <img src="https://img.shields.io/github/stars/${values.github}/${repo}?style=flat&color=${values.accent.replace('#','')}&label=stars" alt="stars" />
        </div>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #aaa;">Target repository link initialized. Click workspace node to view full codebase source tracking tree.</p>
      </div>`;
    });
  } else {
    projectsHTML = `<p style="color: #666;">No active feature repositories designated for pipeline build tracking.</p>`;
  }

  // Build Social links array
  let linksHTML = '';
  if (values.github) {
    linksHTML += `<div style="display: flex; align-items: center; gap: 10px;">
      <span style="color: ${values.accent}; min-width: 90px;">→ GitHub:</span>
      <a href="https://github.com/${values.github}" target="_blank" style="color: #fff; text-decoration: underline;">github.com/${values.github}</a>
    </div>`;
  }

  Object.keys(values.socials).forEach(key => {
    const val = values.socials[key];
    let url = val;
    if (key === 'Contact Email') url = `mailto:${val}`;
    else if (!val.startsWith('http://') && !val.startsWith('https://')) {
      if (key === 'LinkedIn') url = `https://linkedin.com/in/${val}`;
      if (key === 'Twitter' || key === 'X') url = `https://x.com/${val}`;
    }
    linksHTML += `<div style="display: flex; align-items: center; gap: 10px;">
      <span style="color: ${values.accent}; min-width: 90px;">→ ${key}:</span>
      <a href="${url}" target="_blank" style="color: #fff; text-decoration: underline;">${val}</a>
    </div>`;
  });

  const emailValue = values.socials['Contact Email'] || '';

  html = html.replace(/\{\{NAME\}\}/g, values.name)
             .replace(/\{\{TITLE\}\}/g, values.title)
             .replace(/\{\{ACCENT_COLOR\}\}/g, values.accent)
             .replace(/\{\{STATUS_TEXT\}\}/g, values.status)
             .replace(/\{\{BIO\}\}/g, values.bio)
             .replace(/\{\{CURRENT_ACTIVITY\}\}/g, values.activity)
             .replace(/\{\{TECH_STACK_CHIPS\}\}/g, values.tech)
             .replace(/\{\{GITHUB_USERNAME\}\}/g, values.github)
             .replace(/\{\{LEETCODE_USERNAME\}\}/g, values.leetcode)
             .replace(/\{\{CONTACT_EMAIL\}\}/g, emailValue)
             .replace(/\{\{EMAIL_DISPLAY\}\}/g, emailValue ? 'flex' : 'none')
             .replace(/\{\{QUIZ_DATA_JSON\}\}/g, values.quiz)
             .replace(/\{\{LEETCODE_DISPLAY\}\}/g, values.leetcode ? 'block' : 'none')
             .replace(/\{\{SOCIAL_LINKS_BLOCK\}\}/g, linksHTML)
             .replace(/\{\{GITHUB_PROJECTS_BLOCK\}\}/g, projectsHTML);

  fs.writeFileSync(outputPath, html, 'utf8');
}

generateHTML();