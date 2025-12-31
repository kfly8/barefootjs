/**
 * Async User List Component (Plain Hono JSX)
 *
 * This component is NOT compiled by BarefootJS.
 * It demonstrates async data fetching with Suspense.
 */

type User = {
  id: number
  name: string
  email: string
}

// Simulate async data fetching
async function fetchUsers(): Promise<User[]> {
  // Artificial delay to demonstrate Suspense
  await new Promise(resolve => setTimeout(resolve, 2000))

  return [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ]
}

export async function AsyncUserList() {
  const users = await fetchUsers()

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> - {user.email}
          </li>
        ))}
      </ul>
      <p>Loaded {users.length} users</p>
    </div>
  )
}
