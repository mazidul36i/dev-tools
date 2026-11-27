interface CsvPreviewTableProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
}

/** First rows of the parsed CSV, so delimiter/header settings can be checked. */
export default function CsvPreviewTable({ headers, rows, maxRows = 50 }: CsvPreviewTableProps) {
  if (headers.length === 0) return null;
  const displayRows = rows.slice(0, maxRows);

  return (
    <table className="w-full text-xs font-mono border-collapse">
      <thead>
        <tr className="sticky top-0 bg-surface">
          <th scope="col" className="w-8 px-2 py-1.5 text-left font-medium text-text-muted border-b border-border">#</th>
          {headers.map((h, i) => (
            <th key={i} scope="col" className="px-2 py-1.5 text-left font-semibold text-text border-b border-border whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {displayRows.map((row, ri) => (
          <tr key={ri} className="odd:bg-surface-alt">
            <td className="px-2 py-1 text-text-muted border-b border-border-light tabular-nums">{ri + 1}</td>
            {headers.map((_, ci) => (
              <td key={ci} className="px-2 py-1 text-text-secondary border-b border-border-light whitespace-nowrap max-w-48 truncate" title={row[ci] ?? ''}>
                {row[ci] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
