/**
 * Dashboard E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { dashboardTests } from '../../shared/e2e/dashboard.spec'

dashboardTests('http://localhost:8080')
