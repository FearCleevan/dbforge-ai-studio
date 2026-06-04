import { QueryResult } from '@/types'

export const mockQueryResults: Record<string, QueryResult> = {
  users: {
    columns: ['id', 'email', 'name', 'role', 'created_at'],
    rows: [
      { id: '550e8400-e29b-41d4-a716-446655440001', email: 'alex@example.com', name: 'Alex Chen', role: 'customer', created_at: '2024-01-15T10:23:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440002', email: 'maya@example.com', name: 'Maya Patel', role: 'admin', created_at: '2024-01-16T09:12:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440003', email: 'sam@example.com', name: 'Sam Rivera', role: 'customer', created_at: '2024-01-17T14:45:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440004', email: 'jordan@example.com', name: 'Jordan Lee', role: 'customer', created_at: '2024-01-18T11:30:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440005', email: 'taylor@example.com', name: 'Taylor Kim', role: 'customer', created_at: '2024-01-19T16:00:00Z' },
      { id: '550e8400-e29b-41d4-a716-446655440006', email: 'casey@example.com', name: 'Casey Morgan', role: 'customer', created_at: '2024-01-20T08:15:00Z' },
    ],
    rowCount: 6,
    executionMs: 12,
  },
  products: {
    columns: ['id', 'name', 'sku', 'price', 'stock_qty', 'is_active'],
    rows: [
      { id: 'prod-001', name: 'Wireless Headphones Pro', sku: 'WHP-001', price: 149.99, stock_qty: 245, is_active: true },
      { id: 'prod-002', name: 'Mechanical Keyboard RGB', sku: 'MKR-002', price: 89.99, stock_qty: 132, is_active: true },
      { id: 'prod-003', name: 'USB-C Hub 7-Port', sku: 'UCH-003', price: 39.99, stock_qty: 412, is_active: true },
      { id: 'prod-004', name: 'Monitor Stand Adjustable', sku: 'MSA-004', price: 59.99, stock_qty: 88, is_active: true },
      { id: 'prod-005', name: 'Webcam 4K UHD', sku: 'WCU-005', price: 129.99, stock_qty: 0, is_active: false },
      { id: 'prod-006', name: 'Laptop Cooling Pad', sku: 'LCP-006', price: 29.99, stock_qty: 305, is_active: true },
      { id: 'prod-007', name: 'Bluetooth Mouse Silent', sku: 'BMS-007', price: 49.99, stock_qty: 198, is_active: true },
    ],
    rowCount: 7,
    executionMs: 8,
  },
  orders: {
    columns: ['id', 'user_id', 'status', 'total', 'created_at'],
    rows: [
      { id: 'ord-101', user_id: '550e8400-e29b-41d4-a716-446655440001', status: 'shipped', total: 249.99, created_at: '2024-02-01T10:00:00Z' },
      { id: 'ord-102', user_id: '550e8400-e29b-41d4-a716-446655440003', status: 'delivered', total: 89.99, created_at: '2024-02-03T14:30:00Z' },
      { id: 'ord-103', user_id: '550e8400-e29b-41d4-a716-446655440002', status: 'pending', total: 169.98, created_at: '2024-02-05T09:15:00Z' },
      { id: 'ord-104', user_id: '550e8400-e29b-41d4-a716-446655440004', status: 'processing', total: 59.99, created_at: '2024-02-07T11:45:00Z' },
      { id: 'ord-105', user_id: '550e8400-e29b-41d4-a716-446655440005', status: 'delivered', total: 329.97, created_at: '2024-02-08T16:20:00Z' },
    ],
    rowCount: 5,
    executionMs: 15,
  },
  categories: {
    columns: ['id', 'name', 'slug', 'parent_id'],
    rows: [
      { id: 'cat-001', name: 'Electronics', slug: 'electronics', parent_id: null },
      { id: 'cat-002', name: 'Audio', slug: 'audio', parent_id: 'cat-001' },
      { id: 'cat-003', name: 'Accessories', slug: 'accessories', parent_id: 'cat-001' },
      { id: 'cat-004', name: 'Peripherals', slug: 'peripherals', parent_id: 'cat-001' },
    ],
    rowCount: 4,
    executionMs: 6,
  },
  posts: {
    columns: ['id', 'title', 'status', 'published_at', 'author_id'],
    rows: [
      { id: 'post-001', title: 'Getting Started with TypeScript', status: 'published', published_at: '2024-01-10T09:00:00Z', author_id: 'user-001' },
      { id: 'post-002', title: 'React 18 New Features Deep Dive', status: 'published', published_at: '2024-01-15T10:00:00Z', author_id: 'user-002' },
      { id: 'post-003', title: 'Building Scalable APIs with Node.js', status: 'draft', published_at: null, author_id: 'user-001' },
      { id: 'post-004', title: 'TailwindCSS Best Practices', status: 'published', published_at: '2024-01-20T14:00:00Z', author_id: 'user-003' },
      { id: 'post-005', title: 'Database Design Fundamentals', status: 'published', published_at: '2024-01-25T11:00:00Z', author_id: 'user-002' },
      { id: 'post-006', title: 'Advanced PostgreSQL Optimization', status: 'draft', published_at: null, author_id: 'user-001' },
    ],
    rowCount: 6,
    executionMs: 11,
  },
  organizations: {
    columns: ['id', 'name', 'slug', 'created_at'],
    rows: [
      { id: 'org-001', name: 'Acme Corp', slug: 'acme-corp', created_at: '2024-01-01T00:00:00Z' },
      { id: 'org-002', name: 'TechStart Inc', slug: 'techstart-inc', created_at: '2024-01-05T00:00:00Z' },
      { id: 'org-003', name: 'DevOps Labs', slug: 'devops-labs', created_at: '2024-01-10T00:00:00Z' },
      { id: 'org-004', name: 'Pixel Studio', slug: 'pixel-studio', created_at: '2024-01-12T00:00:00Z' },
      { id: 'org-005', name: 'Cloud Nine Solutions', slug: 'cloud-nine', created_at: '2024-01-15T00:00:00Z' },
    ],
    rowCount: 5,
    executionMs: 9,
  },
}

export const getDefaultQueryResult = (tableName: string): QueryResult => {
  return mockQueryResults[tableName] ?? {
    columns: ['id', 'name', 'created_at'],
    rows: [
      { id: '1', name: 'Sample Row 1', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Sample Row 2', created_at: '2024-01-02T00:00:00Z' },
      { id: '3', name: 'Sample Row 3', created_at: '2024-01-03T00:00:00Z' },
    ],
    rowCount: 3,
    executionMs: Math.floor(Math.random() * 50) + 5,
  }
}
