import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'item', count = 1 }) => {
  const renderItemSkeleton = () => (
    <div className="skeleton-item" role="presentation" aria-hidden="true">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-meta">
          <div className="skeleton-badge"></div>
          <div className="skeleton-date"></div>
        </div>
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="skeleton-card" role="presentation" aria-hidden="true">
      <div className="skeleton-card-image"></div>
      <div className="skeleton-card-content">
        <div className="skeleton-card-title"></div>
        <div className="skeleton-card-text"></div>
        <div className="skeleton-card-text short"></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="skeleton-table-row" role="presentation" aria-hidden="true">
      <div className="skeleton-cell"></div>
      <div className="skeleton-cell"></div>
      <div className="skeleton-cell"></div>
      <div className="skeleton-cell short"></div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton();
      case 'table':
        return renderTableSkeleton();
      default:
        return renderItemSkeleton();
    }
  };

  return (
    <div className="skeleton-container">
      <span className="sr-only">Loading content...</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
