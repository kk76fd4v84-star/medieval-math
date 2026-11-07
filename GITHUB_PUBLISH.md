# Updating the existing GitHub project

Magnus confirmed the destination: `https://github.com/kk76fd4v84-star/medieval-math`.
GitHub authentication was verified as `kk76fd4v84-star` on 7 November 2026.
The repository is private, its default branch is `main`, and its pre-upload tip
was `8f239703f60ff37062c0a7a4fa130feb25164434` (3 November, Japan time).
Preserve that repository, privacy and history. Never use any unrelated project.

The old notes mention `https://kk76fd4v84-star.github.io/medieval-math/`, but the
Pages API returned no accessible site configuration during this handoff. Uploading
source is not evidence that this game URL is live. Do not enable public hosting or
change repository visibility without a separate request.

1. Authenticate through the normal GitHub login flow, never by pasting secrets into
   a chat or committing them. Clone/fetch the confirmed repository.
2. Read its instructions and inspect its current branch, work and deployment
   configuration. Keep the remote history and any newer work. Never force-push.
3. Compare this snapshot against that checkout. Apply and review intended changes;
   resolve conflicting work explicitly. Keep existing `.github/` workflows, domain
   settings, licensing and repository-specific files unless a change is needed.
4. Run the checks in `VERIFICATION.md`, commit the reviewed result and push to the
   appropriate branch. Use the repository’s existing PR/deployment workflow.
5. Verify the pushed commit and, if applicable, the existing Pages deployment.
   Do not describe a local ZIP or commit as a successful GitHub upload.

The runtime is static: `index.html`, `style.css`, `src/` and `assets/`. `.nojekyll`
is included for direct Pages hosting. There is no npm build or server-side secret.
Source art, concepts, import utilities, tests and documentation are also included.
`backups/`, bulk `review/` captures, `.DS_Store`, temporary files and legacy `.orig`
copies are omitted. Files are below GitHub’s individual file-size limit; the full
art/audio source tree is still large. Do not put the handoff ZIP inside the repo.

Local saves and leaderboard entries live in browser storage. Publishing source
does not transfer a localhost save to the GitHub Pages origin.
