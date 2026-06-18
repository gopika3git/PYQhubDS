# TODO - PYQ-HUB Google OAuth Migration

- [ ] Install dependencies for Passport + Google OAuth + sessions
- [ ] Update `models/user.js` to store googleId, displayName, email, profilePicture
- [ ] Update `server.js`:
  - [ ] Configure express-session
  - [ ] Configure Passport GoogleStrategy using env vars
  - [ ] Add routes: `/auth/google`, `/auth/google/callback`, `/logout`
  - [ ] Add `isLoggedIn` middleware
  - [ ] Apply `isLoggedIn` to `GET /dashboard`
- [ ] (Optional) Remove/ignore old JWT-based auth usage for dashboard
- [ ] Start server and test OAuth success/failure + restricted domain enforcement

