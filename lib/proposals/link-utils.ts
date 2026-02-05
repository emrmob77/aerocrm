const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '')

export const createProposalSlug = (idFactory: () => string = () => crypto.randomUUID()) =>
  idFactory().replace(/-/g, '')

export const buildPublicProposalUrl = (origin: string, slug: string = createProposalSlug()) =>
  `${normalizeOrigin(origin)}/p/${slug}`
