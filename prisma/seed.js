// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize PrismaClient with the adapter
const prisma = new PrismaClient({
  adapter: adapter,
});

// ===========================================
// ROLES SEED DATA
// ===========================================

const roles = [
  { name: 'super_admin', description: 'Super Administrator with full system access', isSystem: true },
  { name: 'admin', description: 'System Administrator with user and role management', isSystem: true },
  { name: 'manager', description: 'Department Manager with oversight capabilities', isSystem: true },
  { name: 'staff', description: 'Staff member who handles quotes and products', isSystem: true },
  { name: 'customer', description: 'Registered customer who can view products and request quotes', isSystem: true },
];

// ===========================================
// PERMISSIONS SEED DATA WITH CATEGORY
// ===========================================

const permissions = [
  // Product Management
  { name: 'product:create', description: 'Can create new products', resource: 'product', action: 'create', category: 'product' },
  { name: 'product:read', description: 'Can view products', resource: 'product', action: 'read', category: 'product' },
  { name: 'product:update', description: 'Can edit products', resource: 'product', action: 'update', category: 'product' },
  { name: 'product:delete', description: 'Can delete products', resource: 'product', action: 'delete', category: 'product' },
  { name: 'product:manage', description: 'Full product management', resource: 'product', action: 'manage', category: 'product' },
  
  // Quote Management
  { name: 'quote:create', description: 'Can create quotes', resource: 'quote', action: 'create', category: 'quote' },
  { name: 'quote:read', description: 'Can view quotes', resource: 'quote', action: 'read', category: 'quote' },
  { name: 'quote:update', description: 'Can process quotes', resource: 'quote', action: 'update', category: 'quote' },
  { name: 'quote:delete', description: 'Can delete quotes', resource: 'quote', action: 'delete', category: 'quote' },
  { name: 'quote:manage', description: 'Full quote management', resource: 'quote', action: 'manage', category: 'quote' },
  
  // User Management
  { name: 'user:read', description: 'Can view users', resource: 'user', action: 'read', category: 'user' },
  { name: 'user:create', description: 'Can create users', resource: 'user', action: 'create', category: 'user' },
  { name: 'user:update', description: 'Can edit users', resource: 'user', action: 'update', category: 'user' },
  { name: 'user:delete', description: 'Can delete users', resource: 'user', action: 'delete', category: 'user' },
  { name: 'user:manage', description: 'Full user management', resource: 'user', action: 'manage', category: 'user' },
  
  // Role Management
  { name: 'role:read', description: 'Can view roles', resource: 'role', action: 'read', category: 'role' },
  { name: 'role:create', description: 'Can create roles', resource: 'role', action: 'create', category: 'role' },
  { name: 'role:update', description: 'Can edit roles', resource: 'role', action: 'update', category: 'role' },
  { name: 'role:delete', description: 'Can delete roles', resource: 'role', action: 'delete', category: 'role' },
  { name: 'role:manage', description: 'Full role management', resource: 'role', action: 'manage', category: 'role' },
  
  // Dashboard
  { name: 'dashboard:view', description: 'Can view dashboard', resource: 'dashboard', action: 'view', category: 'dashboard' },
  { name: 'dashboard:manage', description: 'Full dashboard management', resource: 'dashboard', action: 'manage', category: 'dashboard' },
  
  // Reports
  { name: 'report:view', description: 'Can view reports', resource: 'report', action: 'view', category: 'report' },
  { name: 'report:export', description: 'Can export reports', resource: 'report', action: 'export', category: 'report' },
  
  // Settings
  { name: 'settings:read', description: 'Can view system settings', resource: 'settings', action: 'read', category: 'system' },
  { name: 'settings:update', description: 'Can edit system settings', resource: 'settings', action: 'update', category: 'system' },
  { name: 'settings:manage', description: 'Full settings management', resource: 'settings', action: 'manage', category: 'system' },
  
  // Security & Audit
  { name: 'audit:read', description: 'Can view audit logs', resource: 'audit', action: 'read', category: 'audit' },
  { name: 'audit:export', description: 'Can export audit logs', resource: 'audit', action: 'export', category: 'audit' },
];

