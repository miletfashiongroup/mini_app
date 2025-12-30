import { useEffect, useMemo, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

import type { ProductReview } from './ProductReviewsSection';

type ReviewImageLightboxProps = {
  isOpen: boolean;
  review: ProductReview | null;
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
};

const FALLBACK_SIZE = 1400;
const MIN_SHEET_HEIGHT = 160;
const MAX_SHEET_RATIO = 0.68;

const formatMeta = (review: ProductReview) => {
  const parts: string[] = [];
  if (review.purchaseDate) parts.push(`Дата покупки: ${review.purchaseDate}`);
  if (review.sizeLabel) parts.push(`Размер: ${review.sizeLabel}`);
  return parts.join(' · ');
};

export const ReviewImageLightbox = ({
  isOpen,
  review,
  activeIndex,
  onChangeIndex,
  onClose,
}: ReviewImageLightboxProps) => {
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
  const sizesRef = useRef<Record<string, { width: number; height: number }>>({});
  const reviewRef = useRef<ProductReview | null>(review);
  const overlayRef = useRef<{
    root?: HTMLDivElement;
    sheet?: HTMLDivElement;
    handle?: HTMLDivElement;
    header?: HTMLDivElement;
    meta?: HTMLDivElement;
    text?: HTMLDivElement;
    index?: HTMLDivElement;
    cleanup?: () => void;
  }>({});
  const overlayVisibleRef = useRef(true);
  const dragRef = useRef<{ startY: number; startHeight: number; maxHeight: number } | null>(null);
  const onCloseRef = useRef(onClose);
  const onChangeIndexRef = useRef(onChangeIndex);
  const openIndexRef = useRef(activeIndex);
  const [sizesVersion, setSizesVersion] = useState(0);

  const images = useMemo(() => review?.gallery?.filter(Boolean) ?? [], [review]);
  const imagesKey = useMemo(() => images.join('|'), [images]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onChangeIndexRef.current = onChangeIndex;
  }, [onChangeIndex]);

  useEffect(() => {
    openIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    reviewRef.current = review;
  }, [review]);

  useEffect(() => {
    if (!images.length) return;
    let cancelled = false;
    const pending = images.filter((url) => !sizesRef.current[url]);
    if (!pending.length) return;

    pending.forEach((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        sizesRef.current[url] = {
          width: img.naturalWidth || FALLBACK_SIZE,
          height: img.naturalHeight || FALLBACK_SIZE,
        };
        setSizesVersion((value) => value + 1);
      };
      img.onerror = () => {
        if (cancelled) return;
        sizesRef.current[url] = { width: FALLBACK_SIZE, height: FALLBACK_SIZE };
        setSizesVersion((value) => value + 1);
      };
      img.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

  const sizesReady = useMemo(
    () => images.length > 0 && images.every((url) => Boolean(sizesRef.current[url])),
    [images, sizesVersion],
  );

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevRootOverscroll = root.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    body.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    WebApp?.disableVerticalSwipes?.();

    return () => {
      body.style.overflow = prevOverflow;
      root.style.overscrollBehavior = prevRootOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      WebApp?.enableVerticalSwipes?.();
    };
  }, [isOpen]);

  const updateOverlay = (nextReview: ProductReview | null, index: number, total: number) => {
    const overlay = overlayRef.current;
    if (!overlay.header || !overlay.meta || !overlay.text || !overlay.index) return;
    if (!nextReview) return;
    overlay.header.textContent = nextReview.name || 'Покупатель';
    overlay.meta.textContent = formatMeta(nextReview) || nextReview.status || '';
    overlay.text.textContent = nextReview.text || '';
    overlay.index.textContent = total > 1 ? `${index + 1} / ${total}` : '';
  };

  const setOverlayVisible = (nextVisible: boolean) => {
    const overlayRoot = overlayRef.current.root;
    if (!overlayRoot) return;
    overlayVisibleRef.current = nextVisible;
    overlayRoot.style.opacity = nextVisible ? '1' : '0';
    overlayRoot.style.pointerEvents = nextVisible ? 'auto' : 'none';
  };

  const setupOverlay = (el: HTMLDivElement, nextReview: ProductReview, total: number, index: number) => {
    el.className = 'pswp-review-overlay';
    el.style.cssText = [
      'position:absolute',
      'left:0',
      'right:0',
      'bottom:0',
      'display:flex',
      'justify-content:center',
      'padding:0 14px 16px',
      'box-sizing:border-box',
      'transition:opacity 160ms ease',
      'z-index:10',
    ].join(';');

    const sheet = document.createElement('div');
    sheet.style.cssText = [
      'width:100%',
      'max-width:720px',
      'background:rgba(44,44,46,0.92)',
      'color:#ffffff',
      'border-radius:18px',
      'padding:12px 14px 14px',
      'box-sizing:border-box',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'backdrop-filter: blur(6px)',
      '-webkit-backdrop-filter: blur(6px)',
    ].join(';');

    const handle = document.createElement('div');
    handle.style.cssText = [
      'align-self:center',
      'width:40px',
      'height:4px',
      'border-radius:4px',
      'background:rgba(255,255,255,0.4)',
      'margin-bottom:4px',
      'cursor:grab',
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'font-size:14px;font-weight:600;line-height:1.2;';

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:12px;opacity:0.8;line-height:1.3;';

    const text = document.createElement('div');
    text.style.cssText = [
      'font-size:13px',
      'line-height:1.45',
      'max-height:180px',
      'overflow:auto',
      'padding-right:4px',
      '-webkit-overflow-scrolling:touch',
    ].join(';');

    const indexBadge = document.createElement('div');
    indexBadge.style.cssText = 'font-size:12px;opacity:0.7;text-align:right;';

    sheet.append(handle, header, meta, text, indexBadge);
    el.appendChild(sheet);

    overlayRef.current = {
      root: el,
      sheet,
      handle,
      header,
      meta,
      text,
      index: indexBadge,
    };

    overlayVisibleRef.current = true;
    updateOverlay(nextReview, index, total);

    const updateHeights = (height: number) => {
      const clamped = Math.max(MIN_SHEET_HEIGHT, Math.min(height, dragRef.current?.maxHeight ?? height));
      sheet.style.height = `${clamped}px`;
      text.style.maxHeight = `${Math.max(80, clamped - 90)}px`;
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      const maxHeight = Math.round(window.innerHeight * MAX_SHEET_RATIO);
      dragRef.current = { startY: event.clientY, startHeight: sheet.getBoundingClientRect().height, maxHeight };
      handle.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - event.clientY;
      updateHeights(dragRef.current.startHeight + delta);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      handle.releasePointerCapture(event.pointerId);
    };

    handle.addEventListener('pointerdown', handlePointerDown);
    handle.addEventListener('pointermove', handlePointerMove);
    handle.addEventListener('pointerup', handlePointerUp);
    handle.addEventListener('pointercancel', handlePointerUp);

    const handleResize = () => {
      updateHeights(sheet.getBoundingClientRect().height);
    };

    window.addEventListener('resize', handleResize);

    overlayRef.current.cleanup = () => {
      handle.removeEventListener('pointerdown', handlePointerDown);
      handle.removeEventListener('pointermove', handlePointerMove);
      handle.removeEventListener('pointerup', handlePointerUp);
      handle.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('resize', handleResize);
    };
  };

  useEffect(() => {
    if (!isOpen || !sizesReady || !images.length || !reviewRef.current) return;
    if (lightboxRef.current) return;

    const dataSource = images.map((url) => {
      const size = sizesRef.current[url] ?? { width: FALLBACK_SIZE, height: FALLBACK_SIZE };
      return {
        src: url,
        width: size.width,
        height: size.height,
      };
    });

    const lightbox = new PhotoSwipeLightbox({
      dataSource,
      bgOpacity: 0.96,
      showHideAnimationType: 'zoom',
      tapAction: 'none',
      doubleTapAction: 'zoom',
      bgClickAction: 'close',
      closeOnVerticalDrag: false,
      wheelToZoom: true,
      pinchToClose: false,
      closeOnScroll: false,
      clickToCloseNonZoomable: false,
      loop: false,
      pswpModule: () => import('photoswipe'),
    });

    lightbox.on('uiRegister', () => {
      if (!lightbox.pswp) return;
      const currentReview = reviewRef.current;
      if (!currentReview) return;
      lightbox.pswp.ui.registerElement({
        name: 'review-overlay',
        order: 10,
        isButton: false,
        appendTo: 'root',
        onInit: (el) => {
          setupOverlay(el as HTMLDivElement, currentReview, dataSource.length, openIndexRef.current);
        },
      });
    });

    lightbox.on('close', () => {
      onCloseRef.current();
    });

    lightbox.on('change', () => {
      const index = lightbox.pswp?.currIndex ?? 0;
      if (typeof index === 'number') {
        const currentReview = reviewRef.current;
        if (currentReview) {
          updateOverlay(currentReview, index, dataSource.length);
        }
        onChangeIndexRef.current(index);
      }
    });

    lightbox.on('tap', () => {
      setOverlayVisible(!overlayVisibleRef.current);
    });

    lightbox.init();
    const startIndex = Math.min(openIndexRef.current, dataSource.length - 1);
    lightbox.loadAndOpen(Math.max(0, startIndex));
    lightboxRef.current = lightbox;

    return () => {
      overlayRef.current.cleanup?.();
      lightbox.destroy();
      lightboxRef.current = null;
      overlayRef.current = {};
    };
  }, [images, imagesKey, isOpen, sizesReady]);

  useEffect(() => {
    const pswp = lightboxRef.current?.pswp;
    if (!pswp) return;
    if (pswp.currIndex !== activeIndex) {
      pswp.goTo(activeIndex);
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  if (!sizesReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  return null;
};
