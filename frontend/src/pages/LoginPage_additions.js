// ============================================================
// In your LoginPage.js — add Forgot Password link
// ============================================================

// Find the password input field section and ADD this below it:

<div className="form-group">
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <label className="form-label" style={{ margin: 0 }}>Password</label>
    <Link
      to={`/forgot-password`}
      style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}
    >
      Forgot Password?
    </Link>
  </div>
  <input
    className="form-input"
    type="password"
    placeholder="••••••••"
    value={form.password}
    onChange={e => setForm({ ...form, password: e.target.value })}
    required
  />
</div>
