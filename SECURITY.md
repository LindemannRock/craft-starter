# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the Craft Starter, please report it privately. **Do not open a public GitHub issue** — public disclosure before a fix is available puts other users at risk.

### Preferred: GitHub private advisory

[Open a private security advisory](https://github.com/LindemannRock/craft-starter/security/advisories/new). This routes the report directly to maintainers with no public visibility.

### Email fallback

If you can't use GitHub's private reporting, email **<security@lindemannrock.com>** with:

- A description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Potential impact

We aim to acknowledge reports within **48 hours** and provide a status update within **5 business days**.

## Supported Versions

Security fixes are issued for the current major release. Please keep the starter up to date.

| Version | Supported |
| ------- | --------- |
| 5.x     | ✅        |
| < 5.0   | ❌        |

## Scope

**In scope:**

- Vulnerabilities in the interactive CLI installer (`cli/`) — command injection, path traversal, unsafe handling of user input
- Insecure defaults in shipped config files (`config/`, `.env.example`, project config templates)
- Weaknesses in generated secrets, security keys, or environment values
- Insecure defaults in the security headers module or other shipped modules
- Insecure defaults in shipped Twig templates (XSS, SSTI, unsafe `|raw` usage)
- Supply-chain risks introduced by the starter itself (e.g. a pinned dependency with a known critical CVE that we ship by default)

**Out of scope:**

- Vulnerabilities in Craft CMS core — report to [Craft CMS](https://craftcms.com/security)
- Vulnerabilities in third-party plugins offered as install options — report to the plugin maintainer
- Vulnerabilities in third-party dependencies — report upstream
- Vulnerabilities in code added by users after installation
- Misconfiguration by the end user (e.g. committing `.env`, weak DB credentials, exposing the CP publicly)
- Issues requiring physical access, stolen credentials, or social engineering
- Theoretical vulnerabilities without a demonstrable impact
- Findings from automated scanners without manual verification

## Disclosure

After a fix is released, we publish a security advisory crediting the reporter (unless they prefer to remain anonymous). We follow a coordinated disclosure model — please give us reasonable time to patch before publishing details publicly.
