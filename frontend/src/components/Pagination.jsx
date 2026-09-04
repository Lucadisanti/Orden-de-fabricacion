export default function Pagination({ page, pageSize, totalPages, totalItems, setPage, setPageSize }) {
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1);

  return <nav className="ui-pagination" aria-label="Paginación">
    <div className="ui-pagination-summary"><strong>{start}–{end}</strong><span>de {totalItems} registros</span></div>
    <div className="ui-pagination-pages">
      <button type="button" className="ui-pagination-arrow" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Página anterior">←</button>
      {pages.map((number, index) => <span key={number} className="ui-pagination-number-wrap">
        {index > 0 && number - pages[index - 1] > 1 && <i>…</i>}
        <button type="button" className={number === page ? "active" : ""} onClick={() => setPage(number)}>{number}</button>
      </span>)}
      <button type="button" className="ui-pagination-arrow" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Página siguiente">→</button>
    </div>
    <label className="ui-pagination-size"><span>Filas</span><select value={pageSize} onChange={(event) => setPageSize(event.target.value)}><option value="5">5</option><option value="10">10</option><option value="15">15</option></select></label>
  </nav>;
}
