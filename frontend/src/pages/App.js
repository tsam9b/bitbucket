import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';
import { TranslationProvider } from '../state/TranslationContext';

function App() {
  return (
    <TranslationProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Items />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </DataProvider>
    </TranslationProvider>
  );
}

export default App;