import React from 'react';
import { FixedSizeList as List } from 'react-window';
import './VirtualizedItemsList.css';

const ItemRow = ({ index, style, data }) => {
  const item = data[index];
  
  return (
    <div style={style} className="virtualized-item">
      <div className="item-card">
        <div className="item-header">
          <h3 className="item-name">
            {item.name}
          </h3>
          <span className="item-category">{item.category}</span>
        </div>
        <div className="item-price">${item.price}</div>
      </div>
    </div>
  );
};

const VirtualizedItemsList = ({ items, height = 400 }) => {
  if (!items || items.length === 0) {
    return (
      <div className="no-items">
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="virtualized-list-container">
      <List
        height={height}
        itemCount={items.length}
        itemSize={120}
        itemData={items}
        className="virtualized-list"
      >
        {ItemRow}
      </List>
    </div>
  );
};

export default VirtualizedItemsList;