// ===========================================
// ROLE-PERMISSION ASSIGNMENTS
// ===========================================

const rolePermissions = {
  super_admin: permissions.map(p => p.name),
  admin: [
    'product:read', 'product:create', 'product:update', 'product:delete',
    'quote:read', 'quote:update', 'quote:manage',
    'user:read', 'user:create', 'user:update', 'user:delete', 'user:manage',
    'role:read', 'role:create', 'role:update', 'role:delete', 'role:manage',
    'dashboard:view', 'dashboard:manage',
    'report:view', 'report:export',
    'settings:read', 'settings:update', 'settings:manage',
    'audit:read', 'audit:export'
  ],
  manager: [
    'product:read', 'product:create', 'product:update',
    'quote:read', 'quote:update',
    'user:read',
    'dashboard:view',
    'report:view'
  ],
  staff: [
    'product:read',
    'quote:read', 'quote:update',
    'dashboard:view'
  ],
  customer: [
    'product:read',
    'quote:create'
  ],
};

// ===========================================
// SYSTEM SETTINGS
// ===========================================

const systemSettings = [
  {
    key: 'siteName',
    value: 'Mikias Building Materials',
    type: 'string',
    category: 'general',
    description: 'Company display name'
  },
  {
    key: 'siteDescription',
    value: 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
    type: 'string',
    category: 'general',
    description: 'Site description for SEO'
  },
  {
    key: 'companyPhone',
    value: '+251948418527',
    type: 'string',
    category: 'general',
    description: 'Company contact phone'
  },
  {
    key: 'companyEmail',
    value: 'info@mikiasbuilding.com',
    type: 'string',
    category: 'general',
    description: 'Company contact email'
  },
  {
    key: 'companyAddress',
    value: 'Addis Ababa, Ethiopia',
    type: 'string',
    category: 'general',
    description: 'Company physical address'
  },
  {
    key: 'businessHours',
    value: '{"monday_friday": "8:00 AM - 6:00 PM", "saturday": "9:00 AM - 2:00 PM", "sunday": "Closed"}',
    type: 'object',
    category: 'general',
    description: 'Business operating hours'
  },
  {
    key: 'maintenanceMode',
    value: 'false',
    type: 'boolean',
    category: 'general',
    description: 'Enable/disable maintenance mode'
  },
  {
    key: 'twoFactorEnabled',
    value: 'false',
    type: 'boolean',
    category: '2fa',
    description: 'Enable/disable 2FA for the entire system'
  },
  {
    key: 'forceAdmin2FA',
    value: 'false',
    type: 'boolean',
    category: '2fa',
    description: 'Force admin users to enable 2FA'
  },
  {
    key: 'sessionTimeout',
    value: '3600',
    type: 'number',
    category: 'session',
    description: 'Session timeout in seconds'
  },
  {
    key: 'maxLoginAttempts',
    value: '5',
    type: 'number',
    category: 'security',
    description: 'Maximum login attempts before lockout'
  },
  {
    key: 'lockoutDuration',
    value: '15',
    type: 'number',
    category: 'security',
    description: 'Lockout duration in minutes'
  },
];

// ===========================================
// USERS SEED DATA
// ===========================================

const users = [
  {
    email: 'superadmin@mikias.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+251911111111',
    roleName: 'super_admin',
    password: 'SuperAdmin@123',
  },
  {
    email: 'admin@mikias.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+251922222222',
    roleName: 'admin',
    password: 'Admin@123',
  },
  {
    email: 'manager@mikias.com',
    firstName: 'Manager',
    lastName: 'User',
    phone: '+251933333333',
    roleName: 'manager',
    password: 'Manager@123',
  },
  {
    email: 'staff@mikias.com',
    firstName: 'Staff',
    lastName: 'User',
    phone: '+251944444444',
    roleName: 'staff',
    password: 'Staff@123',
  },
  {
    email: 'customer@mikias.com',
    firstName: 'Customer',
    lastName: 'User',
    phone: '+251955555555',
    roleName: 'customer',
    password: 'Customer@123',
  },
];

