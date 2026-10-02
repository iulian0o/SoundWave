import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Search } from "lucide-react";

import { Input } from "../components/ui/input";
import { axiosInstance } from "../lib/axios";
import { useDebounce } from "../hooks/useDebounce";
import type { SearchResult } from "../types";

export default function SearchBar() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [resultsFor, setResultsFor] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 300);

useEffect(() => {
  if (!debouncedQuery) return;

  const controller = new AbortController();

  axiosInstance
    .get<SearchResult[]>("/search", {
      params: { q: debouncedQuery },
      signal: controller.signal,
    })
    .then((res) => {
      setResults(res.data);
      setResultsFor(debouncedQuery);
      setActiveIndex(-1);
    })
    .catch((err) => {
      if (axios.isCancel(err)) return;
      setResults([]);
      setResultsFor(debouncedQuery);
    });

  return () => controller.abort();
}, [debouncedQuery]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);

    if (result.type === "album") {
      navigate(`/albums/${result._id}`);
    } else {
      navigate(`/albums/${result.albumId}`, {
        state: { autoplaySongId: result._id },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && trimmed.length > 0;
  const showNoResults = !resultsFor && results.length === 0 && !!debouncedQuery;

  return (
    <div ref={containerRef} className="relative w-72 md:w-96">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search albums or songs"
        className="pl-9 bg-zinc-800 border-none"
      />

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-md shadow-lg overflow-hidden z-20">
          {resultsFor && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
          )}

          {showNoResults && (
            <p className="px-4 py-3 text-sm text-zinc-400">No results</p>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result._id}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === activeIndex ? "bg-white/10" : ""
              }`}
            >
              <img
                src={result.imageUrl}
                alt={result.title}
                className="size-10 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {result.title}
                </p>
                <p className="text-xs text-zinc-400 truncate">{result.artist}</p>
              </div>
              <span className="text-xs text-zinc-500 capitalize">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}