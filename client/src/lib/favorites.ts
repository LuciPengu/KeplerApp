import { useState, useCallback, useEffect } from "react";
import type { FavoriteSystem } from "./types";

const STORAGE_KEY = "kepler-favorites";

function loadFavorites(): FavoriteSystem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteSystem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteSystem[]>(loadFavorites);

  useEffect(() => {
    const handler = () => setFavorites(loadFavorites());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addFavorite = useCallback((kepid: number, name?: string) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.kepid === kepid)) return prev;
      const next = [...prev, { kepid, name: name || `Kepler-${kepid}`, addedAt: Date.now() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((kepid: number) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.kepid !== kepid);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (kepid: number) => favorites.some((f) => f.kepid === kepid),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (kepid: number, name?: string) => {
      if (isFavorite(kepid)) {
        removeFavorite(kepid);
      } else {
        addFavorite(kepid, name);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}

const COMPARE_KEY = "kepler-compare";

function loadCompareList(): number[] {
  try {
    const stored = localStorage.getItem(COMPARE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCompareList(list: number[]) {
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
  } catch {}
}

export function useCompareList() {
  const [compareList, setCompareList] = useState<number[]>(loadCompareList);

  const addToCompare = useCallback((kepid: number) => {
    setCompareList((prev) => {
      if (prev.includes(kepid) || prev.length >= 3) return prev;
      const next = [...prev, kepid];
      saveCompareList(next);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((kepid: number) => {
    setCompareList((prev) => {
      const next = prev.filter((k) => k !== kepid);
      saveCompareList(next);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    saveCompareList([]);
  }, []);

  const isInCompare = useCallback(
    (kepid: number) => compareList.includes(kepid),
    [compareList]
  );

  return { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare };
}
