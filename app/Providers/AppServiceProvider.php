<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\NotPwnedVerifier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
    }

    protected function configureUncompromisedVerifier(): void
    {
        $this->app->booted(function ($app) {
            $app->make(UncompromisedVerifier::class);
            $app->instance(
                UncompromisedVerifier::class,
                new NotPwnedVerifier(
                    $app->make(HttpFactory::class),
                    config('services.pwned_passwords.timeout', 3),
                ),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (!config('app.vite_use_hot_file')) {
            Vite::useHotFile(storage_path('framework/tasktrack-vite-hot-disabled'));
        }

        $this->configureDefaults();
        $this->configureUncompromisedVerifier();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
