import { useEffect, useMemo, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

type ProductImageLightboxProps = {
  isOpen: boolean;
  images: string[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
};

const FALLBACK_SIZE = 1400;

export const ProductImageLightbox = ({
  isOpen,
  images,
  activeIndex,
  onChangeIndex,
  onClose,
}: ProductImageLightboxProps) => {
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
  const sizesRef = useRef<Record<string, { width: number; height: number }>>({});
  const onCloseRef = useRef(onClose);
  const onChangeIndexRef = useRef(onChangeIndex);
  const openIndexRef = useRef(activeIndex);
  const [sizesVersion, setSizesVersion] = useState(0);

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
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onChangeIndexRef.current = onChangeIndex;
  }, [onChangeIndex]);

  useEffect(() => {
    openIndexRef.current = activeIndex;
  }, [activeIndex]);

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

  useEffect(() => {
    if (!isOpen || !sizesReady || !images.length) return;
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
      closeOnVerticalDrag: false,
      wheelToZoom: true,
      pinchToClose: false,
      closeOnScroll: false,
      loop: false,
      pswpModule: () => import('photoswipe'),
    });

    lightbox.on('close', () => {
      onCloseRef.current();
    });

    lightbox.on('change', () => {
      const index = lightbox.pswp?.currIndex ?? 0;
      if (typeof index === 'number') {
        onChangeIndexRef.current(index);
      }
    });

    lightbox.init();
    const startIndex = Math.min(openIndexRef.current, dataSource.length - 1);
    lightbox.loadAndOpen(Math.max(0, startIndex));
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [images, isOpen, sizesReady]);

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
