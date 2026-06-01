export function DataTable({
  headers,
  rows,
  emptyText = "ยังไม่มีข้อมูล",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyText?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {headers.map((header) => (
              <th className="whitespace-nowrap px-4 py-3 font-bold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr className="border-t border-slate-100" key={index}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-3 align-top" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
