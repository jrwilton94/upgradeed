<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep profile FAQs in a shared typed content module so public profile pages and the FAQ page use identical answers.
- Use /para/profissional as the canonical professional URL and permanently redirect the former URL to preserve published links.
- Test profile switching must be authorized through a server-managed access table and authenticated database function, never through email checks or client storage.
- Institution reporting must return aggregate values from an authorized database function, never individual student rows to the browser.
