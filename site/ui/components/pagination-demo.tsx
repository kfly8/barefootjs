"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

/**
 * Basic static pagination display.
 */
export function PaginationBasicDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

/**
 * Dynamic pagination with current page tracking.
 * Demonstrates signal-based page state with 5 pages.
 * Uses explicit page links to avoid compiler limitations with .map() + ternary.
 */
export function PaginationDynamicDemo() {
  const [currentPage, setCurrentPage] = createSignal(1)
  const totalPages = 5

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e: Event) => { e.preventDefault(); goToPage(currentPage() - 1) }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage() === 1}
              onClick={(e: Event) => { e.preventDefault(); goToPage(1) }}
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage() === 2}
              onClick={(e: Event) => { e.preventDefault(); goToPage(2) }}
            >
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage() === 3}
              onClick={(e: Event) => { e.preventDefault(); goToPage(3) }}
            >
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage() === 4}
              onClick={(e: Event) => { e.preventDefault(); goToPage(4) }}
            >
              4
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={currentPage() === 5}
              onClick={(e: Event) => { e.preventDefault(); goToPage(5) }}
            >
              5
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e: Event) => { e.preventDefault(); goToPage(currentPage() + 1) }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-center text-sm text-muted-foreground">
        Page {currentPage()} of {totalPages}
      </p>
    </div>
  )
}
