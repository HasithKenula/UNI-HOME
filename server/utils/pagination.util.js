// ============================================================================
// Pagination Utility - Helper for paginated API responses
// ============================================================================

/**
 * Paginate query results
 * @param {Model} model - Mongoose model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.sort - Sort field (default: '-createdAt')
 * @param {string} options.select - Fields to select
 * @param {string|Array} options.populate - Fields to populate
 * @returns {Object} Paginated results with metadata
 */
const paginate = async (model, query = {}, options = {}) => {
  // Parse pagination parameters
  const page = parseInt(options.page, 10) || 1;
  const limit = Math.min(
    parseInt(options.limit, 10) || parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
    parseInt(process.env.MAX_PAGE_SIZE) || 100
  );
  const sort = options.sort || '-createdAt';
  const select = options.select || '';
  const populate = options.populate || null;

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Count total documents
  const total = await model.countDocuments(query);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Build query
  let mongoQuery = model.find(query).sort(sort).skip(skip).limit(limit);

  // Apply select if provided
  if (select) {
    mongoQuery = mongoQuery.select(select);
  }

  // Apply populate if provided
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        mongoQuery = mongoQuery.populate(pop);
      });
    } else {
      mongoQuery = mongoQuery.populate(populate);
    }
  }

  // Execute query
  const data = await mongoQuery;

  // Return paginated response
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
};

/**
 * Get pagination parameters from request query
 * @param {Object} req - Express request object
 * @returns {Object} Pagination options
 */
const getPaginationParams = (req) => {
  return {
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
    select: req.query.select,
    populate: req.query.populate
  };
};

/**
 * Create pagination response object
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Formatted pagination response
 */
const createPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

export {
  paginate,
  getPaginationParams,
  createPaginationResponse
};
