import { type ReactNode } from "react"
import katex from "katex"

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: false,
    })
  } catch {
    return latex
  }
}

/**
 * Parse text with $...$ (inline) and $$...$$ (display) LaTeX delimiters,
 * returning an array of strings and HTML-spans for KaTeX-rendered math.
 */
export default function LatexContent({ text }: { text: string }) {
  if (!text) return null

  const nodes: ReactNode[] = []

  // Process display math $$...$$ first, then inline $...$ in remaining segments
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g)

  parts.forEach((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const latex = part.slice(2, -2).trim()
      if (latex) {
        nodes.push(
          <span
            key={`display-${i}`}
            className="block text-center my-2"
            dangerouslySetInnerHTML={{ __html: renderMath(latex, true) }}
          />,
        )
      }
    } else {
      // Process inline $...$ within this segment
      const inlineParts = part.split(/(\$[^$]+\$)/g)
      inlineParts.forEach((seg, j) => {
        if (seg.startsWith("$") && seg.endsWith("$") && seg.length > 2) {
          const latex = seg.slice(1, -1).trim()
          if (latex) {
            nodes.push(
              <span
                key={`inline-${i}-${j}`}
                className="inline-block align-middle mx-0.5"
                dangerouslySetInnerHTML={{ __html: renderMath(latex, false) }}
              />,
            )
          } else {
            nodes.push(<span key={`text-${i}-${j}`}>$</span>)
          }
        } else {
          // Plain text — prefix with newline if display math was above
          if (seg) {
            nodes.push(<span key={`text-${i}-${j}`}>{seg}</span>)
          }
        }
      })
    }
  })

  return <>{nodes}</>
}
