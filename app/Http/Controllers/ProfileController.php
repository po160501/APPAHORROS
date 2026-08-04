<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'coverImage' => $request->user()->cover_image
                ? asset($request->user()->cover_image)
                : null,
        ]);
    }

    public function updateCover(Request $request): RedirectResponse
    {
        $request->validate(['cover' => 'required|image|max:4096']);

        $user = $request->user();
        $folder = 'covers';

        if ($user->cover_image) {
            $oldPublicPath = public_path($user->cover_image);
            $oldStoragePath = storage_path('app/public/' . ltrim($user->cover_image, '/'));

            if (File::exists($oldPublicPath)) {
                File::delete($oldPublicPath);
            } elseif (File::exists($oldStoragePath)) {
                File::delete($oldStoragePath);
            }
        }

        if (! File::exists(public_path($folder))) {
            File::makeDirectory(public_path($folder), 0755, true);
        }

        $file = $request->file('cover');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path($folder), $filename);

        $user->cover_image = $folder . '/' . $filename;
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'cover-updated');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
