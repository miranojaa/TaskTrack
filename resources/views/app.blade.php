@php
    $hasViteBuild = file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot'));
@endphp
@if($hasViteBuild)
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        <script>
            if (localStorage.getItem('tasktrack-theme') === 'dark' || (!('tasktrack-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        </script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'TaskTrack') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
@else
    @php
        $comp = $page['component'] ?? 'welcome';
        $props = $page['props'] ?? [];
        unset($props['errors']);
        $viewName = str_replace('/', '.', $comp);
    @endphp
    @if(view()->exists($viewName))
        @include($viewName, $props)
    @elseif(view()->exists('dashboard'))
        @include('dashboard', $props)
    @else
        @include('welcome')
    @endif
@endif
