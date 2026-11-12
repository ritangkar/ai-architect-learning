# Deployment guide (for a first-time publisher)

This guide takes you from "the code is in my GitHub repository" to "the site is live on the internet", step by step, in plain text. You do not need to install anything on your computer. Everything happens in your web browser on github.com.

**Your values (detected from the repository's remote):**

| Item | Value |
|---|---|
| GitHub owner (user name) | `ritangkar` |
| Repository name | `ai-architect-learning` |
| Kind of site | Project site (the repository name is not `ritangkar.github.io`) |
| Where the site will be | **https://ritangkar.github.io/ai-architect-learning/** |
| Base path used by the build | `/ai-architect-learning` |

If you ever rename the repository or move it to another owner, the address changes. The build reads the owner and repository name from GitHub automatically while it runs on GitHub, so you do not need to edit any file for that, but your bookmarks and the address above will change.

## What "deploying" means here

The site is a set of ordinary files (web pages, scripts, styles). GitHub Pages is a free GitHub feature that serves such files at a web address. A small automated program on GitHub (called **GitHub Actions**) builds the files and uploads them to Pages every time you push to the `main` branch.

## Step 0: Back up your learning progress first (only if you already use the site)

Your progress is stored only in your browser. Publishing a new version does not delete it, but backing up costs one minute:

1. Open the site, then **Settings**.
2. Press **Export progress (JSON)**.
3. Keep the downloaded file `architect-lab-progress-YYYY-MM-DD.json` somewhere safe.

To restore later: Settings, **Import a backup file**, choose the file, then **Replace** (or **Merge** to combine with what is already there).

## Step 1: Open the repository settings

1. Go to **https://github.com/ritangkar/ai-architect-learning**.
2. Make sure you are signed in as `ritangkar` (or another account with admin rights on the repository).
3. Click the **Settings** tab (the one with a gear icon, at the right end of the row of tabs under the repository name). If you cannot see **Settings**, you do not have admin rights; ask the owner.

## Step 2: Find "Pages"

1. In the left sidebar of Settings, scroll to the section called **Code and automation**.
2. Click **Pages**.

The direct address is **https://github.com/ritangkar/ai-architect-learning/settings/pages**.

## Step 3: Choose GitHub Actions as the source

On the Pages screen you will see **Build and deployment**, and under it **Source** with a drop-down.

1. Open the **Source** drop-down.
2. Choose **GitHub Actions** (not "Deploy from a branch").
3. Nothing else needs to be filled in, and there is no Save button to find: choosing it saves immediately.

**Why GitHub Actions and not "Deploy from a branch"?** The site must be *built* (checked, tested, turned into web pages) before it can be served. The branch option can only serve files that are already built and committed. With Actions, GitHub builds on every push, runs the checks, and refuses to publish if the content is invalid.

If the drop-down is missing or greyed out: Pages may be unavailable for private repositories on some GitHub plans. Either make the repository public (Settings, scroll to the bottom, **Change repository visibility**) or upgrade the plan.

## Step 4: Start the first deployment

The workflow runs automatically when something is pushed to `main`. If everything is already on `main` and nothing new is coming, start it by hand:

1. Click the **Actions** tab of the repository.
2. In the left list, click **Deploy to GitHub Pages**. (If you see a yellow banner asking you to enable workflows, click the green button to enable them.)
3. Click **Run workflow** (a grey button on the right), make sure the branch says `main`, and click the green **Run workflow** button.

## Step 5: Watch it run

1. Stay on the **Actions** tab. A new line appears with a yellow spinning circle.
2. Click the line, then click the job called **build**. You will see steps ticking off: install, secret scan, validate, tests, build, browser tests, upload.
3. When **build** shows a green tick, a second job **deploy** starts. When both are green the site is live. A typical run takes five to ten minutes.
4. A red cross means something failed. Click the failed step to read the message, and see Troubleshooting below.

## Step 6: Find the final address

* On the **deploy** job page, the box named **github-pages** shows the link.
* Or open Settings, then Pages: a banner says "Your site is live at ...".
* It should be **https://ritangkar.github.io/ai-architect-learning/**. Note the slash at the end and the lower-case letters.

## Step 7: Verify it works (checklist)

Tick each one:

1. The home page loads and shows "Architect Lab", with styling (not plain text).
2. Open **https://ritangkar.github.io/ai-architect-learning/topic/T1.2.1/** directly, then press the browser refresh button. The page must still load (this proves refresh works on deep links).
3. Use **Search** and type "retrieval". Results appear.
4. Start the **assessment**, answer one question, reload the page: you return to the same question.
5. Settings, **Export progress**: a file downloads.
6. Type a wrong address such as `.../ai-architect-learning/nope/`: you see a "Page not found" page with a working link back.

## How to update the site later

1. Change files (for example add a lesson under `content/topics/`). You can edit on github.com: open the file, click the pencil icon, edit, then **Commit changes**. Or use `git` on your computer.
2. Commit to the `main` branch. The deployment starts by itself.
3. Wait for the green ticks in the Actions tab, then refresh the site (press Ctrl+F5 or Cmd+Shift+R to bypass the cache).
4. If the content has an error, the build stops at **Validate content** and nothing is published. The message names the file and field.

## How to roll back

If a deployment goes wrong:

1. Actions tab, **Deploy to GitHub Pages**, find the last run that was good (green tick and the site looked right).
2. Easiest: on the repository's **Code** tab open **Commits**, find the bad commit, click **...** then **Revert**, and commit. The workflow redeploys the previous state.
3. Alternatively click the good run, then **Re-run all jobs**: this republishes exactly what that run built.

Your learners' progress stays in their browsers and is not affected by a rollback.

## Troubleshooting

**The address shows a 404 "There isn't a GitHub Pages site here".** Pages is not enabled or no deployment has finished yet. Check Step 3 (Source must be **GitHub Actions**), then check the Actions tab for a green **deploy** job. Run Step 4 if no run exists.

**The page appears but is blank or has no styling, or buttons do nothing.** This is the classic wrong-base-path symptom: the browser is looking for styles and scripts at the wrong address. Causes: the site was built with the wrong repository name, for example by building locally with a different `BASE_PATH`, or the repository was renamed after a build. Fix: run the deployment again from GitHub (Step 4), which recomputes the base from the repository name. If you build locally, set `BASE_PATH=/ai-architect-learning`. Open the browser's developer tools (F12), Network tab: failed requests for files starting with `/_assets/` instead of `/ai-architect-learning/_assets/` confirm it.

**"Resource not accessible by integration" or other permission errors in the deploy job.** In Settings, then **Actions**, then **General**, scroll to **Workflow permissions**. The workflow asks for the permissions it needs itself, but an organisation policy can block that. Choose **Read and write permissions** or ask the organisation owner to allow Pages deployments.

**"Get Pages site failed" or "Pages is not enabled".** Do Step 3 first. On a brand-new repository you must set the source once by hand.

**The workflow does not start at all.** Actions may be disabled (Settings, Actions, General, choose **Allow all actions and reusable workflows**), or you pushed to a branch other than `main`.

**Validate content fails.** The log lists problems like `case CS-003 :: decisions  Tier A case has 1 documented decisions; at least 3 required` or `topic T1.2.1 :: pre  Dangling prerequisite T9.9.9`. Fix the named file and push again. The validator is intentionally strict so broken content never reaches readers.

**Tests fail.** Open the failed step; Playwright prints which journey failed. The **reports** artifact on the run page (at the bottom of the run summary) has details. Do not weaken a test to get green; fix the cause.

**"Environment protection rules" waiting for approval.** If a deployment is stuck at "Waiting", open the run, click **Review deployments**, tick **github-pages** and approve. This happens if someone added required reviewers under Settings, then **Environments**, then **github-pages**. You can remove the rule there.

**A page works when I click but gives 404 when I type the address (or uses different capital letters).** GitHub Pages is case-sensitive: `/topic/T1.2.1/` is correct, `/Topic/t1.2.1/` is not. Use the links inside the site.

**I published but still see the old version.** Caches. GitHub's content network can take a few minutes, and your browser caches too. Wait five minutes, then hard refresh (Ctrl+F5, or Cmd+Shift+R on a Mac). Open the address in a private window to confirm.

**The deploy job's smoke test fails.** After deploying, the workflow requests the home page and `topic/T1.2.1/` and expects status 200. If it fails, wait a few minutes and re-run the failed job; if it keeps failing, use the checklist in Step 7.

**The workflow uses old versions of GitHub Actions.** The pipeline pins `actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` and `actions/upload-artifact@v4`. Newer major versions may exist. Look up each one on github.com/actions/&lt;name&gt;/releases, and update the files in `.github/workflows/` if you want the latest.

## If you use a custom domain

Settings, Pages, **Custom domain**. A custom domain at the root means the base path becomes `/`. Set the repository variable or workflow environment `BASE_PATH` to `/` and `SITE_URL` to your address, then redeploy.

## Everything stays in the browser

The site has no server and no database. Learners' progress is saved in their own browser. Deleting browser data or switching device loses it unless they exported a backup. That is why Step 0 exists.
