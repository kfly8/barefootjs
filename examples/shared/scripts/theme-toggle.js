/**
 * Theme toggle: wires every [data-bf-theme-toggle] button to flip the `dark`
 * class on <html> and persist the choice in localStorage. The initial dark
 * class is set inline before first paint by the theme-init script in each
 * adapter's layout to prevent FOUC.
 */
(function () {
  function apply(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch (_err) {
      /* ignore storage errors (private mode etc.) */
    }
  }

  document.addEventListener('click', function (ev) {
    var target = ev.target
    if (!(target instanceof Element)) return
    var btn = target.closest('[data-bf-theme-toggle]')
    if (!btn) return
    var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    apply(next)
  })
})()
