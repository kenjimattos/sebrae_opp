// Logotipo PIPPA (Figma node 1848:6).
//
// O desenho é o contorno real da Norfolk Narrow Regular, extraído do .otf com
// fontTools e vetorizado — não uma aproximação. Por que contorno e não webfont:
// a Norfolk é licenciada só para uso pessoal, então servir o arquivo no bundle
// seria redistribuição; o logotipo, como desenho, sai dessa conta. De quebra são
// 900 bytes contra ~20KB de fonte, e não há FOUT no maior elemento da tela.
//
// `currentColor` é o que faz o logo atravessar os dois temas: quem monta escolhe
// a cor pela classe de texto (`text-primary` no hero). O tracking de 0.04em do
// Figma já está embutido no espaçamento dos glifos — não há como reaplicar depois.
//
// Para regenerar (outra palavra, outro peso): fontTools SVGPathPen sobre o .otf,
// avanço de cada glifo + 0.04em de tracking, eixo Y invertido.

const PIPPA_PATH =
  'M176 -1000H55V0H95V-450H176C295 -450 295 -533 295 -660V-790C295 -917 295 -1000 176 -1000ZM255 -660C255 -532 246 -488 176 -488H95V-962H176C246 -962 255 -918 255 -790Z M430 -1000V0H470V-1000Z M741 -1000H620V0H660V-450H741C860 -450 860 -533 860 -660V-790C860 -917 860 -1000 741 -1000ZM820 -660C820 -532 811 -488 741 -488H660V-962H741C811 -962 820 -918 820 -790Z M1116 -1000H995V0H1035V-450H1116C1235 -450 1235 -533 1235 -660V-790C1235 -917 1235 -1000 1116 -1000ZM1195 -660C1195 -532 1186 -488 1116 -488H1035V-962H1116C1186 -962 1195 -918 1195 -790Z M1547 0H1585L1485 -999H1435L1335 0H1373L1408 -359H1512ZM1411 -395 1460 -897 1509 -395Z'

interface PippaWordmarkProps {
  className?: string
}

export default function PippaWordmark({ className = '' }: PippaWordmarkProps) {
  return (
    <svg
      viewBox="55 -1000 1530 1000"
      role="img"
      aria-label="PIPPA"
      className={className}
      fill="currentColor"
    >
      <path d={PIPPA_PATH} />
    </svg>
  )
}
