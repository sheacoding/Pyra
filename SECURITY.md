# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Pyra seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to **ericoding** (contact information available in the GitHub profile)
2. **GitHub Security Advisory**: Use GitHub's [Security Advisory](https://github.com/sheacoding/Pyra/security/advisories/new) feature

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability
- Full paths of source file(s) related to the manifestation of the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: We will acknowledge your report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact within 5 business days
- **Fix Development**: We will work on a fix and keep you updated on progress
- **Disclosure**: We will coordinate with you on disclosure timing

## Security Update Process

1. The security team will confirm the problem and determine affected versions
2. A fix will be developed and tested
3. New versions will be released with security patches
4. A security advisory will be published

## Security Best Practices

When using Pyra:

1. **Keep Updated**: Always use the latest version to get security patches
2. **Validate Input**: Be cautious when opening projects from untrusted sources
3. **File Permissions**: Ensure proper file system permissions for Pyra's data directory
4. **Network Security**: Be aware that Pyra may download packages from PyPI and other sources

## Scope

This security policy applies to:

- The Pyra application (frontend and backend)
- Official build artifacts and installers
- Dependencies managed by the project

It does NOT cover:

- Third-party packages installed through Pyra
- User-created Python scripts executed within Pyra
- Custom forks or modifications of Pyra

## Commercial Security Support

For organizations requiring:

- Private security assessments
- Custom security features
- Priority security patches
- Security compliance documentation

Please contact **ericoding** for commercial support options.

## Attribution

We appreciate responsible disclosure and will acknowledge security researchers who report vulnerabilities:

- Security researchers will be credited in release notes (with permission)
- Hall of fame for significant vulnerability reports
- Coordination on public disclosure timing

## Legal

- We will not pursue legal action against researchers who follow responsible disclosure
- We request that you do not exploit vulnerabilities beyond what is necessary for demonstration
- Please respect user privacy and data during security research

## Questions?

If you have questions about this security policy, please contact **ericoding**.

Thank you for helping keep Pyra and its users safe! 🔒
