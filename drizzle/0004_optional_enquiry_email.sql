-- Preserve email uniqueness when supplied; allow enquiries with mobile contact only.
DROP INDEX IF EXISTS leads_email_unique;
CREATE UNIQUE INDEX leads_email_unique ON leads(customer_email) WHERE customer_email <> '';
