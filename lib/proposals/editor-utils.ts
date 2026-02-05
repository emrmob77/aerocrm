type BlockWithId = {
  id: string
}

export const insertBlockAt = <T extends BlockWithId>(blocks: T[], newBlock: T, index?: number) => {
  if (index === undefined || index < 0 || index > blocks.length) {
    return [...blocks, newBlock]
  }

  const next = [...blocks]
  next.splice(index, 0, newBlock)
  return next
}

type HeroBlock = { type: 'hero'; data: { title?: string } }
type HeadingBlock = { type: 'heading'; data: { text?: string } }
type TextBlock = { type: 'text'; data: { content?: string } }
type TestimonialBlock = { type: 'testimonial'; data: { quote?: string } }

type SmartVariableBlock =
  | HeroBlock
  | HeadingBlock
  | TextBlock
  | TestimonialBlock
  | { type: string; data: Record<string, unknown> }

const appendVariable = (current: string | undefined, value: string) => `${current ?? ''} ${value}`.trim()
const readString = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const appendSmartVariableToBlock = <T extends SmartVariableBlock>(block: T, value: string): T => {
  if (block.type === 'hero') {
    return {
      ...block,
      data: {
        ...block.data,
        title: appendVariable(readString(block.data.title), value),
      },
    } as T
  }

  if (block.type === 'heading') {
    return {
      ...block,
      data: {
        ...block.data,
        text: appendVariable(readString(block.data.text), value),
      },
    } as T
  }

  if (block.type === 'text') {
    return {
      ...block,
      data: {
        ...block.data,
        content: appendVariable(readString(block.data.content), value),
      },
    } as T
  }

  if (block.type === 'testimonial') {
    return {
      ...block,
      data: {
        ...block.data,
        quote: appendVariable(readString(block.data.quote), value),
      },
    } as T
  }

  return block
}
