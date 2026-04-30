<?php

/**
 * Web-only application config — applies to public-facing site requests
 * (not the CP, not console commands).
 *
 * Security headers are set here (in source control) rather than in the hosting
 * dashboard so they version with the app, deploy together, and survive a
 * hosting migration. Edge-level overrides (CDN cache directives, etc.) still
 * belong with the host (Servd / Cloud).
 *
 * @see https://craftcms.com/docs/5.x/extend/services/requests-responses.html
 */

return [
    // Default security headers applied to all public site responses.
    // Add a `'site' => ['handle']` key to restrict to specific sites
    // (e.g. different headers for an API subdomain).
    'as headersFilter' => [
        'class' => \craft\filters\Headers::class,
        // 'site' => ['siteA', 'siteB'],   // optional — omit to apply to all sites
        'headers' => [
            // Prevent MIME sniffing — browsers must respect declared Content-Type
            'X-Content-Type-Options' => 'nosniff',

            // Allow iframes only from same origin (clickjacking protection).
            // Use 'DENY' if you never want anyone to embed your site.
            'X-Frame-Options' => 'SAMEORIGIN',

            // Send origin (no path/query) for cross-site navigation; full URL same-origin.
            'Referrer-Policy' => 'strict-origin-when-cross-origin',

            // Isolate browsing context — mitigates Spectre-class side-channel attacks.
            // 'same-origin' is stricter but breaks OAuth popups (Google Sign-In, etc.)
            // and older Stripe/PayPal popup flows. 'same-origin-allow-popups' keeps
            // the security baseline while letting popup-based auth/payment work.
            'Cross-Origin-Opener-Policy' => 'same-origin-allow-popups',

            // Lock down browser features by default. Each entry is `feature=(allowlist)`:
            //   ()                        → denied for everyone
            //   (self)                    → allow same origin
            //   (self "https://x.com")    → allow self + specific origin
            //   *                         → allow all (avoid)
            //
            // Common overrides per project type:
            //   E-commerce        → payment=(self) for Apple Pay / Payment Request
            //   Store locator     → geolocation=(self)
            //   Upload widgets    → camera=(self), microphone=(self)
            //   Video embeds      → fullscreen=(self "https://www.youtube.com" "https://player.vimeo.com")
            //   Passkeys / WebAuthn → publickey-credentials-get=(self)
            //
            // Sensor entries (xr-spatial-tracking, accelerometer, etc.) also silence
            // Cloudflare Turnstile iframe console warnings.
            'Permissions-Policy' => implode(', ', [
                'accelerometer=()',
                'camera=()',
                'geolocation=()',
                'gyroscope=()',
                'interest-cohort=()',
                'magnetometer=()',
                'microphone=()',
                'payment=()',
                'usb=()',
                'xr-spatial-tracking=()',
            ]),
        ],
    ],

    // CORS — not enabled by default. Projects with GraphQL or custom API
    // endpoints can opt in by adding this block:
    //
    // 'as corsFilter' => [
    //     'class' => \craft\filters\Cors::class,
    //     'cors' => [
    //         'Origin' => ['https://your-frontend.example.com'],
    //         'Access-Control-Request-Method' => ['GET', 'POST', 'OPTIONS'],
    //         'Access-Control-Request-Headers' => ['*'],
    //         'Access-Control-Allow-Credentials' => true,
    //         'Access-Control-Max-Age' => 86400,
    //     ],
    // ],

    // Content-Security-Policy — not enabled by default. CSP requires careful
    // per-project tuning (allow-list every external script, style, font, image
    // source) and breaks sites if mis-configured. SEOmatic's `cspNonce` +
    // `cspScriptSrcPolicies` settings handle this if you want to opt in;
    // alternatively, set headers here and use SEOmatic's nonce helper.
];
