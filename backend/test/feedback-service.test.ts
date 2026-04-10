import { describe, expect, it, vi, beforeEach } from 'vitest'

// ===== Mocks =====
const mockPrisma = {
  contentRequest: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  message: {
    create: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}

const mockNotifyAdminNewFeedback = vi.fn().mockResolvedValue(undefined)
const mockEmitAdminEvent = vi.fn()

vi.mock('../src/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../src/admin/notifications.js', () => ({
  notifyAdminNewFeedback: mockNotifyAdminNewFeedback,
}))
vi.mock('../src/projects/events.js', () => ({
  emitAdminEvent: mockEmitAdminEvent,
}))

const { createFeedback, listFeedback, updateFeedback } = await import('../src/projects/feedback-service.js')

beforeEach(() => {
  vi.clearAllMocks()
  // Default $transaction behavior: invoke the callback with mockPrisma as the tx
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma))
})

// ===== createFeedback =====

describe('createFeedback', () => {
  const baseInput = {
    sectionId: 'hero',
    sectionTitle: 'Hero section',
    description: 'Please change the headline',
  }

  beforeEach(() => {
    mockPrisma.contentRequest.create.mockResolvedValue({
      id: 'fb-1',
      projectId: 'proj-1',
      userId: 'user-1',
      title: 'Hero section',
      description: 'Please change the headline',
      attachments: { sectionId: 'hero', sectionTitle: 'Hero section' },
      status: 'pending',
      adminResponse: null,
      completedAt: null,
      createdAt: new Date('2026-04-09T12:00:00Z'),
    })
    mockPrisma.message.create.mockResolvedValue({
      id: 'msg-1',
      contentRequestId: 'fb-1',
      authorId: 'user-1',
      authorRole: 'client',
      body: 'Please change the headline',
      readAt: null,
      createdAt: new Date('2026-04-09T12:00:00Z'),
    })
    mockPrisma.project.findUnique.mockResolvedValue({ subdomain: 'mysite' })
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'user@example.com' })
  })

  it('creates ContentRequest and initial Message in a transaction', async () => {
    await createFeedback('proj-1', 'user-1', baseInput)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mockPrisma.contentRequest.create).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        userId: 'user-1',
        title: 'Hero section',
        description: 'Please change the headline',
        attachments: { sectionId: 'hero', sectionTitle: 'Hero section' },
      },
    })
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        contentRequestId: 'fb-1',
        authorId: 'user-1',
        authorRole: 'client',
        body: 'Please change the headline',
      },
    })
  })

  it('emits admin SSE event with the new message', async () => {
    await createFeedback('proj-1', 'user-1', baseInput)
    expect(mockEmitAdminEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'new-message',
        projectId: 'proj-1',
        data: expect.objectContaining({
          feedbackId: 'fb-1',
          message: expect.objectContaining({ authorRole: 'client', body: 'Please change the headline' }),
        }),
      }),
    )
  })

  it('sends admin email notification', async () => {
    await createFeedback('proj-1', 'user-1', baseInput)
    // Allow fire-and-forget promise to flush
    await new Promise((r) => setImmediate(r))
    expect(mockNotifyAdminNewFeedback).toHaveBeenCalledWith(
      'user@example.com',
      'mysite',
      'Hero section',
      'Please change the headline',
    )
  })

  it('falls back to projectId when subdomain is null', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ subdomain: null })
    await createFeedback('proj-1', 'user-1', baseInput)
    await new Promise((r) => setImmediate(r))
    expect(mockNotifyAdminNewFeedback).toHaveBeenCalledWith(
      'user@example.com',
      'proj-1',
      'Hero section',
      'Please change the headline',
    )
  })

  it('skips email if user or project not found', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)
    await createFeedback('proj-1', 'user-1', baseInput)
    await new Promise((r) => setImmediate(r))
    expect(mockNotifyAdminNewFeedback).not.toHaveBeenCalled()
  })

  it('returns mapped FeedbackItem with sectionId from attachments', async () => {
    const result = await createFeedback('proj-1', 'user-1', baseInput)
    expect(result).toMatchObject({
      id: 'fb-1',
      sectionId: 'hero',
      sectionTitle: 'Hero section',
      description: 'Please change the headline',
      status: 'pending',
    })
  })

  it('rolls back both ContentRequest and Message if message creation fails', async () => {
    // Simulate transaction throwing on message.create
    mockPrisma.$transaction.mockImplementation(async () => {
      throw new Error('message create failed')
    })
    await expect(createFeedback('proj-1', 'user-1', baseInput)).rejects.toThrow('message create failed')
    // notifyAdminNewFeedback should NOT have been called since we threw before reaching it
    await new Promise((r) => setImmediate(r))
    expect(mockNotifyAdminNewFeedback).not.toHaveBeenCalled()
  })
})

