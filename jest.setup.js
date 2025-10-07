// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Kepler.gl components
jest.mock('@kepler.gl/components', () => ({
  __esModule: true,
  default: jest.fn(({ id, mapboxApiAccessToken }) => (
    <div data-testid="kepler-gl-mock" data-map-id={id} data-mapbox-token={mapboxApiAccessToken} />
  )),
}))

// Mock Kepler.gl actions
jest.mock('@kepler.gl/actions', () => ({
  addDataToMap: jest.fn((payload) => ({
    type: 'ADD_DATA_TO_MAP',
    payload,
  })),
}))

// Mock Kepler.gl reducers
jest.mock('@kepler.gl/reducers', () => ({
  __esModule: true,
  default: jest.fn((state = {}) => state),
}))

// Mock styled-components for testing
jest.mock('styled-components', () => {
  const React = require('react')

  // Create a mock styled function that returns a React component
  const createStyledComponent = (tag) => {
    const StyledComponent = React.forwardRef((props, ref) => {
      const { children, ...restProps } = props
      return React.createElement(tag, { ...restProps, 'data-styled': tag, ref }, children)
    })
    StyledComponent.displayName = `styled.${tag}`

    return StyledComponent
  }

  // Create a styled tag function with withConfig
  const createStyledTag = (tag) => {
    const styledTag = (strings, ...interpolations) => createStyledComponent(tag)
    styledTag.withConfig = () => styledTag
    styledTag.attrs = () => styledTag
    return styledTag
  }

  // Create a Proxy for the default export to handle any HTML tag
  const styled = new Proxy(
    {},
    {
      get: (target, prop) => {
        return createStyledTag(prop)
      },
    }
  )

  return {
    __esModule: true,
    default: styled,
    css: jest.fn((...args) => args),
    keyframes: jest.fn((strings, ...interpolations) => 'keyframes-mock'),
    createGlobalStyle: jest.fn(() => () => null),
    ThemeProvider: ({ children }) => children,
  }
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ''

// Suppress console errors/warnings in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
