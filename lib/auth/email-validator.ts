/**
 * Email validation and Disposable/Temporary Domain Guard.
 * Blocks bot registrations, disposable email inboxes (10minutemail, temp-mail, etc.),
 * and keyboard-smashing gibberish (e.g., hsjdjf.com, jshshd).
 */

// 1. Known Disposable / Temporary Mail Services (Burner Emails)
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'tempmail.net',
  'tempail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'grr.la',
  'sharklasers.com',
  'pokemail.net',
  'spam4.me',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.org',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'mytrashmail.com',
  'dispostable.com',
  'getnada.com',
  'nada.ltd',
  'inboxkitten.com',
  'burnermail.io',
  'mohmal.com',
  'mohmal.im',
  'mohmal.in',
  'crazymailing.com',
  'maildrop.cc',
  'getairmail.com',
  'disposablemail.com',
  'mytemp.email',
  'generator.email',
  'emailondeck.com',
  'dropmail.me',
  'minuteinbox.com',
  'fakemailgenerator.com',
  'fakemail.net',
  'mailcatch.com',
  'tempinbox.com',
  'tmail.ws',
  'zillamail.com',
  'binkmail.com',
  'safetymail.info',
  'spambog.com',
  'inboxbear.com',
  'throwaway.email',
  'yapped.net',
  'mailnesia.com',
  'meltmail.com',
  'emailfake.com',
  'test.com',
  'example.com',
]);

// 2. Recognized Trusted Global & Regional Mail Providers (including Azerbaijani providers)
const TRUSTED_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'outlook.az',
  'hotmail.co.uk',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'ymail.com',
  'mail.ru',
  'inbox.ru',
  'bk.ru',
  'list.ru',
  'yandex.com',
  'yandex.ru',
  'ya.ru',
  'yandex.az',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'web.de',
  't-online.de',
  'aol.com',
  'amail.az',
  'mail.az',
  'box.az',
  'azercell.com',
  'bakcell.com',
]);

// 3. Typo domains targeting major providers
const TYPO_DOMAINS = new Set<string>([
  'gmai.com',
  'gamil.com',
  'gmial.com',
  'gmaill.com',
  'hotmial.com',
  'outlok.com',
  'outlock.com',
  'yaho.com',
  'yhaoo.com',
  'icoud.com',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Checks if a string looks like pure keyboard smashing (e.g. hsjdjf, jshshd, asdfgh)
 */
function isGibberish(text: string): boolean {
  if (!text || text.length < 4) return false;

  // 1. 5 or more consecutive consonants (no vowels) e.g., "hsjdjf", "jshshd", "zxcvbn"
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(text)) {
    return true;
  }

  // 2. No vowels at all in a string >= 4 chars (e.g., "hsjd", "qwrty")
  if (!/[aeiouyəıöü]/i.test(text) && !/\d/.test(text)) {
    return true;
  }

  // 3. 3 or more identical characters in a row (e.g. "aaaa", "zzzz")
  if (/(.)\1{3,}/i.test(text)) {
    return true;
  }

  return false;
}

export function validateRegistrationEmail(rawEmail: string): EmailValidationResult {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return {
      isValid: false,
      error: 'E-poçt ünvanını daxil edin.',
    };
  }

  // Standard RFC-compliant email structure check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Düzgün e-poçt formatı daxil edin (məs: ad@example.com).',
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Düzgün e-poçt formatı daxil edin.',
    };
  }

  const [username, domain] = parts;
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');

  // 1. Block known disposable temporary services
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Müvəqqəti (birdəfəlik) e-poçt ünvanlarına icazə verilmir. Zəhmət olmasa daimi e-poçt ünvanınızı daxil edin (məs: amail.az, Gmail, Outlook).',
    };
  }

  // 2. Block typo domains
  if (TYPO_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'E-poçt domenində səhv aşkar edildi. Zəhmət olmasa düzgün ünvan daxil edin.',
    };
  }

  // 3. Fast path: If it's a known trusted domain (amail.az, gmail.com, etc.), allow immediately
  if (TRUSTED_DOMAINS.has(domain)) {
    // Only check if username is blatant gibberish like jshshd
    if (isGibberish(username)) {
      return {
        isValid: false,
        error: 'Etibarsız e-poçt adı daxil edilib. Zəhmət olmasa real e-poçt ünvanınızı daxil edin.',
      };
    }
    return { isValid: true };
  }

  // 4. For other domains: Check for keyboard smashing in domain (e.g., hsjdjf.com)
  if (isGibberish(domainName)) {
    return {
      isValid: false,
      error: 'Etibarsız və ya uydurma e-poçt domeni aşkar edildi. Zəhmət olmasa real e-poçt daxil edin.',
    };
  }

  // 5. Check for keyboard smashing in username (e.g., jshshd@...)
  if (isGibberish(username)) {
    return {
      isValid: false,
      error: 'Etibarsız e-poçt adı daxil edilib. Zəhmət olmasa real e-poçt ünvanınızı daxil edin.',
    };
  }

  // 6. TLD validation (must be at least 2 chars, valid letters)
  if (!tld || tld.length < 2 || !/^[a-z.]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Düzgün e-poçt uzantısı daxil edin (məs: .com, .az).',
    };
  }

  return { isValid: true };
}
