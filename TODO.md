# TODO - Auth Fix (email-only)

- [x] Remove username/password/email fields from register UI (hide or delete register.html, and remove any register button usage).
- [x] Remove `register` and password logic in backend controllers/routes.
- [ ] Update `models/user.js` to keep only email (and optional displayName) consistent with email-only login.
- [ ] Implement email-only login endpoint.
- [x] Update `public/index.html` and `public/auth.js` to perform email-only login request.
- [x] Ensure `/dashboard` protection matches the new auth mechanism.
- [ ] Run server and test: login -> redirect to /dashboard.



