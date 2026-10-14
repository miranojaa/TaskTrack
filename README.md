# TaskTrack

TaskTrack is a Laravel 13, React, and Inertia task manager with priority-based
deadline alerts, a calendar, activity history, and configurable alarm settings.

## Setup

Requirements: PHP 8.3+, Composer, Node.js, and npm. Configure the database in
`.env` before migrating. SQLite is the default; for another database, set the
usual `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and
`DB_PASSWORD` values.

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
php artisan storage:link
```

For local development, run the Laravel server and Vite dev server in separate
terminals with `php artisan serve` and `npm run dev`.

## Reminder Operations

The `tasks:check-deadlines` command runs every minute through Laravel's
scheduler. Production must run `php artisan schedule:run` every minute (or keep
`php artisan schedule:work` running). For each non-completed task, the warning
time is its deadline minus the user's saved `alert_threshold_minutes`, provided
`notify_approaching` is enabled. Task priority remains part of the reminder
message but does not override the configured warning duration. The app uses
Laravel's configured timezone (`APP_TIMEZONE`, default `Asia/Manila`) for task
deadlines and reminder calculations. Unique task, threshold, and deadline keys
prevent duplicate reminders while allowing a changed setting or deadline to
recalculate the warning.

Email reminders are opt-in and queued. Configure a production queue connection
and keep a worker running with `php artisan queue:work`; failed messages can be
inspected with Laravel's failed-job commands.

For Gmail SMTP, use a dedicated sender account with 2-Step Verification and a
Google App Password. Set these values in the server-side `.env` only:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=tasktrack.sender@gmail.com
MAIL_PASSWORD=your-google-app-password
MAIL_FROM_ADDRESS=tasktrack.sender@gmail.com
MAIL_FROM_NAME="TaskTrack"
QUEUE_CONNECTION=database
```

Never commit real credentials or expose them in frontend variables. Gmail SMTP
uses an App Password here; Gmail API OAuth consent and token management are not
implemented. Email requires an internet connection, valid server mail settings,
and a running queue worker. The default `MAIL_MAILER=log` writes messages to the
application log instead of delivering them.

## PWA And Connectivity

The production build registers a service worker and exposes an installable PWA
manifest. HTTPS is required outside localhost. It caches the static app shell,
logo, and built assets, and displays an offline fallback. User-specific HTML,
task data, and mutations are deliberately not cached: task creation, edits,
completion, deletion, synchronization, email, and server-side reminders still
require a connection. Offline IndexedDB storage and conflict-safe task sync are
not implemented yet.

Browser alarms also depend on the app being open and the browser/device allowing
background activity. The server scheduler remains the reliable source for
deadline state and queued email; web push notifications are not configured.

## Verification

```powershell
php artisan test
npm run check
npm run types:check
```