const fs = require('fs');
const path = require('path');

const issueBody = process.env.ISSUE_BODY || '';

function normalizeAccentColor(input) {
  const map = {
    'Classic Gold (#D4A24C)': '#D4A24C',
    'Matrix Green (#4CAE7F)': '#4CAE7F',
    'Cyber Blue (#3B82F6)': '#3B82F6',
    'Cyberpunk Pink (#EC4899)': '#EC4899',
    'Deep Purple (#A855F7)': '#A855F7'
  };

  const value = (input || '').trim();
  if (!value) return '#4CAE7F';

  const hexMatch = value.match(/#([0-9a-fA-F]{6})/);
  if (hexMatch) return `#${hexMatch[1].toUpperCase()}`;

  return map[value] || '#4CAE7F';
}

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
    socialPlatform: body.match(/### Social Platform\s+([\s\S]*?)(?=\n###|$)/),
    socialUsername: body.match(/### Social Username \/ URL\s+([\s\S]*?)(?=\n###|$)/),
    additionalSocials: body.match(/### Additional Social Links\s+([\s\S]*?)(?=\n###|$)/),
    quiz: body.match(/### Quiz Data\s+([\s\S]*?)(?=\n###|$)/)
  };

  if (matches.name) data.name = matches.name[1].trim();
  if (matches.title) data.title = matches.title[1].trim();
  if (matches.accent) data.accent = normalizeAccentColor(matches.accent[1].trim());
  if (matches.status) data.status = matches.status[1].trim();
  if (matches.bio) data.bio = matches.bio[1].trim();
  if (matches.activity) data.activity = matches.activity[1].trim();
  if (matches.github) data.github = matches.github[1].trim();
  if (matches.leetcode) data.leetcode = matches.leetcode[1].trim();
  
  if (matches.tech) {
    data.tech = matches.tech[1].split(',').map(t => `<span class="chip">${t.trim()}</span>`).join('\n');
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

  if (matches.socialPlatform && matches.socialUsername) {
    const platform = matches.socialPlatform[1].trim();
    const username = matches.socialUsername[1].trim();
    if (platform && username && platform !== 'None') {
      data.socials[platform] = username;
    }
  }

  if (matches.additionalSocials) {
    const lines = matches.additionalSocials[1].split(/\n|,/).map(s => s.trim()).filter(Boolean);
    lines.forEach(line => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return;
      const platform = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (platform && value) data.socials[platform] = value;
    });
  }

  if (data.leetcode) {
    data.socials.LeetCode = data.leetcode;
  }

  return data;
}

function generateHTML() {
  const values = parseMarkdown(issueBody);
  const templatePath = path.join(__dirname, '../template.html');
  const outputPath = path.join(__dirname, '../index.html');

  let html = fs.readFileSync(templatePath, 'utf8');

  // Build dynamic social links for the contact section
  let linksHTML = '';
  Object.keys(values.socials).forEach(key => {
    const val = values.socials[key];
    if (!val || key === 'Contact Email') return;

    let url = val;
    const normalizedKey = key.toLowerCase();
    if (key === 'LinkedIn') url = `https://linkedin.com/in/${val}`;
    else if (key === 'Instagram') url = `https://instagram.com/${val}`;
    else if (key === 'Facebook') url = `https://facebook.com/${val}`;
    else if (key === 'X' || key === 'Twitter') url = `https://x.com/${val}`;
    else if (key === 'Reddit') url = `https://reddit.com/u/${val}`;
    else if (key === 'LeetCode') url = `https://leetcode.com/${val}/`;
    else if (key === 'Website' && !/^https?:\/\//i.test(val)) url = `https://${val}`;
    else if (!/^https?:\/\//i.test(val)) {
      url = `https://${val}`;
    }

    linksHTML += `<a class="social-link" href="${url}" target="_blank" rel="noopener">
      <span style="color: ${values.accent};">${key}</span>
      <span>${val}</span>
    </a>`;
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
             .replace(/\{\{CONTACT_LINKS_BLOCK\}\}/g, linksHTML);

  fs.writeFileSync(outputPath, html, 'utf8');
}

if (require.main === module) {
  generateHTML();
}

module.exports = {
  normalizeAccentColor,
  parseMarkdown,
  generateHTML
};