// ===========================================
// SAMPLE PRODUCTS
// ===========================================

const sampleProducts = [
  {
    name: 'Portland Cement 50kg',
    slug: 'portland-cement-50kg',
    description: 'High-quality Portland cement for all construction needs.',
    shortDescription: 'Premium Portland cement for construction',
    category: 'Building',
    subCategory: 'Cement',
    price: '750.00',
    unit: 'bag',
    stockQuantity: 500,
    stockStatus: 'in_stock',
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Steel Reinforcement 12mm',
    slug: 'steel-reinforcement-12mm',
    description: 'High-tensile steel reinforcement bars for concrete structures.',
    shortDescription: 'Quality steel reinforcement for concrete',
    category: 'Building',
    subCategory: 'Steel',
    price: '1200.00',
    unit: 'piece',
    stockQuantity: 300,
    stockStatus: 'in_stock',
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'PVC Pipes 1 inch',
    slug: 'pvc-pipes-1-inch',
    description: 'Durable PVC pipes for plumbing and sanitary applications.',
    shortDescription: 'Durable PVC pipes for plumbing',
    category: 'Sanitary',
    subCategory: 'Pipes',
    price: '350.00',
    unit: 'piece',
    stockQuantity: 1000,
    stockStatus: 'in_stock',
    isFeatured: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Electrical Cables 2.5mm',
    slug: 'electrical-cables-2.5mm',
    description: 'Standard electrical cables for residential and commercial wiring.',
    shortDescription: 'Quality electrical cables for wiring',
    category: 'Electrical',
    subCategory: 'Cables',
    price: '500.00',
    unit: 'meter',
    stockQuantity: 800,
    stockStatus: 'in_stock',
    isFeatured: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Door Handles Set',
    slug: 'door-handles-set',
    description: 'Elegant door handles with matching locks and accessories.',
    shortDescription: 'Quality door handles and locks',
    category: 'Hardware',
    subCategory: 'Door Accessories',
    price: '250.00',
    unit: 'set',
    stockQuantity: 150,
    stockStatus: 'in_stock',
    isFeatured: false,
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Ceramic Tiles 60x60cm',
    slug: 'ceramic-tiles-60x60cm',
    description: 'Premium ceramic tiles for flooring and wall applications.',
    shortDescription: 'Premium ceramic tiles for floors',
    category: 'Sanitary',
    subCategory: 'Tiles',
    price: '1800.00',
    unit: 'box',
    stockQuantity: 200,
    stockStatus: 'in_stock',
    isFeatured: true,
    isActive: true,
    sortOrder: 6,
  },
  {
    name: 'Galvanized Iron Sheets',
    slug: 'galvanized-iron-sheets',
    description: 'High-quality galvanized iron sheets for roofing and construction.',
    shortDescription: 'Quality galvanized iron sheets',
    category: 'Building',
    subCategory: 'Roofing',
    price: '950.00',
    unit: 'sheet',
    stockQuantity: 400,
    stockStatus: 'in_stock',
    isFeatured: false,
    isActive: true,
    sortOrder: 7,
  },
  {
    name: 'Electrical Switches Set',
    slug: 'electrical-switches-set',
    description: 'Complete set of electrical switches, sockets, and accessories.',
    shortDescription: 'Complete electrical switch set',
    category: 'Electrical',
    subCategory: 'Switches',
    price: '150.00',
    unit: 'set',
    stockQuantity: 600,
    stockStatus: 'in_stock',
    isFeatured: false,
    isActive: true,
    sortOrder: 8,
  },
];

// ===========================================
// SAMPLE QUOTES
// ===========================================

