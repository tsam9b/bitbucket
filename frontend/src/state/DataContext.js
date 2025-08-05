import React, { createContext, useCallback, useContext, useState, useRef } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sortBy: 'id',
    sortOrder: 'asc'
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const abortControllerRef = useRef(null);

  const fetchItems = useCallback(async (params = {}, isMountedRef = { current: true }) => {
    try {
      setLoading(true);
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Build query parameters - use a fixed limit to avoid circular dependency
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10, // Fixed limit to avoid circular dependency
        q: params.search !== undefined ? params.search : '',
        category: params.category !== undefined ? params.category : '',
        sortBy: params.sortBy || 'id',
        sortOrder: params.sortOrder || 'asc',
        ...params
      });

      const response = await fetch(`http://localhost:5000/api/items?${queryParams}`, {
        signal: abortControllerRef.current.signal
      });
      
      const result = await response.json();
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        setItems(result.data || []);
        setPagination(result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        });
        setFilters({
          search: params.search !== undefined ? params.search : '',
          category: params.category !== undefined ? params.category : '',
          sortBy: params.sortBy || 'id',
          sortOrder: params.sortOrder || 'asc'
        });
      }

      // Clear the controller reference on successful completion
      abortControllerRef.current = null;
    } catch (error) {
      // Don't handle AbortError or log if component unmounted
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Failed to fetch items:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Remove all dependencies to prevent circular issues

  const searchItems = useCallback(async (searchParams = {}, isMountedRef = { current: true }) => {
    try {
      setLoading(true);
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      const queryParams = new URLSearchParams({
        page: searchParams.page || 1,
        limit: searchParams.limit || 10, // Fixed limit to avoid circular dependency
        q: searchParams.q || '',
        category: searchParams.category || '',
        minPrice: searchParams.minPrice || '',
        maxPrice: searchParams.maxPrice || '',
        sortBy: searchParams.sortBy || 'id',
        sortOrder: searchParams.sortOrder || 'asc'
      });

      const response = await fetch(`http://localhost:5000/api/items/search?${queryParams}`, {
        signal: abortControllerRef.current.signal
      });
      
      const result = await response.json();
      
      if (isMountedRef.current) {
        setItems(result.data || []);
        setPagination(result.pagination || pagination);
        setFilters(result.filters || filters);
      }

      abortControllerRef.current = null;
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Failed to search items:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Remove dependencies to prevent circular issues

  const fetchCategories = useCallback(async (isMountedRef = { current: true }) => {
    try {
      const response = await fetch('http://localhost:5000/api/items/categories');
      const result = await response.json();
      
      if (isMountedRef.current) {
        setCategories(result.categories || []);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Failed to fetch categories:', error);
      }
    }
  }, []);

  const goToPage = useCallback((page, isMountedRef) => {
    fetchItems({ page }, isMountedRef);
  }, [fetchItems]);

  const updateFilters = useCallback((newFilters, isMountedRef) => {
    fetchItems({ ...newFilters, page: 1 }, isMountedRef);
  }, [fetchItems]);

  const loadMoreItems = useCallback(async (isMountedRef = { current: true }) => {
    if (!pagination.hasNextPage || loading) return;
    
    try {
      setLoading(true);
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Build query parameters for next page
      const queryParams = new URLSearchParams({
        page: pagination.currentPage + 1,
        limit: pagination.itemsPerPage,
        q: filters.search,
        category: filters.category,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`http://localhost:5000/api/items?${queryParams}`, {
        signal: abortControllerRef.current.signal
      });
      
      const result = await response.json();
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        // Append new items to existing ones
        setItems(prevItems => [...prevItems, ...(result.data || [])]);
        setPagination(result.pagination || pagination);
        setFilters(result.filters || filters);
      }

      // Clear the controller reference on successful completion
      abortControllerRef.current = null;
    } catch (error) {
      // Don't handle AbortError or log if component unmounted
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Failed to load more items:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pagination, filters, loading]);

  const fetchAllItems = useCallback(async (searchParams = {}, isMountedRef = { current: true }) => {
    try {
      setLoading(true);
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Build query parameters for all items (no pagination)
      const queryParams = new URLSearchParams({
        limit: 1000, // Large limit to get all items
        q: searchParams.search !== undefined ? searchParams.search : '',
        category: searchParams.category !== undefined ? searchParams.category : '',
        sortBy: searchParams.sortBy || 'id',
        sortOrder: searchParams.sortOrder || 'asc',
        ...searchParams
      });

      const response = await fetch(`http://localhost:5000/api/items?${queryParams}`, {
        signal: abortControllerRef.current.signal
      });
      
      const result = await response.json();
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        setItems(result.data || []);
        setFilters({
          search: searchParams.search || '',
          category: searchParams.category || '',
          sortBy: searchParams.sortBy || 'id',
          sortOrder: searchParams.sortOrder || 'asc'
        });
        // For virtualized view, we don't need pagination state
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: result.data?.length || 0,
          itemsPerPage: result.data?.length || 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      }

      // Clear the controller reference on successful completion
      abortControllerRef.current = null;
    } catch (error) {
      // Don't handle AbortError or log if component unmounted
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Failed to fetch all items:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Remove filters dependency to prevent circular issues

  return (
    <DataContext.Provider value={{ 
      items, 
      pagination,
      filters,
      loading,
      categories,
      fetchItems,
      fetchAllItems,
      searchItems,
      fetchCategories,
      goToPage,
      updateFilters,
      loadMoreItems
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);