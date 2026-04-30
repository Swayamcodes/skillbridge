export const getPaginationParams = (query) => {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 12;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const getPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit)
});
