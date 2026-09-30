<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * When no Vite build exists (no Node.js environment), this middleware
 * intercepts Inertia HTML responses and re-renders them using Blade views.
 *
 * It runs AFTER HandleInertiaRequests in the middleware stack. On the first
 * page visit, Inertia renders a full HTML page via app.blade.php. This
 * middleware catches that HTML, extracts the component name and props from
 * the Inertia page JSON, then renders the matching Blade view directly.
 *
 * This avoids the problem of @extends not working inside @include.
 */
class BladeRenderFallback
{
    /**
     * Map Inertia component names to Blade view names.
     */
    protected array $viewMap = [
        'welcome'       => 'welcome',
        'dashboard'     => 'dashboard',
        'auth/login'    => 'auth.login',
        'auth/register' => 'auth.register',
        'profile/edit'  => 'profile.edit',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Only intercept when there's no Vite build
        if ($this->hasViteBuild()) {
            return $next($request);
        }

        // Only intercept non-AJAX GET requests (Inertia XHR requests should pass through)
        if ($request->header('X-Inertia')) {
            return $next($request);
        }

        $response = $next($request);

        // Only intercept successful HTML responses (not redirects, errors, JSON)
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        if (!str_contains($response->headers->get('Content-Type', ''), 'text/html')) {
            return $response;
        }

        // Extract the Inertia page data from the HTML response
        $html = $response->getContent();
        if (!preg_match('/<div[^>]*id="app"[^>]*data-page="([^"]*)"/', $html, $matches)) {
            return $response;
        }

        $pageJson = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
        $pageData = json_decode($pageJson, true);

        if (!$pageData || !isset($pageData['component'])) {
            return $response;
        }

        $component = $pageData['component'];
        $props = $pageData['props'] ?? [];

        // Remove the Inertia errors prop (stdClass) to avoid conflict with Blade's $errors (ViewErrorBag)
        unset($props['errors']);

        // Find the matching Blade view
        $viewName = $this->viewMap[$component] ?? str_replace('/', '.', $component);

        if (!view()->exists($viewName)) {
            return $response; // Fall back to original Inertia HTML if no Blade view
        }

        // Render the Blade view with the props
        $bladeHtml = view($viewName, $props)->render();

        return response($bladeHtml, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    protected function hasViteBuild(): bool
    {
        return file_exists(public_path('build/manifest.json'))
            || file_exists(public_path('hot'));
    }
}

