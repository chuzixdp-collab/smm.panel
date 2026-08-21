import { z } from 'zod';

// ============================================================
// AUTH
// ============================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ============================================================
// ORDERS
// ============================================================

export const createOrderSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  targetUrl: z.string().min(1, 'Target URL is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

const singleMassOrderItem = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  link: z.string().min(1, 'Link is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const massOrderSchema = z.object({
  orders: z.array(singleMassOrderItem).min(1, 'At least one order is required'),
});

// ============================================================
// DEPOSITS
// ============================================================

export const createDepositSchema = z.object({
  amount: z.number().positive('Amount must be positive').min(1, 'Minimum deposit is $1'),
  paymentMethod: z.enum(['JAZZCASH', 'EASYPAISA']),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  screenshot: z.string().optional(),
});

// ============================================================
// SUPPORT TICKETS
// ============================================================

export const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// ============================================================
// PROFILE
// ============================================================

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ============================================================
// CHILD PANEL
// ============================================================

export const createChildPanelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  primaryColor: z.string()
    .min(1, 'Primary color is required')
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #6366f1'),
  markup: z.number().min(0, 'Markup must be >= 0'),
  domain: z.string().optional(),
  supportInfo: z.string().optional(),
});

export const childPanelUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  balance: z.number().min(0).optional(),
});

// ============================================================
// PROVIDERS (Admin)
// ============================================================

export const createProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  apiUrl: z.string().url('Invalid API URL'),
  apiKey: z.string().min(1, 'API key is required'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  priority: z.number().int().default(0),
});

// ============================================================
// SERVICES (Admin)
// ============================================================

export const createServiceSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  providerId: z.string().optional(),
  providerServiceId: z.string().optional(),
  providerCost: z.number().min(0).optional(),
  price: z.number().positive('Price must be positive'),
  resellerPrice: z.number().min(0).optional(),
  minQuantity: z.number().int().min(1, 'Min quantity must be at least 1'),
  maxQuantity: z.number().int().min(1, 'Max quantity must be at least 1'),
  refillAvailable: z.boolean().optional(),
  cancelAvailable: z.boolean().optional(),
});

// ============================================================
// ADMIN — DEPOSIT APPROVAL
// ============================================================

export const approveRejectDepositSchema = z.object({
  adminNote: z.string().optional(),
});

// ============================================================
// ADMIN — BALANCE ADJUSTMENT
// ============================================================

export const adjustBalanceSchema = z.object({
  amount: z.number({ message: 'Amount is required' }),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

// ============================================================
// ADMIN — PAYMENT SETTINGS
// ============================================================

export const updatePaymentSettingsSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  merchantNumber: z.string().optional(),
  minDeposit: z.number().min(0, 'Min deposit must be >= 0'),
  maxDeposit: z.number().min(0, 'Max deposit must be >= 0'),
  instructions: z.string().min(1, 'Instructions are required'),
  enabled: z.boolean(),
});

// ============================================================
// ADMIN — SITE SETTINGS
// ============================================================

export const updateSiteSettingsSchema = z.object({
 site_name: z.string().optional(),
  currency: z.string().optional(),
  affiliate_enabled: z.boolean().optional(),
  affiliate_percentage: z.number().min(0).max(100).optional(),
  min_deposit: z.number().min(0).optional(),
  maintenance_mode: z.boolean().optional(),
  announcement: z.string().optional(),
  whatsapp_number: z.string().optional(),
  whatsapp_message: z.string().optional(),
});

// ============================================================
// ADMIN — NOTIFICATIONS
// ============================================================

export const sendNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.string().optional(),
});

export const sendBulkNotificationSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'Select at least one user'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.string().optional(),
});

// ============================================================
// ADMIN — AFFILIATE SETTINGS
// ============================================================

export const affiliateSettingsSchema = z.object({
  commissionPercentage: z.number().min(0).max(100, 'Commission must be 0-100%'),
  minPayout: z.number().min(0, 'Min payout must be >= 0'),
  enabled: z.boolean(),
});

// ============================================================
// EXPORTED TYPES
// ============================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MassOrderInput = z.infer<typeof massOrderSchema>;
export type CreateDepositInput = z.infer<typeof createDepositSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateChildPanelInput = z.infer<typeof createChildPanelSchema>;
export type ChildPanelUserInput = z.infer<typeof childPanelUserSchema>;
export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type ApproveRejectDepositInput = z.infer<typeof approveRejectDepositSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type SendBulkNotificationInput = z.infer<typeof sendBulkNotificationSchema>;
export type AffiliateSettingsInput = z.infer<typeof affiliateSettingsSchema>;
