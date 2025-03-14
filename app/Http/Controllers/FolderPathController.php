<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\ShareableLink;
use App\Services\Entries\SetPermissionsOnEntry;
use Common\Core\BaseController;
use Common\Files\Traits\HashesId;

class FolderPathController extends BaseController
{
    use HashesId;

    public function show(string $hash)
    {
        $folder = Folder::with(['users', 'tags'])
            ->byIdOrHash($hash)
            ->firstOrFail();

        $link = request('shareable_link')
            ? ShareableLink::findOrFail(request('shareable_link'))
            : null;

        $this->authorize('show', [$folder, $link]);

        $path = $folder
            ->allParents()
            ->select(['id', 'name', 'path', 'type'])
            ->with(['users', 'tags'])
            ->get();

        $path[] = $folder;

        $path = $path
            // if path is for shareable link, only return path up to the folder that the link is for
            ->filter(function (Folder $folder) use ($link) {
                if (!$link) {
                    return true;
                }
                return str_contains($folder->path, $link->entry_id);
            })
            ->map(
                fn($folder) => app(SetPermissionsOnEntry::class)->execute(
                    $folder,
                ),
            );

        return $this->success(['path' => $path->values()]);
    }
}
