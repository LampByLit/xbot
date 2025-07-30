import { z } from 'zod'
import { HTTP_STATUS } from './constants'

// Type for API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}

// Generic API response helper
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  statusCode: number = HTTP_STATUS.OK
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    statusCode,
  }
}

// Success response helper
export function createSuccessResponse<T>(data: T, statusCode: number = HTTP_STATUS.OK): ApiResponse<T> {
  return createApiResponse(true, data, undefined, statusCode)
}

// Error response helper
export function createErrorResponse(error: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): ApiResponse {
  return createApiResponse(false, undefined, error, statusCode)
}

// Validation helper using Zod
export function validateWithZod<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Environment variable validation
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Optional environment variable with default
export function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

// Safe JSON parsing
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return defaultValue
  }
}

// Safe JSON stringifying
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return '{}'
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Generate random string
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Format date for logging
export function formatDate(date: Date = new Date()): string {
  return date.toISOString()
}

// Sanitize text for API calls
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 280) // Twitter character limit
}

// Check if text contains hashtag
export function containsHashtag(text: string, hashtag: string): boolean {
  const hashtagRegex = new RegExp(`#${hashtag}\\b`, 'i')
  return hashtagRegex.test(text)
}

// Check if text mentions username
export function containsMention(text: string, username: string): boolean {
  const mentionRegex = new RegExp(`@${username}\\b`, 'i')
  return mentionRegex.test(text)
} 