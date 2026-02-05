export type CatalogProduct = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CatalogFilters = {
  selectedCategory: string
  searchQuery: string
  showOnlyActive: boolean
}

const normalizeText = (value: string) => value.trim().toLowerCase()

export const productMatchesCatalogFilters = (
  product: CatalogProduct,
  filters: CatalogFilters
) => {
  const categoryKey = product.category ?? 'uncategorized'
  const matchesCategory =
    filters.selectedCategory === 'all' || categoryKey === filters.selectedCategory

  const query = normalizeText(filters.searchQuery)
  const matchesSearch =
    query.length === 0 ||
    normalizeText(product.name).includes(query) ||
    normalizeText(product.description).includes(query)

  const matchesActive = !filters.showOnlyActive || product.isActive
  return matchesCategory && matchesSearch && matchesActive
}

export const filterCatalogProducts = (
  products: CatalogProduct[],
  filters: CatalogFilters
) => products.filter((product) => productMatchesCatalogFilters(product, filters))

export const buildCatalogStats = (products: CatalogProduct[]) => {
  const categoryCount = new Set(products.map((product) => product.category ?? 'uncategorized')).size
  const currencyCount = new Set(products.map((product) => product.currency ?? 'TRY')).size
  return {
    total: products.length,
    active: products.filter((product) => product.isActive).length,
    categories: categoryCount,
    currencies: currencyCount,
  }
}
