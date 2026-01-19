/**
 * FizzBuzzCounter E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { fizzbuzzTests } from '../../shared/e2e/fizzbuzz.spec'

fizzbuzzTests('http://localhost:8080')
