// src/lib/reviews/constants.ts
// Client-safe constants and message formatting for Google Business Reviews

export const DEFAULT_REVIEW_TEMPLATE = `Hi {patient_name}! 🌟 Thank you for visiting {clinic_name} today. We hope you had a pleasant experience with our team!

Could you please take 30 seconds to share your review on Google? Your feedback means a lot to our clinic and helps other patients find trusted care:

👉 {review_link}

Thank you for choosing {clinic_name}!`;

/**
 * Renders the personalized review request message.
 */
export function formatReviewMessage(
  template: string | null | undefined,
  data: {
    patientName: string;
    clinicName: string;
    reviewLink: string;
    serviceName?: string;
  }
): string {
  const baseTemplate = template && template.trim() ? template : DEFAULT_REVIEW_TEMPLATE;
  const firstName = data.patientName?.split(' ')[0] || data.patientName || 'there';

  return baseTemplate
    .replace(/{patient_name}/g, firstName)
    .replace(/{clinic_name}/g, data.clinicName || 'our clinic')
    .replace(/{review_link}/g, data.reviewLink)
    .replace(/{service_name}/g, data.serviceName || 'consultation');
}
