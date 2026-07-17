const fs = require('fs');
const path = require('path');

const issueBody = process.env.ISSUE_BODY || '';

// Known platforms get a proper profile URL built from just a username.
// Anything else (or a value that's already a full URL) is used as-is.
function buildSocialUrl(platform, value) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;

  const p = platform.trim().toLowerCase();
  if (p.includes('linkedin')) return `https://linkedin.com/in/${v}`;
  if (p === 'x' || p.includes('twitter')) return `https://x.com/${v}`;
  if (p.includes('instagram')) return `https://instagram.com/${v}`;
  if (p.includes('facebook')) return `https://facebook.com/${v}`;
  if (p.includes('reddit')) return `https://reddit.com/u/${v}`;
  if (p.includes('youtube')) return `https://youtube.com/@${v}`;
  if (p.includes('discord')) return `https://discord.com/users/${v}`;
  if (p.includes('telegram')) return `https://t.me/${v}`;
  // Website or anything unrecognized: trust the value as typed.
  return v;
}

// Generic "link" glyph used for every dynamic social platform, so we don't
// have to guess at (and risk misrepresenting) individual brand marks.
const SOCIAL_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';

function parseMarkdown(body) {
  const data = {
    name: '', title: '', accent: '#4CAE7F', status: '🟢 Active',
    bio: '', activity: '', tech: '', github: '', leetcode: '', quiz: '[]',
    socials: []
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
    socialLinks: body.match(/### Social Links\s+([\s\S]*?)(?=\n###|$)/),
    contactEmail: body.match(/### Contact Email\s+([\s\S]*?)(?=\n###|$)/),
    quiz: body.match(/### Quiz Data\s+([\s\S]*?)(?=\n###|$)/)
  };

  if (matches.name) data.name = matches.name[1].trim();
  if (matches.title) data.title = matches.title[1].trim();

  // The dropdown value looks like "Matrix Green (#4CAE7F)" — pull just the hex.
  if (matches.accent) {
    const raw = matches.accent[1].trim();
    const hexMatch = raw.match(/#([A-Fa-f0-9]{6})/);
    data.accent = hexMatch ? hexMatch[0] : data.accent;
  }

  if (matches.status) data.status = matches.status[1].trim();
  if (matches.bio) data.bio = matches.bio[1].trim();
  if (matches.activity) data.activity = matches.activity[1].trim();
  if (matches.github) data.github = matches.github[1].trim();
  if (matches.leetcode) data.leetcode = matches.leetcode[1].trim();

  if (matches.tech) {
    data.tech = matches.tech[1].split(',').map(t => `<span class="chip">${t.trim()}</span>`).join('\n');
  }

  if (matches.contactEmail) {
    const val = matches.contactEmail[1].trim();
    data.email = (val && val !== '_No response_') ? val : '';
  } else {
    data.email = '';
  }

  // The form collects quiz questions in "Q: / A: / X:" blocks separated by
  // "---", not JSON. Parse that format directly.
  if (matches.quiz) {
    const quizRaw = matches.quiz[1].trim();
    const blocks = quizRaw.split('---');
    const quizList = [];

    blocks.forEach(block => {
      const qMatch = block.match(/Q:\s*(.*)/);
      const aMatch = block.match(/A:\s*(.*)/);
      const xMatch = block.match(/X:\s*(.*)/);

      if (qMatch && aMatch) {
        const decoys = xMatch
          ? xMatch[1].split(',').map(d => d.trim()).filter(d => d.length > 0)
          : [];

        if (decoys.length > 0) {
          quizList.push({
            q: qMatch[1].trim(),
            correct: aMatch[1].trim(),
            decoys: decoys
          });
        }
      }
    });

    data.quiz = quizList.length > 0 ? JSON.stringify(quizList) : '[]';
  }

  // Social Links textarea: one "Platform: value" per line. Order of entry
  // is preserved and duplicates/blank lines are ignored.
  if (matches.socialLinks) {
    const raw = matches.socialLinks[1].trim();
    if (raw && raw !== '_No response_') {
      raw.split('\n').forEach(line => {
        const m = line.match(/^\s*([^:]+):\s*(.+)$/);
        if (m) {
          const platform = m[1].trim();
          const value = m[2].trim();
          if (platform && value) {
            data.socials.push({ platform, value });
          }
        }
      });
    }
  }

  return data;
}

function generateHTML() {
  const values = parseMarkdown(issueBody);
  const templatePath = path.join(__dirname, '../template.html');
  const outputPath = path.join(__dirname, '../index.html');

  let html = fs.readFileSync(templatePath, 'utf8');

  // Build dynamic social link cards from whatever the user listed.
  let socialLinksHTML = '';
  values.socials.forEach(({ platform, value }) => {
    const url = buildSocialUrl(platform, value);
    socialLinksHTML += `
    <a class="social-link" href="${url}" target="_blank" rel="noopener">
      ${SOCIAL_ICON}
      <span>${platform}: ${value}</span>
    </a>`;
  });

  const emailValue = values.email || '';
  const leetcodeValue = values.leetcode || '';

  html = html.replace(/\{\{NAME\}\}/g, values.name)
             .replace(/\{\{TITLE\}\}/g, values.title)
             .replace(/\{\{ACCENT_COLOR\}\}/g, values.accent)
             .replace(/\{\{STATUS_TEXT\}\}/g, values.status)
             .replace(/\{\{BIO\}\}/g, values.bio)
             .replace(/\{\{CURRENT_ACTIVITY\}\}/g, values.activity)
             .replace(/\{\{TECH_STACK_CHIPS\}\}/g, values.tech)
             .replace(/\{\{GITHUB_USERNAME\}\}/g, values.github)
             .replace(/\{\{LEETCODE_USERNAME\}\}/g, leetcodeValue)
             .replace(/\{\{LEETCODE_DISPLAY\}\}/g, leetcodeValue ? 'flex' : 'none')
             .replace(/\{\{CONTACT_EMAIL\}\}/g, emailValue)
             .replace(/\{\{EMAIL_DISPLAY\}\}/g, emailValue ? 'flex' : 'none')
             .replace(/\{\{QUIZ_DATA_JSON\}\}/g, values.quiz)
             .replace(/\{\{SOCIAL_LINKS_BLOCK\}\}/g, socialLinksHTML);

  fs.writeFileSync(outputPath, html, 'utf8');
}

generateHTML();