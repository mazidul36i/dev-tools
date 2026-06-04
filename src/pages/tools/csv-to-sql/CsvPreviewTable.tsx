interface CsvPreviewTableProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
}

export default function CsvPreviewTable({ headers, rows, maxRows = 50 }: CsvPreviewTableProps) {
  if (headers.length === 0) return null;

  const displayRows = rows.slice(0, maxRows);
  const totalRows = rows.length;

  return (
    <div className="flex flex-col gap-1">
      <div className="overflow-auto max-h-48 rounded-lg border border-white/50 dark:border-gray-700/50">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-gray-100/70 dark:bg-gray-800/70 sticky top-0">
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-white/50 dark:border-gray-700/50 w-8">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-white/50 dark:border-gray-700/50 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0
                  ? 'bg-white/30 dark:bg-gray-900/20'
                  : 'bg-white/10 dark:bg-gray-900/40'}
              >
                <td className="px-2 py-1 text-gray-400 dark:text-gray-500 border-b border-white/30 dark:border-gray-700/30">
                  {ri + 1}
                </td>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-1 text-gray-700 dark:text-gray-300 border-b border-white/30 dark:border-gray-700/30 whitespace-nowrap max-w-48 truncate"
                    title={row[ci] ?? ''}
                  >
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
        Showing {displayRows.length} of {totalRows} row{totalRows !== 1 ? 's' : ''}
        {' · '}{headers.length} column{headers.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

