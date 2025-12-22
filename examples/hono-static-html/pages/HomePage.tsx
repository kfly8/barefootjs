/**
 * Home Page
 */
function HomePage() {
  return (
    <div>
      <h1>BarefootJS + Hono Examples</h1>
      <nav>
        <ul>
          <li><a href="/counter">Counter</a></li>
          <li><a href="/toggle">Toggle</a></li>
          <li><a href="/todos">Todo (SSR + API)</a></li>
        </ul>
      </nav>
    </div>
  )
}

export default HomePage
