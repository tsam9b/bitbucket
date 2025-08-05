const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const itemsRouter = require('../src/routes/items');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Error handler middleware for testing
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// Mock data for tests
const mockItems = [
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
  { id: 2, name: 'Headphones', category: 'Electronics', price: 399 },
  { id: 3, name: 'Monitor', category: 'Electronics', price: 999 }
];

// Mock fs operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const mockFs = require('fs');

describe('Items Routes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock successful file read by default
    mockFs.promises.readFile.mockResolvedValue(JSON.stringify(mockItems));
  });

  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.data).toEqual(mockItems);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should filter items by query parameter', async () => {
      const response = await request(app)
        .get('/api/items?q=laptop')
        .expect(200);

      expect(response.body.data).toEqual([mockItems[0]]);
      expect(response.body.filters.search).toBe('laptop');
    });

    it('should filter items case-insensitively', async () => {
      const response = await request(app)
        .get('/api/items?q=LAPTOP')
        .expect(200);

      expect(response.body.data).toEqual([mockItems[0]]);
      expect(response.body.filters.search).toBe('LAPTOP');
    });

    it('should limit results when limit parameter is provided', async () => {
      const response = await request(app)
        .get('/api/items?limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(mockItems.slice(0, 2));
      expect(response.body.pagination.itemsPerPage).toBe(2);
    });

    it('should apply both query and limit filters', async () => {
      const response = await request(app)
        .get('/api/items?q=laptop&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Laptop Pro');
      expect(response.body.filters.search).toBe('laptop');
      expect(response.body.pagination.itemsPerPage).toBe(1);
    });

    it('should return empty array when no items match query', async () => {
      const response = await request(app)
        .get('/api/items?q=nonexistent')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
    });

    it('should handle file read errors', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/items')
        .expect(500);
    });

    it('should handle JSON parse errors', async () => {
      mockFs.promises.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .get('/api/items')
        .expect(500);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      const response = await request(app)
        .get('/api/items/1')
        .expect(200);

      expect(response.body).toEqual(mockItems[0]);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/999')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should handle invalid id parameter', async () => {
      const response = await request(app)
        .get('/api/items/invalid')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should handle file read errors', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .get('/api/items/1')
        .expect(500);
    });

    it('should handle JSON parse errors', async () => {
      mockFs.promises.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .get('/api/items/1')
        .expect(500);
    });
  });

  describe('POST /api/items', () => {
    const newItem = {
      name: 'New Item',
      category: 'Test',
      price: 199
    };

    it('should create a new item', async () => {
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject(newItem);
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('number');
      
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1);
      expect(mockFs.promises.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should assign unique id to new item', async () => {
      const response1 = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      // Mock a different timestamp for second item
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 1000);

      const response2 = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response1.body.id).not.toEqual(response2.body.id);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/items')
        .expect(201); // Note: Current implementation doesn't validate, so it returns 201

      expect(response.body.id).toBeDefined();
    });

    it('should handle file read errors during POST', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);
    });

    it('should handle file write errors', async () => {
      mockFs.promises.writeFile.mockRejectedValue(new Error('Write permission denied'));

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);

      expect(response.body.error).toBe('Write permission denied');
    });

    it('should handle JSON parse errors during POST', async () => {
      mockFs.promises.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(500);
    });

    it('should preserve existing items when adding new item', async () => {
      const savedData = [];
      mockFs.promises.writeFile.mockImplementation(async (path, data) => {
        savedData.push(JSON.parse(data));
      });

      await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(savedData[0]).toHaveLength(mockItems.length + 1);
      expect(savedData[0].slice(0, -1)).toEqual(mockItems);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock an error that occurs during processing
      mockFs.promises.readFile.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .get('/api/items')
        .expect(500);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        category: 'Test',
        price: Math.floor(Math.random() * 1000)
      }));

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(largeDataset));

      const response = await request(app)
        .get('/api/items?limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.totalItems).toBe(10000);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow: create item and retrieve it', async () => {
      const newItemForIntegration = {
        name: 'Integration Test Item',
        category: 'Test',
        price: 299
      };

      // First, create an item
      const createResponse = await request(app)
        .post('/api/items')
        .send(newItemForIntegration)
        .expect(201);

      const createdItem = createResponse.body;

      // Mock the updated data for subsequent reads
      const updatedItems = [...mockItems, createdItem];
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(updatedItems));

      // Then retrieve all items
      const getAllResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getAllResponse.body.data).toHaveLength(mockItems.length + 1);
      expect(getAllResponse.body.data).toContainEqual(createdItem);

      // Finally, retrieve the specific item
      const getOneResponse = await request(app)
        .get(`/api/items/${createdItem.id}`)
        .expect(200);

      expect(getOneResponse.body).toEqual(createdItem);
    });

    it('should handle search and pagination together', async () => {
      const largeDataset = [
        ...mockItems,
        { id: 4, name: 'Electronics Gadget 1', category: 'Electronics', price: 100 },
        { id: 5, name: 'Electronics Gadget 2', category: 'Electronics', price: 200 },
        { id: 6, name: 'Electronics Gadget 3', category: 'Electronics', price: 300 },
        { id: 7, name: 'Furniture Item', category: 'Furniture', price: 500 }
      ];

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(largeDataset));

      const response = await request(app)
        .get('/api/items?q=electronics&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(item => 
        item.name.toLowerCase().includes('electronics') || 
        item.category.toLowerCase().includes('electronics')
      )).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items file', async () => {
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify([]));

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
    });

    it('should handle zero limit parameter', async () => {
      const response = await request(app)
        .get('/api/items?limit=0')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.itemsPerPage).toBe(0);
    });

    it('should handle negative limit parameter', async () => {
      const response = await request(app)
        .get('/api/items?limit=-1')
        .expect(200);

      // slice(0, -1) returns all but the last element
      expect(response.body.data).toHaveLength(mockItems.length - 1);
      expect(response.body.data).toEqual(mockItems.slice(0, -1));
    });

    it('should handle non-numeric limit parameter', async () => {
      const response = await request(app)
        .get('/api/items?limit=abc')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should handle special characters in search query', async () => {
      const response = await request(app)
        .get('/api/items?q=@#$%')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/items?q=')
        .expect(200);

      expect(response.body.data).toEqual(mockItems);
    });

    it('should handle item with id 0', async () => {
      const itemsWithZeroId = [
        { id: 0, name: 'Zero ID Item', category: 'Test', price: 100 },
        ...mockItems
      ];

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(itemsWithZeroId));

      const response = await request(app)
        .get('/api/items/0')
        .expect(200);

      expect(response.body).toEqual(itemsWithZeroId[0]);
    });

    it('should handle POST with null values', async () => {
      const itemWithNulls = {
        name: null,
        category: null,
        price: null
      };

      const response = await request(app)
        .post('/api/items')
        .send(itemWithNulls)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBeNull();
      expect(response.body.category).toBeNull();
      expect(response.body.price).toBeNull();
    });
  });

  describe('Pagination and Search', () => {
    it('should return paginated results with metadata', async () => {
      const response = await request(app)
        .get('/api/items?page=1&limit=3')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        itemsPerPage: 3,
        totalItems: mockItems.length
      });
    });

    it('should return second page of results', async () => {
      const response = await request(app)
        .get('/api/items?page=2&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(1); // Third item
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(false);
      expect(response.body.pagination.hasPrevPage).toBe(true);
    });

    it('should search with pagination', async () => {
      const response = await request(app)
        .get('/api/items?q=electronics&page=1&limit=2')
        .expect(200);

      expect(response.body.data.every(item => 
        item.name.toLowerCase().includes('electronics') || 
        item.category.toLowerCase().includes('electronics')
      )).toBe(true);
      expect(response.body.pagination.itemsPerPage).toBe(2);
    });

    it('should sort results by name ascending', async () => {
      const response = await request(app)
        .get('/api/items?sortBy=name&sortOrder=asc')
        .expect(200);

      const names = response.body.data.map(item => item.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort results by price descending', async () => {
      const response = await request(app)
        .get('/api/items?sortBy=price&sortOrder=desc')
        .expect(200);

      const prices = response.body.data.map(item => item.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/items?category=Electronics')
        .expect(200);

      expect(response.body.data.every(item => 
        item.category === 'Electronics'
      )).toBe(true);
    });

    it('should handle invalid page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/items?page=999&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.currentPage).toBe(999);
    });

    it('should return default pagination when no params provided', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(10);
    });
  });

  describe('Advanced Search Endpoint', () => {
    it('should search items with advanced filters', async () => {
      const response = await request(app)
        .get('/api/items/search?q=laptop&minPrice=1000&maxPrice=3000')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
    });

    it('should filter by price range', async () => {
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'Cheap Item', category: 'Test', price: 10 },
        { id: 2, name: 'Expensive Item', category: 'Test', price: 1000 }
      ]));

      const response = await request(app)
        .get('/api/items/search?minPrice=500')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].price).toBe(1000);
    });
  });

  describe('Categories Endpoint', () => {
    it('should return available categories', async () => {
      const response = await request(app)
        .get('/api/items/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });

    it('should return unique categories only', async () => {
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'Item 1', category: 'Electronics', price: 100 },
        { id: 2, name: 'Item 2', category: 'Electronics', price: 200 },
        { id: 3, name: 'Item 3', category: 'Furniture', price: 300 }
      ]));

      const response = await request(app)
        .get('/api/items/categories')
        .expect(200);

      expect(response.body.categories).toEqual(['Electronics', 'Furniture']);
    });
  });
});
