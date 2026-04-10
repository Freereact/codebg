import { describe, expect, it, vi, beforeEach } from 'vitest'

// ===== Mocks =====
const mockPrisma = {
  contentRequest: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    groupBy: vi.fn(),
  },
}

const mockRedis = {
  set: vi.fn(),
}

const mockEmitProjectEvent = vi.fn()
const mockEmitAdminEvent = vi.fn()
const mockNotifyAdminNewFeedback = vi.fn().mockResolvedValue(undefined)
const mockNotifyUserFeedbackResponse = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../src/redis.js', () => ({ redis: mockRedis }))
vi.mock('../src/projects/events.js', () => ({
  emitProjectEvent: mockEmitProjectEvent,
  emitAdminEvent: mockEmitAdminEvent,
}))
vi.mock('../src/admin/notifications.js', () => ({
  notifyAdminNewFeedback: mockNotifyAdminNewFeedback,
  notifyUserFeedbackResponse: mockNotifyUserFeedbackResponse,
}))

const {
  verifyFeedbackOwnership,
  listMessages,
  createCustomerMessage,
  createAdminMessage,
  markMessagesRead,
  getUnreadCountsForProject,
  getAdminUnreadCounts,
  FeedbackNotFoundError,
} = await import('../src/projects/message-service.js')

beforeEach(() => {
  vi.clearAllMocks()
  // By default the debounce key is fresh (Redis returns 'OK' on SET NX)
  mockRedis.set.mockResolvedValue('OK')
})

// ===== verifyFeedbackOwnership =====

describe('verifyFeedbackOwnership', () => {
  it('passes when feedback belongs to the project', async () => {
    mockPrisma.contentRequest.findFirst.mockResolvedValue({ id: 'fb-1' })
    await expect(verifyFeedbackOwnership('fb-1', 'proj-1')).resolves.toBeUndefined()
    expect(mockPrisma.contentRequest.findFirst).toHaveBeenCalledWith({
      where: { id: 'fb-1', projectId: 'proj-1' },
      select: { id: true },
    })
  })

  it('throws FeedbackNotFoundError when feedback does not belong to the project', async () => {
    mockPrisma.contentRequest.findFirst.mockResolvedValue(null)
    await expect(verifyFeedbackOwnership('fb-1', 'wrong-proj')).rejects.toBeInstanceOf(FeedbackNotFoundError)
  })

  it('throws FeedbackNotFoundError when feedback does not exist', async () => {
    mockPrisma.contentRequest.findFirst.mockResolvedValue(null)
    await expect(verifyFeedbackOwnership('nonexistent', 'proj-1')).rejects.toBeInstanceOf(FeedbackNotFoundError)
  })
})

// ===== listMessages =====

describe('listMessages', () => {
  it('returns messages in chronological order', async () => {
    const now = new Date('2026-04-09T12:00:00Z')
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        contentRequestId: 'fb-1',
        authorId: 'user-1',
        authorRole: 'client',
        body: 'first',
        readAt: null,
        createdAt: now,
      },
    ])
    const result = await listMessages('fb-1')
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('first')
    expect(result[0].createdAt).toBe(now.toISOString())
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { contentRequestId: 'fb-1' },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
  })

  it('serializes readAt to ISO string when set', async () => {
    const readAt = new Date('2026-04-09T12:30:00Z')
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        contentRequestId: 'fb-1',
        authorId: 'user-1',
        authorRole: 'admin',
        body: 'reply',
        readAt,
        createdAt: new Date(),
      },
    ])
    const result = await listMessages('fb-1')
    expect(result[0].readAt).toBe(readAt.toISOString())
  })

  it('returns empty array when no messages', async () => {
    mockPrisma.message.findMany.mockResolvedValue([])
    expect(await listMessages('fb-1')).toEqual([])
  })
})

// ===== createCustomerMessage =====

