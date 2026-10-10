// The password rules, in ONE place, so the requirements shown to people can
// never drift from what the server actually enforces.
//
// MUST mirror nexthome-api/src/routes/auth.routes.js:
//   POST /auth/register        body("password").isString().isLength({ min: 8 })
//   POST /auth/reset-password  body("password").isString().isLength({ min: 8 })
// The server enforces a minimum length and nothing else — no digit, case or
// symbol rule — so this lists exactly that. If the backend gains a rule, add
// it here and the UI picks it up; do not add one here first.
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "min-length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
];

export const passwordMeetsRules = (password: string) => PASSWORD_RULES.every((rule) => rule.test(password));