const sampleQuotes = [
  {
    trackingId: 'Q-2024-001',
    customerName: 'ABC Construction',
    customerEmail: 'abc@construction.com',
    customerPhone: '+251912345678',
    customerCompany: 'ABC Construction PLC',
    subject: 'Cement & Steel Order',
    message: 'We need 500 bags of cement and 200 pieces of steel reinforcement.',
    status: 'pending',
    priority: 'high',
  },
  {
    trackingId: 'Q-2024-002',
    customerName: 'XYZ Building',
    customerEmail: 'info@xyzbuilding.com',
    customerPhone: '+251923456789',
    customerCompany: 'XYZ Building Materials',
    subject: 'Sanitary Supplies',
    message: 'We require PVC pipes, fittings, and ceramic tiles.',
    status: 'approved',
    priority: 'medium',
  },
  {
    trackingId: 'Q-2024-003',
    customerName: 'DEF Contractors',
    customerEmail: 'contact@defcontractors.com',
    customerPhone: '+251934567890',
    customerCompany: 'DEF Contractors PLC',
    subject: 'Electrical Materials',
    message: 'Need electrical cables, switches, and accessories.',
    status: 'pending',
    priority: 'high',
  },
  {
    trackingId: 'Q-2024-004',
    customerName: 'GHI Developers',
    customerEmail: 'info@ghidevelopers.com',
    customerPhone: '+251945678901',
    customerCompany: 'GHI Developers',
    subject: 'Hardware Accessories',
    message: 'Looking for door handles, hinges, and hardware accessories.',
    status: 'completed',
    priority: 'low',
  },
  {
    trackingId: 'Q-2024-005',
    customerName: 'JKL Construction',
    customerEmail: 'info@jklconstruction.com',
    customerPhone: '+251956789012',
    customerCompany: 'JKL Construction PLC',
    subject: 'Building Materials Bundle',
    message: 'Need a complete set of building materials.',
    status: 'pending',
    priority: 'medium',
  },
];

// ===========================================
// QUOTE ITEMS MAPPING
// ===========================================

function getQuoteItems(quoteId) {
  const itemsMap = {
    'Q-2024-001': [
      { productName: 'Portland Cement 50kg', quantity: 500, unit: 'bag', notes: 'Need delivery by next week' },
      { productName: 'Steel Reinforcement 12mm', quantity: 200, unit: 'piece', notes: 'Provide quality certification' },
    ],
    'Q-2024-002': [
      { productName: 'PVC Pipes 1 inch', quantity: 300, unit: 'piece', notes: 'Need various sizes' },
      { productName: 'Ceramic Tiles 60x60cm', quantity: 100, unit: 'box', notes: 'Prefer light colors' },
    ],
    'Q-2024-003': [
      { productName: 'Electrical Cables 2.5mm', quantity: 500, unit: 'meter', notes: 'Copper core required' },
      { productName: 'Electrical Switches Set', quantity: 200, unit: 'set', notes: 'White color preferred' },
    ],
    'Q-2024-004': [
      { productName: 'Door Handles Set', quantity: 150, unit: 'set', notes: 'Chrome finish' },
    ],
    'Q-2024-005': [
      { productName: 'Portland Cement 50kg', quantity: 300, unit: 'bag', notes: '' },
      { productName: 'Galvanized Iron Sheets', quantity: 200, unit: 'sheet', notes: 'For roofing' },
      { productName: 'Steel Reinforcement 12mm', quantity: 100, unit: 'piece', notes: '' },
    ],
  };
  return itemsMap[quoteId] || [];
}

// ===========================================
// NOTIFICATIONS
// ===========================================

const notifications = [
  {
    title: 'Welcome to Mikias Building Materials!',
    message: 'Thank you for registering. Browse our products and request quotes anytime.',
    type: 'welcome',
  },
  {
    title: 'Your quote is being processed',
    message: 'Your quote #Q-2024-001 is currently being reviewed by our team.',
    type: 'info',
  },
  {
    title: 'New quote request received',
    message: 'A new quote request has been submitted by ABC Construction.',
    type: 'info',
  },
  {
    title: 'Quote approved',
    message: 'Quote #Q-2024-002 has been approved. Please process the order.',
    type: 'success',
  },
];

// ===========================================
// AUDIT LOGS
// ===========================================

const auditLogs = [
  {
    action: 'USER_CREATED',
    resource: 'User',
    details: { createdBy: 'super_admin' },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
  },
  {
    action: 'PRODUCT_CREATED',
    resource: 'Product',
    details: { productName: 'Portland Cement 50kg' },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
  },
  {
    action: 'QUOTE_PROCESSED',
    resource: 'QuoteRequest',
    details: { status: 'pending', priority: 'high' },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
  },
  {
    action: 'QUOTE_CREATED',
    resource: 'QuoteRequest',
    details: { customer: 'JKL Construction' },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
  },
];

