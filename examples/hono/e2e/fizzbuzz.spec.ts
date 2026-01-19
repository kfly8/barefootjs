/**
 * FizzBuzzCounter E2E tests for Hono example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { fizzbuzzTests } from '../../shared/e2e/fizzbuzz.spec'

fizzbuzzTests('http://localhost:3001')
