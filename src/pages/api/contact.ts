import type { APIContext } from 'astro';
import { Resend } from 'resend';
import {
  extractRemoteIp,
  formatContactEmailText,
  isHoneypotTriggered,
  parseContactSubmission,
  redactEmailForLog,
  type ContactStatus,
  type ContactSubmission,
  validateContactSubmission,
  verifyTurnstileToken,
} from '../../lib/contact';

export const prerender = false;

const CONTACT_ROUTE = '/contact';
const CONTACT_SUCCESS_ROUTE = '/contact/thank-you';
const DEFAULT_SUBJECT_PREFIX = '[chriszombik.com]';

type ContactFailureStatus = Exclude<ContactStatus, 'success'>;

interface ContactRuntimeConfig {
  resendApiKey: string;
  contactToEmail: string;
  contactFromEmail: string;
  contactSubjectPrefix: string;
  turnstileSecretKey: string;
}

interface ContactHandlerDependencies {
  verifyCaptcha: (token: string, remoteIp?: string) => Promise<boolean>;
  sendEmail: (submission: ContactSubmission) => Promise<void>;
  logError: (message: string, details?: Record<string, unknown>) => void;
}

function methodNotAllowedResponse(): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: {
      Allow: 'POST',
    },
  });
}

function redirectToContact(status: ContactFailureStatus): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${CONTACT_ROUTE}?status=${status}`,
    },
  });
}

function redirectToThankYou(): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: CONTACT_SUCCESS_ROUTE,
    },
  });
}

function getEnvValue(key: string): string {
  const env = import.meta.env as Record<string, unknown>;
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function getRuntimeConfig(): ContactRuntimeConfig {
  return {
    resendApiKey: getEnvValue('RESEND_API_KEY'),
    contactToEmail: getEnvValue('CONTACT_TO_EMAIL'),
    contactFromEmail: getEnvValue('CONTACT_FROM_EMAIL'),
    contactSubjectPrefix: getEnvValue('CONTACT_SUBJECT_PREFIX') || DEFAULT_SUBJECT_PREFIX,
    turnstileSecretKey: getEnvValue('TURNSTILE_SECRET_KEY'),
  };
}

function createDefaultDependencies(
  config: ContactRuntimeConfig,
): ContactHandlerDependencies {
  const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  return {
    verifyCaptcha: (token: string, remoteIp?: string) => {
      return verifyTurnstileToken({
        token,
        remoteIp,
        secretKey: config.turnstileSecretKey,
      });
    },
    sendEmail: async (submission: ContactSubmission) => {
      if (!resend) {
        throw new Error('Resend is not configured.');
      }

      await resend.emails.send({
        from: config.contactFromEmail,
        to: config.contactToEmail,
        replyTo: submission.email,
        subject: `${config.contactSubjectPrefix} New contact form message`,
        text: formatContactEmailText(submission),
      });
    },
    logError: (message: string, details?: Record<string, unknown>) => {
      console.error(message, details);
    },
  };
}

export function createContactPostHandler(
  deps: ContactHandlerDependencies,
  config: ContactRuntimeConfig,
) {
  return async function handleContactPost(
    request: Request,
    clientAddress?: string,
  ): Promise<Response> {
    if (
      !config.resendApiKey ||
      !config.contactToEmail ||
      !config.contactFromEmail ||
      !config.turnstileSecretKey
    ) {
      deps.logError('Contact form configuration is incomplete.');
      return redirectToContact('error');
    }

    let submission: ReturnType<typeof parseContactSubmission>;

    try {
      const formData = await request.formData();
      submission = parseContactSubmission(formData);
    } catch (error) {
      deps.logError('Failed to parse contact form payload.', {
        error: error instanceof Error ? error.message : String(error),
      });
      return redirectToContact('invalid');
    }

    if (isHoneypotTriggered(submission.company)) {
      return redirectToThankYou();
    }

    const validation = validateContactSubmission(submission);
    if (!validation.ok || !validation.data) {
      return redirectToContact('invalid');
    }

    const remoteIp = extractRemoteIp(request, clientAddress);
    const captchaValid = await deps.verifyCaptcha(
      validation.data.captchaToken,
      remoteIp,
    );

    if (!captchaValid) {
      deps.logError('CAPTCHA verification failed for contact form submission.', {
        email: redactEmailForLog(validation.data.email),
      });
      return redirectToContact('captcha');
    }

    try {
      await deps.sendEmail(validation.data);
    } catch (error) {
      deps.logError('Failed to send contact form email.', {
        error: error instanceof Error ? error.message : String(error),
        email: redactEmailForLog(validation.data.email),
        nameLength: validation.data.name.length,
      });
      return redirectToContact('error');
    }

    return redirectToThankYou();
  };
}

const runtimeConfig = getRuntimeConfig();
const runtimeDeps = createDefaultDependencies(runtimeConfig);
const handleContactPost = createContactPostHandler(runtimeDeps, runtimeConfig);

export async function POST(context: APIContext): Promise<Response> {
  return handleContactPost(context.request, context.clientAddress);
}

export function GET(): Response {
  return methodNotAllowedResponse();
}

export function ALL(): Response {
  return methodNotAllowedResponse();
}
