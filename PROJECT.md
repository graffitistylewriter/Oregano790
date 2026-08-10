# OREGANO 790

## Project Overview

OREGANO 790 is a premium luxury cannabis dispensary presentation website that will ultimately become a custom Shopify theme.

The project is being developed using a single canonical HTML prototype until Version 1.0.

After Version 1.0 the project will be engineered into a modular Shopify architecture.

---

## Roles

### Creative Director

Kevin

Responsible for:

- Vision
- Design Direction
- UX Decisions
- Feature Approval

---

### Lead Front-End Engineer

ChatGPT

Responsible for:

- Front-end implementation
- Engineering quality
- Documentation
- Code review
- QA support
- Build integrity

---

## Development Rules

- Maintain one canonical HTML file until Version 1.0.
- Never refactor before Version 1.0.
- Complete one checkpoint at a time.
- Every checkpoint must produce a working asset.
- GitHub is the project source of truth.
- Feature development occurs on dedicated Git branches.

---

## Current Stage

Stage 6G – Cart Persistence Boundary

### Completed engineering checkpoints

- DEV-001 — frontend service boundary foundation
- DEV-002 — dynamic catalogue service boundary
- DEV-003 — API-backed product integration
- DEV-004 — frontend catalogue boundary cleanup
- DEV-005 — service-backed catalogue filters
- DEV-006 — service-backed catalogue search
- DEV-007 — service-backed product detail modal
- DEV-008 — cart interaction foundation
- DEV-009 — cart persistence boundary

### Current architecture

```text
Canonical index.html
        ↓
Frontend bootstrap / catalogue UI
        ↓
OreganoCatalogueService
        ↓
OreganoProductService
        ↓
HTTP API / development fallback
        ↓
Backend catalogue service
        ↓
Development product collection

Catalogue selection
        ↓
OreganoCartService
        ↓
OreganoStorageService
        ↓
Browser-local cart snapshot
        ↓
OreganoCartUI
```

The frontend catalogue no longer owns an inline product database. Filter and search requests are routed through the catalogue service and ultimately reach the backend catalogue API when API-backed mode is enabled. Search is debounced in the UI and preserves the currently selected category/type filter.

Product detail requests use the same catalogue service boundary. The DEV-007 modal is a dedicated UI module with keyboard/backdrop closing, focus restoration, responsive layout, and safe rendering of the current product contract.

DEV-008 adds an in-memory cart boundary. Add-to-cart interactions resolve the selected product through the existing catalogue service, quantities are constrained by the current product stock contract, the header cart count reflects the current selection, and a responsive cart drawer provides quantity changes, removal, clearing, and subtotal display.

DEV-009 adds controlled browser persistence through OreganoStorageService. Only product IDs and quantities are persisted; product details are re-resolved through OreganoProductService on restore. Restored quantities are capped against current stock and missing or unavailable products are discarded. Checkout, payment, authentication, and authoritative inventory mutation remain deliberately outside this prototype milestone.

### Next checkpoint

DEV-010 — Cart/UI hardening and lightweight runtime QA

After that, the roadmap should continue through low-risk interaction/UX hardening before the larger checkout, authentication, order, and production-backend work.