describe('createCustomerMessage', () => {
  const baseFeedback = {
    id: 'fb-1',
    projectId: 'proj-1',
    status: 'pending',
    title: 'Hero section',
    project: { subdomain: 'mysite' },
    user: { email: 'user@example.com' },
  }

  beforeEach(() => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue(baseFeedback)
    mockPrisma.message.create.mockResolvedValue({
      id: 'msg-1',
      contentRequestId: 'fb-1',
      authorId: 'user-1',
      authorRole: 'client',
      body: 'Please update',
      readAt: null,
      createdAt: new Date(),
    })
  })

  it('throws FeedbackNotFoundError when feedback does not exist', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue(null)
    await expect(createCustomerMessage('fb-1', 'user-1', 'msg')).rejects.toBeInstanceOf(FeedbackNotFoundError)
  })

  it('creates a Message with authorRole client', async () => {
    await createCustomerMessage('fb-1', 'user-1', 'Please update')
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: { contentRequestId: 'fb-1', authorId: 'user-1', authorRole: 'client', body: 'Please update' },
    })
  })

  it('emits SSE event on project channel', async () => {
    await createCustomerMessage('fb-1', 'user-1', 'msg')
    expect(mockEmitProjectEvent).toHaveBeenCalledWith('proj-1', expect.objectContaining({ type: 'new-message' }))
  })

  it('emits SSE event on admin channel', async () => {
    await createCustomerMessage('fb-1', 'user-1', 'msg')
    expect(mockEmitAdminEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'new-message', projectId: 'proj-1' }),
    )
  })

  it('reopens completed feedback to in_progress when customer replies', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue({ ...baseFeedback, status: 'completed' })
    await createCustomerMessage('fb-1', 'user-1', 'one more thing')
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith({
      where: { id: 'fb-1' },
      data: { status: 'in_progress', completedAt: null },
    })
  })

  it('reopens rejected feedback to in_progress when customer replies', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue({ ...baseFeedback, status: 'rejected' })
    await createCustomerMessage('fb-1', 'user-1', 'reconsider please')
    expect(mockPrisma.contentRequest.update).toHaveBeenCalled()
  })

  it('does NOT reopen pending or in_progress feedback', async () => {
    await createCustomerMessage('fb-1', 'user-1', 'msg')
    expect(mockPrisma.contentRequest.update).not.toHaveBeenCalled()
  })

  it('queues debounced admin email notification', async () => {
    await createCustomerMessage('fb-1', 'user-1', 'msg')
    // Allow microtasks to flush
    await new Promise((r) => setImmediate(r))
    expect(mockRedis.set).toHaveBeenCalledWith('email_debounce:feedback:fb-1:admin', '1', 'EX', 900, 'NX')
    expect(mockNotifyAdminNewFeedback).toHaveBeenCalled()
  })

  it('skips email when debounce key already set (returns null from Redis)', async () => {
    mockRedis.set.mockResolvedValue(null)
    await createCustomerMessage('fb-1', 'user-1', 'msg')
    await new Promise((r) => setImmediate(r))
    expect(mockNotifyAdminNewFeedback).not.toHaveBeenCalled()
  })
})

// ===== createAdminMessage =====

describe('createAdminMessage', () => {
  const baseFeedback = {
    id: 'fb-1',
    projectId: 'proj-1',
    title: 'Hero section',
    user: { id: 'user-1', email: 'user@example.com', name: 'Alice' },
  }

  beforeEach(() => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue(baseFeedback)
    mockPrisma.message.create.mockResolvedValue({
      id: 'msg-2',
      contentRequestId: 'fb-1',
      authorId: 'admin-1',
      authorRole: 'admin',
      body: 'Done',
      readAt: null,
      createdAt: new Date(),
    })
  })

  it('throws FeedbackNotFoundError when feedback does not exist', async () => {
    mockPrisma.contentRequest.findUnique.mockResolvedValue(null)
    await expect(createAdminMessage('fb-1', 'admin-1', 'reply')).rejects.toBeInstanceOf(FeedbackNotFoundError)
  })

  it('creates a Message with authorRole admin', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'Done')
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: { contentRequestId: 'fb-1', authorId: 'admin-1', authorRole: 'admin', body: 'Done' },
    })
  })

  it('does not update status when status arg is undefined', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'msg')
    expect(mockPrisma.contentRequest.update).not.toHaveBeenCalled()
  })

  it('updates status when provided', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'msg', 'in_progress')
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith({
      where: { id: 'fb-1' },
      data: { status: 'in_progress', completedAt: undefined },
    })
  })

  it('sets completedAt when status is completed', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'msg', 'completed')
    expect(mockPrisma.contentRequest.update).toHaveBeenCalledWith({
      where: { id: 'fb-1' },
      data: { status: 'completed', completedAt: expect.any(Date) },
    })
  })

  it('emits SSE event on project channel only (not admin channel)', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'msg')
    expect(mockEmitProjectEvent).toHaveBeenCalledWith('proj-1', expect.objectContaining({ type: 'new-message' }))
    expect(mockEmitAdminEvent).not.toHaveBeenCalled()
  })

  it('queues debounced customer email notification', async () => {
    await createAdminMessage('fb-1', 'admin-1', 'msg')
    await new Promise((r) => setImmediate(r))
    expect(mockRedis.set).toHaveBeenCalledWith('email_debounce:feedback:fb-1:client', '1', 'EX', 900, 'NX')
    expect(mockNotifyUserFeedbackResponse).toHaveBeenCalled()
  })
})

