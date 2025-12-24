/**
 * SVG Helper Functions
 *
 * Provides utilities for detecting and handling SVG elements and attributes.
 */

/**
 * Set of SVG element tag names
 */
const SVG_ELEMENTS = new Set([
  // Container elements
  'svg',
  'g',
  'defs',
  'symbol',
  'use',
  'marker',
  'clipPath',
  'mask',
  'pattern',
  // Shape elements
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  // Text elements
  'text',
  'tspan',
  'textPath',
  // Gradient elements
  'linearGradient',
  'radialGradient',
  'stop',
  // Filter elements
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  // Other elements
  'animate',
  'animateMotion',
  'animateTransform',
  'desc',
  'foreignObject',
  'image',
  'metadata',
  'switch',
  'title',
  'view',
])

/**
 * Set of SVG attributes that use camelCase
 */
const SVG_CAMEL_CASE_ATTRS = new Set([
  // viewBox
  'viewBox',
  // Presentation attributes
  'baseFrequency',
  'baseProfile',
  'clipPathUnits',
  'contentScriptType',
  'contentStyleType',
  'diffuseConstant',
  'edgeMode',
  'filterRes',
  'filterUnits',
  'glyphRef',
  'gradientTransform',
  'gradientUnits',
  'kernelMatrix',
  'kernelUnitLength',
  'keyPoints',
  'keySplines',
  'keyTimes',
  'lengthAdjust',
  'limitingConeAngle',
  'markerHeight',
  'markerUnits',
  'markerWidth',
  'maskContentUnits',
  'maskUnits',
  'numOctaves',
  'pathLength',
  'patternContentUnits',
  'patternTransform',
  'patternUnits',
  'pointsAtX',
  'pointsAtY',
  'pointsAtZ',
  'preserveAlpha',
  'preserveAspectRatio',
  'primitiveUnits',
  'refX',
  'refY',
  'repeatCount',
  'repeatDur',
  'requiredExtensions',
  'requiredFeatures',
  'specularConstant',
  'specularExponent',
  'spreadMethod',
  'startOffset',
  'stdDeviation',
  'stitchTiles',
  'surfaceScale',
  'systemLanguage',
  'tableValues',
  'targetX',
  'targetY',
  'textLength',
  'viewTarget',
  'xChannelSelector',
  'yChannelSelector',
  'zoomAndPan',
  // Stroke attributes
  'strokeDasharray',
  'strokeDashoffset',
  'strokeLinecap',
  'strokeLinejoin',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  // Fill attributes
  'fillOpacity',
  'fillRule',
  // Color attributes
  'colorInterpolation',
  'colorInterpolationFilters',
  'colorProfile',
  'colorRendering',
  // Font attributes
  'dominantBaseline',
  'alignmentBaseline',
  'baselineShift',
  'glyphOrientationHorizontal',
  'glyphOrientationVertical',
  // Other attributes
  'clipRule',
  'floodColor',
  'floodOpacity',
  'lightingColor',
  'stopColor',
  'stopOpacity',
  'textAnchor',
  'textDecoration',
  'textRendering',
  'unicodeBidi',
  'wordSpacing',
  'writingMode',
  'imageRendering',
  'shapeRendering',
  'pointerEvents',
  'enableBackground',
])

/**
 * Checks if a tag name is an SVG element
 */
export function isSvgElement(tagName: string): boolean {
  return SVG_ELEMENTS.has(tagName)
}

/**
 * Checks if a tag name is the root SVG element
 */
export function isSvgRoot(tagName: string): boolean {
  return tagName === 'svg'
}

/**
 * Checks if an attribute should preserve its camelCase form in SVG
 */
export function isSvgCamelCaseAttr(attrName: string): boolean {
  return SVG_CAMEL_CASE_ATTRS.has(attrName)
}
