type SignatureBlock = {
  type: 'signature'
  data: {
    label?: string
    required?: boolean
    signatureImage?: string
    signedName?: string
    signedAt?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

type ProposalBlock = {
  type: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

export const applySignatureToBlocks = (
  blocks: ProposalBlock[],
  signature: string,
  name: string,
  signedAt: string
) => {
  let updatedCount = 0

  const nextBlocks = blocks.map((block) => {
    if (block?.type !== 'signature') {
      return block
    }

    updatedCount += 1
    const signatureBlock = block as SignatureBlock
    return {
      ...signatureBlock,
      data: {
        ...(signatureBlock.data ?? {}),
        signatureImage: signature,
        signedName: name,
        signedAt,
      },
    }
  })

  return {
    blocks: nextBlocks,
    updatedCount,
  }
}
