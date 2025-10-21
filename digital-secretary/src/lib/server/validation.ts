import { z } from "zod";

export const VisitorCreateSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactName: z.string().min(1).max(200).optional(),
  locationData: z.any().optional(),
});

export const MessageCreateSchema = z.object({
  visitorId: z.string().cuid().optional(),
  message: z.string().min(1).max(10000),
});

export const MessageReadSchema = z.object({
  read: z.boolean().default(true),
});

export const StatusUpdateSchema = z.object({
  isAvailable: z.boolean(),
  manualOverride: z.boolean().optional(),
  overrideUntil: z.string().datetime().optional(),
});

export const StatusManualSchema = z.object({
  manualOverride: z.boolean(),
  isAvailable: z.boolean().optional(),
  overrideUntil: z.string().datetime().nullable().optional(),
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const AdminSettingsSchema = z.object({
  notificationPreferences: z.any().optional(),
  aiConfiguration: z.any().optional(),
});

export const ChatPostSchema = z.object({
  sessionId: z.string().cuid().optional(),
  visitorId: z.string().cuid().optional(),
  message: z.string().min(1).max(5000),
});
