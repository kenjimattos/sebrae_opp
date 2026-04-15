// Mock react-leaflet components for jsdom (no canvas support)
// Used via vi.mock('react-leaflet', ...) in test files

export const MapContainer = ({ children }: { children?: React.ReactNode }) => children
export const TileLayer = () => null
export const GeoJSON = () => null
export const useMap = () => ({
  getContainer: () => document.createElement('div'),
})
