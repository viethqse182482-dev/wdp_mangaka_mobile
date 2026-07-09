import { BASE_GENRES } from '../data/baseGenres';
import { Genre } from '../types/genre';
import { apiGet } from './apiClient';
import { getAuthToken } from './authService';

interface BEGenresResponse {
  success: boolean;
  data: string[];
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
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
  const token = await getAuthToken();
  if (!token) return [];

  try {
    const response = await apiGet<BEGenresResponse>('/reader/genres', { token });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  } catch {
    return [];
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
