import brasilGeo from '@/data/geo/brasil.json';
import { OutlineMap, type GeoFeature, type OutlineMapProps } from './OutlineMap';

const geojson = brasilGeo as unknown as { features: GeoFeature[] };

/**
 * As 27 UFs; `id` é o código IBGE de 2 dígitos (PB = '25'). Malha de
 * qualidade mínima da API de malhas do IBGE — contorno de tela, não de análise.
 */
export function BrasilOutlineMap(props: Omit<OutlineMapProps, 'geojson'>) {
  return <OutlineMap geojson={geojson} {...props} />;
}