// ===== markMessagesRead =====

describe('markMessagesRead', () => {
  it('marks admin messages as read when reader is client', async () => {
    mockPrisma.message.updateMany.mockResolvedValue({ count: 3 })
    const count = await markMessagesRead('fb-1', 'client')
    expect(count).toBe(3)
    expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
      where: { contentRequestId: 'fb-1', authorRole: 'admin', readAt: null },
      data: { readAt: expect.any(Date) },
    })
  })

  it('marks client messages as read when reader is admin', async () => {
    mockPrisma.message.updateMany.mockResolvedValue({ count: 1 })
    const count = await markMessagesRead('fb-1', 'admin')
    expect(count).toBe(1)
    expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
      where: { contentRequestId: 'fb-1', authorRole: 'client', readAt: null },
      data: { readAt: expect.any(Date) },
    })
  })

  it('returns 0 when nothing was unread', async () => {
    mockPrisma.message.updateMany.mockResolvedValue({ count: 0 })
    expect(await markMessagesRead('fb-1', 'client')).toBe(0)
  })
})

// ===== Unread counts =====

describe('getUnreadCountsForProject', () => {
  it('aggregates per-feedback counts and total', async () => {
    mockPrisma.message.groupBy.mockResolvedValue([
      { contentRequestId: 'fb-1', _count: { id: 2 } },
      { contentRequestId: 'fb-2', _count: { id: 1 } },
    ])
    const result = await getUnreadCountsForProject('proj-1', 'user-1')
    expect(result.total).toBe(3)
    expect(result.byFeedback).toEqual({ 'fb-1': 2, 'fb-2': 1 })
  })

  it('returns zero when no unread messages', async () => {
    mockPrisma.message.groupBy.mockResolvedValue([])
    expect(await getUnreadCountsForProject('proj-1', 'user-1')).toEqual({ total: 0, byFeedback: {} })
  })

  it('only counts messages with authorRole=admin (those the customer should read)', async () => {
    mockPrisma.message.groupBy.mockResolvedValue([])
    await getUnreadCountsForProject('proj-1', 'user-1')
    expect(mockPrisma.message.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ authorRole: 'admin', readAt: null }),
      }),
    )
  })
})

describe('getAdminUnreadCounts', () => {
  it('aggregates global per-feedback counts', async () => {
    mockPrisma.message.groupBy.mockResolvedValue([
      { contentRequestId: 'fb-1', _count: { id: 1 } },
      { contentRequestId: 'fb-2', _count: { id: 4 } },
    ])
    const result = await getAdminUnreadCounts()
    expect(result.total).toBe(5)
    expect(result.byFeedback).toEqual({ 'fb-1': 1, 'fb-2': 4 })
  })

  it('only counts messages with authorRole=client (those the admin should read)', async () => {
    mockPrisma.message.groupBy.mockResolvedValue([])
    await getAdminUnreadCounts()
    expect(mockPrisma.message.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ authorRole: 'client', readAt: null }),
      }),
    )
  })
})
