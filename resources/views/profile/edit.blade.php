@extends('layouts.app')

@section('title', 'Profile - TaskTrack')

@section('content')
<div class="max-w-4xl mx-auto space-y-8 pb-12">
    <div>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p class="mt-1 text-sm text-slate-500">Manage your personal and account information.</p>
    </div>

    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 class="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">Profile Information</h2>
        <form action="{{ route('profile.update') }}" method="POST" enctype="multipart/form-data" class="mt-6 max-w-xl space-y-4">
            @csrf
            @method('PATCH')
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Profile Picture</label>
                <input type="file" name="avatar" accept="image/*" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                @error('avatar') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Full Name</label>
                <input type="text" name="name" value="{{ old('name', auth()->user()->name) }}" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                @error('name') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Email Address</label>
                <input type="email" name="email" value="{{ old('email', auth()->user()->email) }}" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                @error('email') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
            </div>
            <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">Update Profile</button>
        </form>
    </section>

    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 class="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">Change Password</h2>
        <form action="{{ route('profile.password') }}" method="POST" class="mt-6 max-w-xl space-y-4">
            @csrf
            @method('PUT')
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Current Password</label>
                <input type="password" name="current_password" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                @error('current_password') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">New Password</label>
                <input type="password" name="password" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
                @error('password') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
            </div>
            <div>
                <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" name="password_confirmation" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
            </div>
            <button type="submit" class="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">Update Password</button>
        </form>
    </section>
</div>
@endsection
