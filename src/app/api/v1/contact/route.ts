import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, Errors } from '@/lib/api/response';
import { nanoid } from 'nanoid';
import { rateLimitRequest } from '@/lib/security/rate-limit';

const ContactSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  clinicName: z.string().trim().min(2, 'Clinic or practice name must be at least 2 characters'),
  phone: z.string().trim().optional(),
  enquiryType: z.enum(['demo', 'sales', 'support', 'billing', 'general']).default('general'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute per IP
  const rateLimit = rateLimitRequest(request, { limit: 5, windowMs: 60 * 1000, prefix: 'contact' });
  if (!rateLimit.success) {
    return Errors.rateLimited('Too many contact enquiries submitted. Please wait a minute before trying again.');
  }

  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { fullName, email, clinicName, phone, enquiryType, message } = parsed.data;
    const ticketId = `ARE-${nanoid(8).toUpperCase()}`;

    // Log the contact enquiry securely on the server
    console.log(`[CONTACT_ENQUIRY] Ticket: ${ticketId} | Name: ${fullName} | Clinic: ${clinicName} | Email: ${email} | Phone: ${phone || 'N/A'} | Type: ${enquiryType} | MsgLen: ${message.length}`);

    // Return structured receipt to user
    return successResponse({
      ticketId,
      message: 'Thank you for reaching out to Arenova. Our clinic support team has received your enquiry and will respond within 24 business hours.',
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return Errors.internalError('Unable to process your enquiry at this moment. Please email support@arenova.in directly.');
  }
}