// ===== listFeedback =====

describe('listFeedback', () => {
  it('returns mapped feedback items for a project owned by user', async () => {
    mockPrisma.contentRequest.findMany.mockResolvedValue([
      {
        id: 'fb-1',
        title: 'Hero',
        description: 'change it',
        attachments: { sectionId: 'hero', sectionTitle: 'Hero' },
        status: 'pending',
        adminResponse: null,
        completedAt: null,
        createdAt: new Date('2026-04-09T12:00:00Z'),
      },
    ])
    const result = await listFeedback('proj-1', 'user-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'fb-1', sectionId: 'hero', sectionTitle: 'Hero' })
  })

  it('passes both projectId and userId filter to Prisma (ownership)', async () => {
    mockPrisma.contentRequest.findMany.mockResolvedValue([])
    await listFeedback('proj-1', 'user-1')
    expect(mockPrisma.contentRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-1', userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    )
  })

  it('returns empty array when no feedback', async () => {
    mockPrisma.contentRequest.findMany.mockResolvedValue([])
    expect(await listFeedback('proj-1', 'user-1')).toEqual([])
  })
})

// ===== updateFeedback =====

describe('updateFeedback', () => {
  it('returns null when feedback not found', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue(null)
    expect(await updateFeedback('fb-1', { status: 'completed' })).toBeNull()
  })

  it('updates status and sets completedAt when status=completed', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue({ id: 'fb-1' })
    mockPrisma.contentRequest.update.mockResolvedValue({
      id: 'fb-1',
      title: 'Hero',
      description: 'desc',
      attachments: {},
      status: 'completed',
      adminResponse: null,
      completedAt: new Date(),
      createdAt: new Date(),
    })
    await updateFeedback('fb-1', { status: 'completed' })
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith({
      where: { id: 'fb-1' },
      data: { status: 'completed', adminResponse: undefined, completedAt: expect.any(Date) },
    })
  })

  it('does not set completedAt when status is not completed', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue({ id: 'fb-1' })
    mockPrisma.contentRequest.update.mockResolvedValue({
      id: 'fb-1',
      title: 'Hero',
      description: 'desc',
      attachments: {},
      status: 'in_progress',
      adminResponse: null,
      completedAt: null,
      createdAt: new Date(),
    })
    await updateFeedback('fb-1', { status: 'in_progress' })
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith({
      where: { id: 'fb-1' },
      data: { status: 'in_progress', adminResponse: undefined, completedAt: undefined },
    })
  })

  it('updates adminResponse when provided', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue({ id: 'fb-1' })
    mockPrisma.contentRequest.update.mockResolvedValue({
      id: 'fb-1',
      title: 'Hero',
      description: 'desc',
      attachments: {},
      status: 'pending',
      adminResponse: 'Got it',
      completedAt: null,
      createdAt: new Date(),
    })
    await updateFeedback('fb-1', { adminResponse: 'Got it' })
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ adminResponse: 'Got it' }) }),
    )
  })
})