// ===========================================
// MAIN SEED FUNCTION
// ===========================================

async function main() {
  console.log('🌱 Starting Mikias Building Materials seeding...');
  console.log('');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();

    // ===========================================
    // CREATE ROLES
    // ===========================================
    console.log('\n📝 Creating roles...');
    const createdRoles = {};
    for (const role of roles) {
      const created = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      createdRoles[role.name] = created;
      console.log(`  ✅ ${role.name}`);
    }

    // ===========================================
    // CREATE PERMISSIONS WITH CATEGORY
    // ===========================================
    console.log('\n📝 Creating permissions with categories...');
    const createdPermissions = {};
    for (const permission of permissions) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      createdPermissions[permission.name] = created;
    }
    console.log(`  ✅ ${Object.keys(createdPermissions).length} permissions created`);

    // ===========================================
    // ASSIGN PERMISSIONS TO ROLES
    // ===========================================
    console.log('\n📝 Assigning permissions to roles...');
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      const role = createdRoles[roleName];
      if (!role) continue;

      let count = 0;
      for (const permissionName of permissionNames) {
        const permission = createdPermissions[permissionName];
        if (!permission) continue;

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        count++;
      }
      console.log(`  ✅ ${roleName}: ${count} permissions`);
    }

    // ===========================================
    // CREATE SYSTEM SETTINGS
    // ===========================================
    console.log('\n📝 Creating system settings...');
    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting,
      });
    }
    console.log(`  ✅ ${systemSettings.length} settings created`);

    // ===========================================
    // CREATE USERS AND USER ROLES
    // ===========================================
    console.log('\n📝 Creating users and user roles...');
    const createdUsers = {};
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          isVerified: true,
        },
        create: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          passwordHash: hashedPassword,
          isVerified: true,
          roleId: createdRoles[userData.roleName].id,
        },
      });
      
      createdUsers[userData.roleName] = user;
      
      // CREATE USER ROLE RECORD
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: createdRoles[userData.roleName].id,
          },
        },
        update: {
          isActive: true,
          assignedAt: new Date(),
        },
        create: {
          userId: user.id,
          roleId: createdRoles[userData.roleName].id,
          assignedBy: user.id,
          assignedAt: new Date(),
          isActive: true,
        },
      });
      
      console.log(`  ✅ ${userData.roleName}: ${userData.email} / ${userData.password}`);
    }

    // ===========================================
    // CREATE PRODUCTS
    // ===========================================
    console.log('\n📝 Creating products...');
    const createdProducts = {};
    for (const productData of sampleProducts) {
      const product = await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {},
        create: {
          ...productData,
          price: parseFloat(productData.price),
          createdBy: createdUsers.super_admin?.id,
        },
      });
      createdProducts[product.slug] = product;
      console.log(`  ✅ ${product.name}`);
    }

    // ===========================================
    // CREATE QUOTES - USING UPSERT TO AVOID DUPLICATES
    // ===========================================
    console.log('\n📝 Creating quotes...');
    const createdQuotes = {};
    for (const quoteData of sampleQuotes) {
      const quote = await prisma.quoteRequest.upsert({
        where: { trackingId: quoteData.trackingId },
        update: {
          customerName: quoteData.customerName,
          customerEmail: quoteData.customerEmail,
          customerPhone: quoteData.customerPhone,
          customerCompany: quoteData.customerCompany,
          subject: quoteData.subject,
          message: quoteData.message,
          status: quoteData.status,
          priority: quoteData.priority,
          assignedTo: createdUsers.manager?.id,
          assignedAt: quoteData.status !== 'pending' ? new Date() : null,
          respondedAt: quoteData.status === 'completed' ? new Date() : null,
        },
        create: {
          trackingId: quoteData.trackingId,
          customerName: quoteData.customerName,
          customerEmail: quoteData.customerEmail,
          customerPhone: quoteData.customerPhone,
          customerCompany: quoteData.customerCompany,
          subject: quoteData.subject,
          message: quoteData.message,
          status: quoteData.status,
          priority: quoteData.priority,
          createdBy: createdUsers.staff?.id,
          assignedTo: createdUsers.manager?.id,
          assignedAt: quoteData.status !== 'pending' ? new Date() : null,
          respondedAt: quoteData.status === 'completed' ? new Date() : null,
        },
      });
      createdQuotes[quote.trackingId] = quote;
      console.log(`  ✅ ${quote.trackingId}: ${quote.subject}`);
    }

    // ===========================================
    // CREATE QUOTE ITEMS
    // ===========================================
    console.log('\n📝 Creating quote items...');
    let quoteItemCount = 0;
    for (const [trackingId, quote] of Object.entries(createdQuotes)) {
      const items = getQuoteItems(trackingId);
      for (const itemData of items) {
        const product = Object.values(createdProducts).find(
          p => p.name === itemData.productName
        );
        
        // Check if quote item already exists
        const existingItem = await prisma.quoteItem.findFirst({
          where: {
            quoteRequestId: quote.id,
            productName: itemData.productName,
          },
        });

        if (!existingItem) {
          await prisma.quoteItem.create({
            data: {
              quoteRequestId: quote.id,
              productId: product?.id || null,
              productName: itemData.productName,
              quantity: itemData.quantity,
              unit: itemData.unit,
              notes: itemData.notes,
            },
          });
          quoteItemCount++;
        }
      }
      console.log(`  ✅ ${trackingId}: ${items.length} items added`);
    }

    // ===========================================
    // CREATE NOTIFICATIONS
    // ===========================================
    console.log('\n📝 Creating notifications...');
    for (const notificationData of notifications) {
      const customerUser = createdUsers.customer;
      if (customerUser) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: customerUser.id,
            title: notificationData.title,
          },
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              ...notificationData,
              userId: customerUser.id,
            },
          });
        }
      }
    }
    console.log(`  ✅ ${notifications.length} notifications created`);

    // ===========================================
    // CREATE AUDIT LOGS
    // ===========================================
    console.log('\n📝 Creating audit logs...');
    for (const logData of auditLogs) {
      const existing = await prisma.auditLog.findFirst({
        where: {
          action: logData.action,
          resource: logData.resource,
        },
      });
      if (!existing) {
        await prisma.auditLog.create({
          data: {
            ...logData,
            userId: createdUsers.super_admin?.id,
            resourceId: 'system',
          },
        });
      }
    }
    console.log(`  ✅ ${auditLogs.length} audit logs created`);

    // ===========================================
    // VERIFY USER ROLES
    // ===========================================
    console.log('\n🔍 Verifying user roles...');
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: { select: { email: true } },
        role: { select: { name: true } },
      },
    });
    console.log(`  ✅ Found ${userRoles.length} user role assignments`);

    // ===========================================
    // SUMMARY
    // ===========================================
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  👤 Roles: ${roles.length}`);
    console.log(`  🔑 Permissions: ${permissions.length}`);
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  📦 Products: ${sampleProducts.length}`);
    console.log(`  📄 Quotes: ${sampleQuotes.length}`);
    console.log(`  📋 Quote Items: ${quoteItemCount}`);
    console.log(`  🔔 Notifications: ${notifications.length}`);
    console.log(`  📊 Audit Logs: ${auditLogs.length}`);
    console.log(`  🔗 User Roles: ${userRoles.length}`);
    
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────┬────────────────────────────┬──────────────────┐');
    console.log('│ Role            │ Email                      │ Password         │');
    console.log('├─────────────────┼────────────────────────────┼──────────────────┤');
    for (const userData of users) {
      const roleDisplay = userData.roleName.padEnd(15);
      const emailDisplay = userData.email.padEnd(26);
      const passDisplay = userData.password.padEnd(16);
      console.log(`│ ${roleDisplay}│ ${emailDisplay}│ ${passDisplay}│`);
    }
    console.log('└─────────────────┴────────────────────────────┴──────────────────┘');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });