import {AnimatePresence, m} from 'framer-motion';
import React, {useEffect, useRef, useState} from 'react';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useShareableLinkPage} from '../../queries/use-shareable-link-page';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {DriveEntry} from '../../../files/drive-entry';
import {FolderPreviewFileGrid} from './folder-preview-file-grid';
import {useLinkPageStore} from '../link-page-store';
import {FolderPreviewFileTable} from './folder-preview-file-table';
import {useNavigateToSubfolder} from './use-navigate-to-subfolder';
import {useLocation} from 'react-router';
import {AdHost} from '@common/admin/ads/ad-host';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {FilePreviewDialog} from '@common/uploads/components/file-preview/file-preview-dialog';

interface FolderPreviewChildrenProps {
  className?: string;
}
export function FolderPreviewFileView({className}: FolderPreviewChildrenProps) {
  const {pathname} = useLocation();
  const navigateToSubfolder = useNavigateToSubfolder();
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>();
  const viewMode = useLinkPageStore(s => s.viewMode);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    link,
    entries,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isPlaceholderData,
  } = useShareableLinkPage();

  // close preview modal on back/forward navigation
  useEffect(() => {
    setActivePreviewIndex(undefined);
  }, [pathname]);

  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(sentinelEl);
    return () => {
      observer.unobserve(sentinelEl);
    };
  }, [hasNextPage, fetchNextPage]);

  if (!link || isPlaceholderData) {
    return (
      <div className={clsx('flex justify-center', className)}>
        <ProgressCircle isIndeterminate />
      </div>
    );
  }

  const handlePreview = (entry: DriveEntry, index: number) => {
    if (entry.type === 'folder') {
      navigateToSubfolder(entry.hash);
    } else {
      setActivePreviewIndex(index);
    }
  };

  const folderEntries = entries || [];

  return (
    <>
      <div
        className={clsx(
          'file-grid-container flex-auto overflow-auto px-14 pb-14 md:px-24 md:pb-24',
          className,
        )}
      >
        <AdHost slot="file-preview" className="mb-40" />
        {viewMode === 'grid' ? (
          <FolderPreviewFileGrid
            entries={folderEntries}
            onEntrySelected={handlePreview}
          />
        ) : (
          <FolderPreviewFileTable
            entries={folderEntries}
            onEntrySelected={handlePreview}
          />
        )}
        <span ref={sentinelRef} aria-hidden />
        <AnimatePresence>
          {isFetchingNextPage && (
            <m.div
              className="mt-24 flex w-full justify-center"
              {...opacityAnimation}
            >
              <ProgressCircle isIndeterminate aria-label="loading" />
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <DialogTrigger
        type="modal"
        isOpen={activePreviewIndex != undefined}
        onClose={() => setActivePreviewIndex(undefined)}
      >
        <FilePreviewDialog
          entries={folderEntries}
          defaultActiveIndex={activePreviewIndex}
          allowDownload={link.allow_download}
        />
      </DialogTrigger>
    </>
  );
}
