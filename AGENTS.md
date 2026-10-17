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

- App pages live under `src/routes/_authenticated/`; that layout gates login, renders the sidebar and blocks sections the role can't open — so new pages inherit auth and permissions.
- Section access per role is defined only in `src/lib/permissions.ts` (`canAccess`), used by both sidebar and layout — one source of truth.
- Roles live in `public.user_roles`; user management goes through admin-checked server functions in `src/lib/users.functions.ts` — never client-side role writes.
