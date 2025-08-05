const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (now async and non-blocking)
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Helper function to get unique categories
async function getCategories() {
  const data = await readData();
  const categories = [...new Set(data.map(item => item.category))];
  return categories.sort();
}

// Helper function for advanced search
function searchItems(items, filters) {
  const { q, category, minPrice, maxPrice } = filters;
  
  return items.filter(item => {
    // Text search
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      const matchesText = item.name.toLowerCase().includes(searchTerm) ||
                         item.category.toLowerCase().includes(searchTerm);
      if (!matchesText) return false;
    }
    
    // Category filter
    if (category && category.trim()) {
      if (item.category.toLowerCase() !== category.toLowerCase().trim()) {
        return false;
      }
    }
    
    // Price range filter
    if (minPrice && item.price < parseFloat(minPrice)) return false;
    if (maxPrice && item.price > parseFloat(maxPrice)) return false;
    
    return true;
  });
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { 
      limit = 10, 
      page = 1, 
      q = '', 
      sortBy = 'id', 
      sortOrder = 'asc',
      category = ''
    } = req.query;

    // Parse pagination parameters
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    // Apply search filters
    let filteredResults = data;

    // Text search across name and category
    if (q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      filteredResults = filteredResults.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (category.trim()) {
      filteredResults = filteredResults.filter(item => 
        item.category.toLowerCase() === category.toLowerCase().trim()
      );
    }

    // Get total count after filtering for pagination metadata
    const totalItems = filteredResults.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Apply sorting
    filteredResults.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Apply pagination
    const paginatedResults = filteredResults.slice(offset, offset + limitNum);

    // Return paginated response with metadata
    res.json({
      data: paginatedResults,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        search: q,
        category,
        sortBy,
        sortOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/search - Advanced search endpoint
router.get('/search', async (req, res, next) => {
  try {
    const data = await readData();
    const { 
      q = '', 
      category = '',
      minPrice = '',
      maxPrice = '',
      limit = 10, 
      page = 1, 
      sortBy = 'id', 
      sortOrder = 'asc'
    } = req.query;

    // Parse pagination parameters
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    // Apply advanced search
    const filteredResults = searchItems(data, { q, category, minPrice, maxPrice });
    
    // Get total count for pagination
    const totalItems = filteredResults.length;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Apply sorting
    filteredResults.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Apply pagination
    const paginatedResults = filteredResults.slice(offset, offset + limitNum);

    res.json({
      data: paginatedResults,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        search: q,
        category,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/categories - Get available categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;