/**
 * Carousel Documentation Page
 */

import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'
import { CarouselPreviewDemo, CarouselSizesDemo, CarouselOrientationDemo } from '@/components/carousel-demo'

const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'sizes', title: 'Sizes', branch: 'start' },
  { id: 'orientation', title: 'Orientation', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const previewCode = `"use client"

import {
  Carousel, CarouselContent, CarouselItem,
  CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel"

function CarouselDemo() {
  return (
    <Carousel>
      <CarouselContent>
        {[1, 2, 3, 4, 5].map((n) => (
          <CarouselItem>
            <div className="p-1">
              <div className="flex items-center justify-center rounded-lg border bg-card p-6 aspect-square">
                <span className="text-4xl font-semibold">{n}</span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}`

const sizesCode = `"use client"

import {
  Carousel, CarouselContent, CarouselItem,
  CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel"

function CarouselSizes() {
  return (
    <Carousel>
      <CarouselContent className="-ml-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <CarouselItem className="pl-2 basis-1/3">
            <div className="p-1">
              <div className="flex items-center justify-center rounded-lg border bg-card p-4 aspect-square">
                <span className="text-2xl font-semibold">{n}</span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}`

const orientationCode = `"use client"

import {
  Carousel, CarouselContent, CarouselItem,
  CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel"

function CarouselOrientation() {
  return (
    <Carousel orientation="vertical" opts={{ align: 'start' }}>
      <CarouselContent className="-mt-2 h-[200px]">
        {[1, 2, 3, 4, 5].map((n) => (
          <CarouselItem className="pt-2 basis-1/2">
            <div className="p-1">
              <div className="flex items-center justify-center rounded-lg border bg-card p-4">
                <span className="text-2xl font-semibold">{n}</span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}`

const carouselProps: PropDefinition[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    defaultValue: "'horizontal'",
    description: 'The scroll direction of the carousel.',
  },
  {
    name: 'opts',
    type: 'EmblaOptionsType',
    defaultValue: '{}',
    description: 'Options passed to Embla Carousel (loop, align, dragFree, etc.).',
  },
  {
    name: 'children',
    type: 'Child',
    defaultValue: '-',
    description: 'CarouselContent, CarouselPrevious, CarouselNext.',
  },
]

export function CarouselPage() {
  return (
    <DocPage slug="carousel" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Carousel"
          description="A carousel with motion and swipe built using Embla Carousel."
          {...getNavLinks('carousel')}
        />

        {/* Preview */}
        <Example title="" code={previewCode}>
          <CarouselPreviewDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add carousel" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Sizes" code={sizesCode}>
              <CarouselSizesDemo />
            </Example>

            <Example title="Orientation" code={orientationCode}>
              <CarouselOrientationDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={carouselProps} />
        </Section>
      </div>
    </DocPage>
  )
}
