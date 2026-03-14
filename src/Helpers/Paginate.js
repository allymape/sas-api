const paginate = async (model, options = {}) => {
  const req = options.req || {};
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 15;
  const offset = (page - 1) * perPage;
  const { count, rows } = await model.findAndCountAll({
    ...options,
    limit: perPage,
    offset: offset,
  });

  return {
    data: rows,
    current_page: page,
    per_page: perPage,
    total: count,
    last_page: Math.ceil(count / perPage),
  };
};

module.exports = paginate;
