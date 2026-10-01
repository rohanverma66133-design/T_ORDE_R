export interface SearchQuery {
  term?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  isMedicine?: boolean;
  isPrescriptionRequired?: boolean;
  inStock?: boolean;
  storeId?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISearchProvider {
  searchProducts(query: SearchQuery): Promise<SearchResult<any>>;
}
