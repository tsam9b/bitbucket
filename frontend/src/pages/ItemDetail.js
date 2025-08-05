import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIsMounted, useCancellableFetch } from '../hooks/useSafeAsync';
//import LoadingSpinner from '../components/LoadingSpinner';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();
  const isMountedRef = useIsMounted();
  const cancellableFetch = useCancellableFetch();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await cancellableFetch(`/api/items/${id}`);
        
        // Response will be null if request was cancelled (component unmounted)
        if (!response) return;

        if (response.ok) {
          const data = await response.json();
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setItem(data);
          }
        } else {
          // Only navigate if component is still mounted
          if (isMountedRef.current) {
            console.error('Failed to fetch item:', response.status);
            navigate('/');
          }
        }
      } catch (error) {
        // Only handle error if component is still mounted
        if (isMountedRef.current) {
          console.error('Failed to fetch item:', error);
          navigate('/');
        }
      }
    };

    fetchItem();
  }, [id, navigate, cancellableFetch, isMountedRef]);

  if (!item) {
    return (
      <div className="item-detail-container">
        <LoadingSpinner size="large" text="Loading item details..." />
      </div>
    );
  }

  return (
    <div className="item-detail-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">
          ← Back to Items
        </Link>
      </nav>

      {/* Item Detail Card */}
      <article className="item-detail-card">
        <header className="item-header">
          <div className="item-avatar" aria-hidden="true">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div className="item-title-section">
            <h1 className="item-title">{item.name}</h1>
            {item.description && (
              <p className="item-description">{item.description}</p>
            )}
          </div>
        </header>

        <div className="item-details">
          <div className="detail-group">
            <span className="detail-label">Category</span>
            <span className="detail-value category-badge">{item.category}</span>
          </div>

          {item.price && (
            <div className="detail-group">
              <span className="detail-label">Price</span>
              <span className="detail-value price-value">${item.price}</span>
            </div>
          )}

          <div className="detail-group">
            <span className="detail-label">Item ID</span>
            <span className="detail-value">{item.id}</span>
          </div>

          {item.createdAt && (
            <div className="detail-group">
              <span className="detail-label">Created</span>
              <time className="detail-value" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="detail-group">
              <span className="detail-label">Tags</span>
              <div className="tags-container">
                {item.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="item-actions">
          <Link to="/" className="btn btn-secondary">
            ← Back to Items
          </Link>
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
            aria-label="Print item details"
          >
            🖨️ Print
          </button>
        </footer>
      </article>
    </div>
  );
}

export default ItemDetail;