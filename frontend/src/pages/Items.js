import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { useIsMounted } from '../hooks/useSafeAsync';
import SkeletonLoader from '../components/SkeletonLoader';
import VirtualizedItemsList from '../components/VirtualizedItemsList';
import './Items.css';

function Items() {
  const { 
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
    updateFilters
  } = useData();

  const isMountedRef = useIsMounted();
  const [searchForm, setSearchForm] = useState({
    q: '',
    category: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('paginated'); // 'paginated' or 'virtualized'

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchForm.q);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchForm.q]);

  // Initial data fetch
  useEffect(() => {
    fetchItems({}, isMountedRef).catch(error => {
      if (isMountedRef.current) {
        console.error('Failed to fetch items:', error);
      }
    });
    
    fetchCategories(isMountedRef);
  }, []); // Remove dependencies to prevent loops

  // Trigger search when debounced search or category changes
  useEffect(() => {
    if (viewMode === 'virtualized') {
      // Fetch all items for virtualized view
      fetchAllItems({ 
        search: debouncedSearch,
        category: searchForm.category 
      }, isMountedRef);
    } else {
      // Fetch paginated items for regular view
      fetchItems({ 
        search: debouncedSearch,
        category: searchForm.category,
        page: 1 
      }, isMountedRef);
    }
  }, [debouncedSearch, searchForm.category, viewMode]); // Combined dependencies

  const handleSearch = () => {
    // This function is now simplified since useEffect handles the actual fetching
    // We could trigger any additional search-specific logic here if needed
  };

  const handleFormChange = (field, value) => {
    setSearchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePageChange = (page) => {
    if (goToPage && typeof goToPage === 'function') {
      goToPage(page, isMountedRef);
    } else {
      console.error('goToPage is not available or not a function');
    }
  };

  const clearFilters = () => {
    setSearchForm({
      q: '',
      category: ''
    });
    // The useEffect will handle the fetching when searchForm changes
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages, hasPrevPage, hasNextPage } = pagination;
    const pages = [];
    
    // Calculate page range to show
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className="pagination-btn"
        aria-label="Go to previous page"
      >
        ← Previous
      </button>
    );

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          aria-label={`Go to page ${i}`}
          aria-current={i === currentPage ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="pagination-btn"
        aria-label="Go to next page"
      >
        Next →
      </button>
    );

    return (
      <nav className="pagination" role="navigation" aria-label="Pagination">
        {pages}
        <div className="pagination-info">
          Page {currentPage} of {totalPages}
        </div>
      </nav>
    );
  };

  return (
    <div className="items-container">
      {/* Skip Navigation for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="items-header">
        <h1 className="items-title">Items</h1>
      </header>

      {/* Search and Filter Controls */}
      <section className="search-filters" role="search" aria-label="Search and filter items">
        <div className="search-row">
          <div className="form-group">
            <label htmlFor="search-input" className="form-label">
              Search Items
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Type to search items..."
              value={searchForm.q}
              onChange={(e) => handleFormChange('q', e.target.value)}
              className="form-input"
              aria-describedby="search-help"
              autoComplete="off"
            />
            <small id="search-help" className="sr-only">
              Search results will update automatically as you type
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="category-select" className="form-label">
              Category
            </label>
            <select 
              id="category-select"
              value={searchForm.category} 
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="form-select"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* View Controls and Results Info */}
      <div className="controls-row">
        <div className="results-info" role="status" aria-live="polite">
          {loading && items.length > 0 ? (
            <span className="loading-text">
              <span className="mini-spinner"></span>
              Loading...
            </span>
          ) : (
            <>
              Showing {items.length} of {pagination.totalItems || 0} items{
                pagination.totalPages ? ` (Page ${pagination.currentPage} of ${pagination.totalPages})` : ''
              }
            </>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="view-controls">
          <label htmlFor="view-mode" className="view-label">View:</label>
          <select 
            id="view-mode"
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="view-select"
          >
            <option value="paginated">Paginated</option>
            <option value="virtualized">Virtualized</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="fade-in">
        {loading && items.length === 0 ? (
          <SkeletonLoader type="item" count={6} />
        ) : items.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-icon">📭</div>
            <h3>No items found</h3>
            <p>
              {searchForm.q || searchForm.category 
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "No items are available at the moment."
              }
            </p>
            {(searchForm.q || searchForm.category) && (
              <button onClick={clearFilters} className="btn btn-primary">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'virtualized' ? (
              <VirtualizedItemsList items={items} height={600} />
            ) : (
              <>
                <div className={`items-list ${loading ? 'loading' : ''}`}>
                  {loading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Loading...</span>
                      </div>
                    </div>
                  )}
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="item-card"
                      aria-label={`Item: ${item.name}`}
                    >
                      <div className="item-content">
                        <h3 className="item-title">{item.name}</h3>
                        <div className="item-meta">
                          <span className="item-category" aria-label={`Category: ${item.category}`}>
                            {item.category}
                          </span>
                          <time className="item-date" dateTime={item.createdAt}>
                            {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                          </time>
                          {item.price && (
                            <span className="item-price" aria-label={`Price: $${item.price}`}>
                              ${item.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination - only show in paginated mode */}
                {renderPagination()}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Items;
