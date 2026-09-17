<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class NoteSyncController extends Controller
{
    public function index(Request $request)
    {
        $query = Note::withTrashed()->orderBy('updated_at');

        if ($request->filled('updated_since')) {
            $query->where('updated_at', '>', Carbon::parse($request->string('updated_since')));
        }

        $notes = $query->get()->map(fn (Note $note) => [
            'uuid' => $note->uuid,
            'title' => $note->title,
            'content' => $note->content,
            'updatedAt' => $note->updated_at?->toISOString(),
            'deletedAt' => $note->deleted_at?->toISOString(),
        ])->values();

        return response()->json([
            'notes' => $notes,
            'cursor' => now()->toISOString(),
        ]);
    }

    public function sync(Request $request)
    {
        $data = $request->validate([
            'notes' => ['required', 'array'],
            'notes.*.uuid' => ['required', 'uuid'],
            'notes.*.title' => ['required', 'string', 'max:255'],
            'notes.*.content' => ['nullable', 'string'],
            'notes.*.updatedAt' => ['required', 'date'],
            'notes.*.deletedAt' => ['nullable', 'date'],
        ]);

        $accepted = [];

        foreach ($data['notes'] as $payload) {
            $note = Note::withTrashed()->firstOrNew(['uuid' => $payload['uuid']]);
            $incomingUpdatedAt = Carbon::parse($payload['updatedAt']);

            if (!$note->exists || !$note->updated_at || $incomingUpdatedAt->greaterThan($note->updated_at)) {
                $note->title = $payload['title'];
                $note->content = $payload['content'] ?? null;
                $note->updated_at = $incomingUpdatedAt;
                $note->save();

                if ($payload['deletedAt']) {
                    $note->delete();
                } elseif ($note->trashed()) {
                    $note->restore();
                }
            }

            $accepted[] = $payload['uuid'];
        }

        return response()->json(['accepted' => $accepted]);
    }
}
