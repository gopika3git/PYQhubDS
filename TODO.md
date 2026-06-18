# TODO - Google OAuth-only cleanup

- [x] Update `public/index.html` to Google-only button.
- [x] Rewrite `models/user.js` to Google-only fields.
- [x] Rewrite `controllers/authController.js` to remove legacy email/password and only expose Google OAuth handlers.
- [x] Update `routes/authRoutes.js` to `/google`, `/google/callback`, `/logout`.
- [ ] Ensure `server.js` has Passport GoogleStrategy with strict domain validation.
- [x] Ensure frontend href matches server route mounting (`/api/auth/google` if mounted at `/api/auth`).


