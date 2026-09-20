# Global Design: one product for every country

The platform core contains no country-specific business rules. Regional behaviour is data and pluggable modules.

## 1. Organization settings (database + API)
Each tenant stores: `countryCode` (ISO 3166-1), `defaultLocale` (BCP 47), `defaultTimezone` (IANA), `baseCurrency` (ISO 4217), `weekStartsOn`, `fiscalYearStartMonth`. Users may override locale and timezone. Set at sign-up, changed with `PATCH /api/tenant` (admin, audited).

Validation uses the runtime's ICU data, not a hardcoded list (`backend/src/common/validators/locale.validators.ts`), so any recognized country, currency, language or timezone is accepted. Timezone validation accepts IANA aliases (e.g. `Asia/Kolkata`, which ICU lists canonically as `Asia/Calcutta`); this was a real defect found by test and is covered by `global-and-sessions.e2e-spec.ts`.

## 2. Money
- Stored as `Decimal(19,4)` with an explicit ISO 4217 currency on the record (`employees.currency`, `payslips.currency`), falling back to the tenant's base currency.
- The API exchanges amounts as **decimal strings**, never floats. Tests verify no floating-point drift (`0.1 + 0.3 = 0.4`).
- Minor units differ by currency (JPY 0, USD 2, KWD 3); the frontend derives digits from ICU (`Formatters.currencyDigits`).
- Multi-currency conversion and exchange rates are **not** implemented.

## 3. Formatting (frontend)
`src/i18n/format.ts` (`useFormat`) formats money, numbers, dates and timestamps from the organization's settings. Date-only values (join date) are calendar days and are formatted in UTC so they never shift across timezones (tested for UTC+14 and UTC−11). Country, currency, timezone and language pickers are generated from ICU (`src/i18n/regions.ts`); the sign-up page pre-fills from the browser and lets the user override everything.

## 4. Jurisdiction packs (`src/compliance/packs.ts`)
A pack, selected by `tenant.countryCode`, supplies:
- **Identifier fields** (which personal/tax IDs HR records, with format hints)
- **Common pay components**
- **Optional** statutory calculators (`endOfService`) and payroll exports (`payrollExport`)

Organizations in countries without a pack use the neutral `GENERIC` pack, so they are never blocked or shown another country's rules. The server stores identifiers as an opaque `{ type: value }` map (`employees.identifiers`) and pay components as a list (`employees.allowances`), so adding a country needs no schema change.

Current packs: AE (identifiers, gratuity, WPS export), IN, GB, US, DE, SA (identifiers/allowances only). Formats are UX hints, not validation.

### Rules for adding or changing a statutory rule
1. Record jurisdiction, effective date, source, assumptions and versioning next to the code.
2. Provide test vectors; a rule without them is not merged.
3. A rule is offered to users only after legal/payroll validation in that jurisdiction. Until then it must be labelled as an estimate or not offered.
4. Never hardcode a rule as universal.

## 5. What "global" does not yet cover
- Translations of the UI text (formats are localized; labels are English).
- Right-to-left layout review for Arabic/Hebrew locales.
- Country-specific leave, holiday and working-time rules (Stage: Leave/Attendance).
- Statutory payroll for any country (Stage: Payroll).
- Data residency, per-region retention and privacy regimes (GDPR, etc.) need jurisdiction-specific validation.
