# ⚡ Terminal Portfolio Workspace

An ultra-sleek, interactive portfolio themed around code workspace layouts. Features modern retro aesthetic tab navigation, real-time dynamic GitHub API integration, LeetCode performance statistics tracking, and a built-in customizable interactive quiz sandbox.

No manual HTML editing is required. The system compiles automatically using **GitHub Actions workflow parsing**.

---

## 🚀 Choose Your Setup Journey

Select the pathway that matches your comfort level:

### 🎨 Path A: No-Code/Click-and-Go (Easiest)
*No terminal command lines or code editors required.*

1. **Fork this Repository**: Click the **Fork** button at the top-right corner of this page to copy it to your GitHub profile.
2. **Enable Workflow Actions**:
   * Go to your newly forked repository's **Settings** tab.
   * Navigate to **Actions** -> **General** on the left menu.
   * Scroll down to **Workflow permissions**, select **Read and write permissions**, and click **Save**.
3. **Turn on GitHub Pages Hosting**:
   * Still in **Settings**, navigate to **Pages** (under the Code and automation sidebar).
   * Under **Build and deployment**, set the Source dropdown to **Deploy from a branch**.
   * Choose **`gh-pages`** as the branch (if it doesn't exist yet, it will automatically generate once you complete Step 4) and set folder to `/ (root)`. Click **Save**.
4. **Trigger Generation**: Go to **Issues** -> click **New Issue** -> fill out your profile details -> click **Submit** -> **Add the Label** `profile-setup`. Within 30 seconds, your portfolio will go live!

---

### 🧙‍♂️ Path B: The Terminal Wizard (Developer setup)
*Customize parameters directly from your local terminal workspace.*

1. **Clone & Install**:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/terminal-portfolio-generator.git](https://github.com/YOUR-USERNAME/terminal-portfolio-generator.git)
   cd terminal-portfolio-generator
   npm install