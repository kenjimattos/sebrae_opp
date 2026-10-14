import paraibaGeo from '@/data/geo/paraiba.json';
import { OutlineMap, type GeoFeature, type OutlineMapProps } from './OutlineMap';

const geojson = paraibaGeo as unknown as { features: GeoFeature[] };

/** Os 223 municípios da PB; `id` é o código IBGE de 7 dígitos. */
export function ParaibaOutlineMap(props: Omit<OutlineMapProps, 'geojson'>) {
  return <OutlineMap geojson={geojson} {...props} />;
}
