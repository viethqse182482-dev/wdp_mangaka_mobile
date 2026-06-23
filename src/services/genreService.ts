import { BASE_GENRES } from '../data/baseGenres';
import { Genre } from '../types/genre';
import { apiGet } from './apiClient';

interface BESeries {
  genre?: string;
  category?: string;
  tags?: string[];
}

interface BESeriesListResponse {
  success: boolean;
  data: BESeries[];
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function collectGenreStrings(seriesList: BESeries[]): string[] {
  const values = new Set<string>();

  seriesList.forEach((series) => {
    if (series.genre?.trim()) values.add(series.genre.trim());
    if (series.category?.trim()) values.add(series.category.trim());
    series.tags?.forEach((tag) => {
      if (tag?.trim()) values.add(tag.trim());
    });
  });

  return Array.from(values);
}

function mergeGenreNames(base: readonly string[], fromBackend: string[]): string[] {
  const baseSet = new Set(base);
  const merged = [...base];

  fromBackend
    .filter((name) => !baseSet.has(name))
    .sort((a, b) => a.localeCompare(b, 'vi'))
    .forEach((name) => merged.push(name));

  return merged;
}

async function fetchBackendGenreNames(): Promise<string[]> {
  try {
    const response = await apiGet<BESeriesListResponse>('/reader/series', {
      params: { limit: 200, page: 1 },
    });

    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }

    return collectGenreStrings(response.data);
  } catch {
    try {
      const response = await apiGet<BESeriesListResponse>('/series', {
        params: { limit: 200, page: 1, status: 'published' },
      });

      if (!response.success || !Array.isArray(response.data)) {
        return [];
      }

      return collectGenreStrings(response.data);
    } catch {
      return [];
    }
  }
}

export async function fetchGenres(): Promise<Genre[]> {
  const backendNames = await fetchBackendGenreNames();
  const mergedNames = mergeGenreNames(BASE_GENRES, backendNames);
  const baseSet = new Set<string>(BASE_GENRES);

  return mergedNames.map((name) => ({
    id: slugify(name),
    name,
    fromBackend: !baseSet.has(name),
  }));
}
