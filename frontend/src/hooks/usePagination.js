import { useMemo, useState } from "react";

export default function usePagination(items, initialSize = 5) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialSize);
  const mostrarTodo = pageSize === "all";
  const totalPages = mostrarTodo ? 1 : Math.max(Math.ceil(items.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => mostrarTodo ? items : items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize, mostrarTodo]
  );
  const setPageSize = (size) => { setPageSizeState(size === "all" ? "all" : Number(size)); setPage(1); };
  return { page: currentPage, pageSize, totalPages, totalItems: items.length, pageItems, setPage, setPageSize };
}
