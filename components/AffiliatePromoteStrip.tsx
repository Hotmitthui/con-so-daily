"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AffiliateGalleryItem = {
  key: string;
  url: string;
};

type AffiliateOffer = {
  slug: string;
  catalog: string;
  offer_type: string;
  platform: string;
  brand: string;
  brand_logo_url?: string | null;
  title: string;
  cta?: string | null;
  affiliate_link: string;
  image_url: string;
  description?: string | null;
  is_active?: boolean | null;
  meta?: Record<string, unknown> | null;
};

type AffiliatePromoteStripProps = {
  limit?: number;
};

type OfferStackProps = {
  emphasized?: boolean;
  images: AffiliateGalleryItem[];
  offer: AffiliateOffer;
  onOpen: (slug: string, activeIndex: number) => void;
  overlapClassName?: string;
};

type OfferCardProps = {
  emphasized?: boolean;
  images: AffiliateGalleryItem[];
  offer: AffiliateOffer;
  onInteract: () => void;
  onOpen: (slug: string, activeIndex: number) => void;
  overlapClassName?: string;
};

type DragState = {
  dragging: boolean;
  moved: boolean;
  pointerId: number | null;
  pressedSlot: "prev" | "current" | "next" | null;
  deltaX: number;
  deltaY: number;
  startX: number;
  startY: number;
};

const SLIDE_WIDTH = 96;
const STACK_WIDTH = 168;
const INFO_GAP_PX = 12;
const BASE_TRANSLATE_X = STACK_WIDTH / 2 - SLIDE_WIDTH * 1.5;
const SNAP_THRESHOLD_PX = 26;
const MAX_DRAG_PX = 96;
const ANIMATION_MS = 220;
const TAP_MOVE_THRESHOLD_PX = 10;
const OFFER_ROTATE_MS = 5000;
const OFFER_FADE_MS = 1000;
const OFFER_INITIAL_FADE_MS = 2000;

const getAffiliateGallery = (offer?: AffiliateOffer | null): AffiliateGalleryItem[] => {
  const galleryRaw =
    offer?.meta && typeof offer.meta === "object"
      ? (offer.meta.gallery ?? offer.meta.images)
      : [];

  if (!Array.isArray(galleryRaw)) return [];

  const mapped = galleryRaw.map((item): AffiliateGalleryItem | null => {
    if (!item || typeof item !== "object") return null;
    const entry = item as Record<string, unknown>;
    const key = String(entry.key || "").trim();
    const url = String(entry.url || "").trim();

    if (!key || !url) return null;

    return { key, url };
  });

  return mapped.filter((item): item is AffiliateGalleryItem => item !== null);
};

const getOfferImages = (offer: AffiliateOffer): AffiliateGalleryItem[] => {
  const seed: AffiliateGalleryItem[] = [];

  if (offer.image_url) {
    seed.push({
      key: `${offer.slug}-cover`,
      url: offer.image_url,
    });
  }

  getAffiliateGallery(offer).forEach((item) => {
    seed.push(item);
  });

  return seed.filter(
    (item, index, array) => array.findIndex((entry) => entry.url === item.url) === index
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mod = (value: number, length: number) => ((value % length) + length) % length;

function AffiliateOfferStack({
  emphasized = false,
  images,
  offer,
  onOpen,
  overlapClassName = "",
}: OfferStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [visualOffset, setVisualOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const dragRef = useRef<DragState>({
    dragging: false,
    moved: false,
    pointerId: null,
    pressedSlot: null,
    deltaX: 0,
    deltaY: 0,
    startX: 0,
    startY: 0,
  });

  const imageCount = images.length;
  const previousIndex = imageCount > 0 ? mod(activeIndex - 1, imageCount) : 0;
  const nextIndex = imageCount > 0 ? mod(activeIndex + 1, imageCount) : 0;
  const previousImage = imageCount > 0 ? images[previousIndex] : null;
  const currentImage = imageCount > 0 ? images[activeIndex] || images[0] : null;
  const nextImage = imageCount > 0 ? images[nextIndex] : null;
  const swipeProgress = clamp(visualOffset / SLIDE_WIDTH, -1, 1);

  useEffect(() => {
    if (imageCount <= 1) return;
    const preloadTargets = [
      images[mod(activeIndex + 2, imageCount)]?.url,
      images[mod(activeIndex - 2, imageCount)]?.url,
    ].filter(Boolean) as string[];

    preloadTargets.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [activeIndex, imageCount, images]);

  const setTrackPosition = (offsetX: number, animated: boolean) => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transition = animated
      ? `transform ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";
    track.style.transform = `translate3d(${BASE_TRANSLATE_X + offsetX}px, 0, 0)`;
  };

  const clearTimers = () => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const animateToIndex = (nextResolvedIndex: number) => {
    if (imageCount <= 1) return;

    clearTimers();
    pendingIndexRef.current = nextResolvedIndex;
    const movingLeft = nextResolvedIndex === mod(activeIndex + 1, imageCount);
    const targetOffset = movingLeft ? -SLIDE_WIDTH : SLIDE_WIDTH;

    setIsDragging(false);
    setVisualOffset(targetOffset);
    setTrackPosition(targetOffset, true);

    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      const committedIndex = pendingIndexRef.current;
      pendingIndexRef.current = null;
      if (typeof committedIndex === "number") {
        setVisualOffset(0);
        setActiveIndex(committedIndex);
      } else {
        setVisualOffset(0);
        setTrackPosition(0, false);
      }
    }, ANIMATION_MS);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (imageCount <= 1) return;
    const nextResolvedIndex =
      direction === "next" ? mod(activeIndex + 1, imageCount) : mod(activeIndex - 1, imageCount);
    animateToIndex(nextResolvedIndex);
  };

  useLayoutEffect(() => {
    clearTimers();
    setTrackPosition(0, false);
    pendingIndexRef.current = null;

    return () => {
      clearTimers();
    };
  }, [activeIndex, imageCount]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (imageCount <= 1) return;

    clearTimers();
    setIsDragging(true);
    setVisualOffset(0);
    dragRef.current = {
      dragging: true,
      moved: false,
      pointerId: event.pointerId,
      pressedSlot: (event.target as HTMLElement | null)?.closest("[data-slot]")?.getAttribute("data-slot") as
        | "prev"
        | "current"
        | "next"
        | null,
      deltaX: 0,
      deltaY: 0,
      startX: event.clientX,
      startY: event.clientY,
    };

    setTrackPosition(0, false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || dragRef.current.pointerId !== event.pointerId) return;

    const deltaX = clamp(event.clientX - dragRef.current.startX, -MAX_DRAG_PX, MAX_DRAG_PX);
    const deltaY = event.clientY - dragRef.current.startY;
    if (Math.abs(deltaX) > TAP_MOVE_THRESHOLD_PX || Math.abs(deltaY) > TAP_MOVE_THRESHOLD_PX) {
      dragRef.current.moved = true;
    }

    dragRef.current.deltaX = deltaX;
    dragRef.current.deltaY = deltaY;
    setVisualOffset(deltaX);
    setTrackPosition(deltaX, false);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || dragRef.current.pointerId !== event.pointerId) return;

    const deltaX = dragRef.current.deltaX;
    const shouldSuppressClick = dragRef.current.moved;
    const shouldOpenCurrent = !shouldSuppressClick && dragRef.current.pressedSlot === "current";
    dragRef.current.dragging = false;
    dragRef.current.pointerId = null;
    dragRef.current.pressedSlot = null;
    dragRef.current.deltaX = 0;
    dragRef.current.deltaY = 0;
    setIsDragging(false);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}

    if (shouldSuppressClick) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    if (imageCount <= 1) {
      setVisualOffset(0);
      setTrackPosition(0, true);
      if (shouldOpenCurrent) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        onOpen(offer.slug, activeIndex);
      }
      return;
    }

    if (shouldOpenCurrent) {
      setVisualOffset(0);
      setTrackPosition(0, false);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      onOpen(offer.slug, activeIndex);
      return;
    }

    if (Math.abs(deltaX) >= SNAP_THRESHOLD_PX) {
      const nextResolvedIndex = deltaX < 0 ? mod(activeIndex + 1, imageCount) : mod(activeIndex - 1, imageCount);
      animateToIndex(nextResolvedIndex);
      return;
    }

    setVisualOffset(0);
    setTrackPosition(0, true);
  };

  return (
    <div
      className={`relative h-[148px] shrink-0 transition-transform duration-300 ${
        emphasized ? "z-20 -mb-1 scale-110" : "z-10"
      } ${overlapClassName}`}
      style={{ width: `${STACK_WIDTH}px`, touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-purple-300/80 bg-white/80 shadow-[0_4px_10px_rgba(147,51,234,0.14)] backdrop-blur-sm">
        {imageCount > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-1 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white md:h-8 md:w-8"
              aria-label={`Xem ảnh trước của ${offer.title || offer.brand || "offer affiliate"}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                handleNavigate("prev");
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
            <button
              type="button"
              className="absolute right-1 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white md:h-8 md:w-8"
              aria-label={`Xem ảnh tiếp theo của ${offer.title || offer.brand || "offer affiliate"}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                handleNavigate("next");
              }}
            >
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </button>
          </>
        ) : null}
        <div
          ref={trackRef}
          className="flex h-full will-change-transform"
          style={{ width: `${SLIDE_WIDTH * 3}px` }}
        >
          {[
            { image: previousImage, label: "ảnh trước", slot: "prev" as const },
            { image: currentImage, label: `ảnh ${activeIndex + 1}`, slot: "current" as const },
            { image: nextImage, label: "ảnh tiếp theo", slot: "next" as const },
          ].map((item) => {
            const slotBase = item.slot === "prev" ? -1 : item.slot === "next" ? 1 : 0;
            const relativePosition = slotBase + swipeProgress;
            const centerProximity = Math.max(0, 1 - Math.abs(relativePosition));
            const imageWidth = 80 + centerProximity * 32;
            const imageScale = 0.9 + centerProximity * 0.2;
            const imageOpacity = 0.7 + centerProximity * 0.3;
            const imageShadow = 0.08 + centerProximity * 0.14;
            const isCurrentSlot = item.slot === "current";

            return (
              <button
                key={`${offer.slug}-${item.slot}-${item.image?.key || "empty"}`}
                type="button"
                className="flex h-full shrink-0 items-center justify-center select-none"
                style={{
                  width: `${SLIDE_WIDTH}px`,
                  opacity: imageOpacity,
                  transition: isDragging ? "none" : `opacity ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                data-slot={item.slot}
                onClick={(event) => {
                  if (!isCurrentSlot || suppressClickRef.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                  }
                  onOpen(offer.slug, activeIndex);
                }}
                aria-label={
                  isCurrentSlot
                    ? `Xem ảnh lớn của ${offer.title || offer.brand || "offer affiliate"}`
                    : `${offer.title || offer.brand || "Offer affiliate"} - ${item.label}`
                }
                tabIndex={isCurrentSlot ? 0 : -1}
              >
                {item.image ? (
                  <img
                    src={item.image.url}
                    alt={`${offer.title || offer.brand || "Offer affiliate"} - ${item.label}`}
                    className="block h-auto object-contain"
                    style={{
                      width: `${imageWidth}px`,
                      transform: `scale(${imageScale})`,
                      filter: `drop-shadow(0 14px 20px rgba(15, 23, 42, ${imageShadow}))`,
                      transition: isDragging
                        ? "none"
                        : `transform ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                    }}
                    draggable={false}
                    decoding="async"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AffiliateOfferCard({
  emphasized = false,
  images,
  offer,
  onInteract,
  onOpen,
  overlapClassName = "",
}: OfferCardProps) {
  return (
    <div
      className="flex h-[148px] w-full items-center gap-3"
      onMouseEnter={onInteract}
      onPointerDown={onInteract}
      onFocus={onInteract}
    >
      <div className="flex h-full items-center">
        <AffiliateOfferStack
          emphasized={emphasized}
          images={images}
          offer={offer}
          onOpen={onOpen}
          overlapClassName={overlapClassName}
        />
      </div>

      <div className="flex h-full min-w-0 flex-1 items-center justify-center">
        <div className="flex h-full w-full max-w-[132px] flex-col items-center justify-center px-1 pb-10 text-center text-[13px] leading-relaxed text-slate-700">
          <p className="truncate text-lg font-bold text-pink-700">{offer.brand || "-"}</p>
          <p className="truncate">{offer.offer_type || "-"}</p>
          <a
            href={offer.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-purple-700"
            onClick={onInteract}
          >
            Nhận ưu đãi
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AffiliatePromoteStrip({ limit }: AffiliatePromoteStripProps) {
  const [activeAffiliateOffers, setActiveAffiliateOffers] = useState<AffiliateOffer[]>([]);
  const [affiliateOffersLoading, setAffiliateOffersLoading] = useState(true);
  const [affiliateOffersError, setAffiliateOffersError] = useState<string | null>(null);
  const [displayedOfferIndex, setDisplayedOfferIndex] = useState(0);
  const [rotationNonce, setRotationNonce] = useState(0);
  const [transitionStage, setTransitionStage] = useState<"idle" | "out" | "in">("idle");
  const [hasPlayedInitialFade, setHasPlayedInitialFade] = useState(false);
  const [selectedOfferState, setSelectedOfferState] = useState<{ slug: string; activeIndex: number } | null>(null);
  const phaseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAffiliateOffers = async () => {
      try {
        setAffiliateOffersLoading(true);
        setAffiliateOffersError(null);

        const res = await fetch(`/api/affiliate-offers?t=${Date.now()}`, {
          cache: "no-store",
        });
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(payload?.error || "Không tải được affiliate offers.");
        }

        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextRows = rows.filter((row: AffiliateOffer) => row?.is_active !== false && row?.image_url);

        if (!cancelled) {
          setActiveAffiliateOffers(nextRows);
        }
      } catch (err) {
        if (!cancelled) {
          setAffiliateOffersError(err instanceof Error ? err.message : "Không tải được affiliate offers.");
          setActiveAffiliateOffers([]);
        }
      } finally {
        if (!cancelled) {
          setAffiliateOffersLoading(false);
        }
      }
    };

    void loadAffiliateOffers();

    return () => {
      cancelled = true;
    };
  }, []);

  const affiliateFloatingOffers =
    typeof limit === "number" ? activeAffiliateOffers.slice(0, limit) : activeAffiliateOffers;

  const offerImagesBySlug = useMemo(
    () =>
      affiliateFloatingOffers.reduce<Record<string, AffiliateGalleryItem[]>>((acc, offer) => {
        acc[offer.slug] = getOfferImages(offer);
        return acc;
      }, {}),
    [affiliateFloatingOffers]
  );
  const displayedOffer =
    affiliateFloatingOffers[clamp(displayedOfferIndex, 0, Math.max(affiliateFloatingOffers.length - 1, 0))] || null;
  const displayedCatalogOffers = useMemo(
    () =>
      displayedOffer
        ? affiliateFloatingOffers.filter(
            (offer) => offer.catalog.trim().toLowerCase() === displayedOffer.catalog.trim().toLowerCase()
          )
        : [],
    [affiliateFloatingOffers, displayedOffer]
  );

  useEffect(() => {
    if (!affiliateFloatingOffers.length) {
      setDisplayedOfferIndex(0);
      setTransitionStage("idle");
      return;
    }

    setDisplayedOfferIndex((current) => clamp(current, 0, affiliateFloatingOffers.length - 1));
  }, [affiliateFloatingOffers]);

  useEffect(() => {
    if (!affiliateFloatingOffers.length || transitionStage !== "idle" || selectedOfferState) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setTransitionStage("out");
      if (phaseTimerRef.current) {
        window.clearTimeout(phaseTimerRef.current);
      }

      phaseTimerRef.current = window.setTimeout(() => {
        setDisplayedOfferIndex((current) => {
          if (affiliateFloatingOffers.length > 1) {
            return mod(current + 1, affiliateFloatingOffers.length);
          }
          return current;
        });
        setTransitionStage("in");

        phaseTimerRef.current = window.setTimeout(() => {
          setTransitionStage("idle");
          setRotationNonce((current) => current + 1);
          phaseTimerRef.current = null;
        }, OFFER_FADE_MS);
      }, OFFER_FADE_MS);
    }, OFFER_ROTATE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [affiliateFloatingOffers.length, displayedOfferIndex, rotationNonce, transitionStage, selectedOfferState]);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        window.clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    };
  }, []);

  const resetOfferRotation = () => {
    if (!affiliateFloatingOffers.length || selectedOfferState) return;
    if (transitionStage !== "idle") return;
    setRotationNonce((current) => current + 1);
  };

  const handleSelectOfferBySlug = (slug: string) => {
    if (!affiliateFloatingOffers.length || selectedOfferState) return;

    const targetIndex = affiliateFloatingOffers.findIndex((offer) => offer.slug === slug);
    if (targetIndex < 0) return;

    if (targetIndex === displayedOfferIndex) {
      resetOfferRotation();
      return;
    }

    if (transitionStage !== "idle") return;

    setTransitionStage("out");
    if (phaseTimerRef.current) {
      window.clearTimeout(phaseTimerRef.current);
    }

    phaseTimerRef.current = window.setTimeout(() => {
      setDisplayedOfferIndex(targetIndex);
      setTransitionStage("in");

      phaseTimerRef.current = window.setTimeout(() => {
        setTransitionStage("idle");
        setRotationNonce((current) => current + 1);
        phaseTimerRef.current = null;
      }, OFFER_FADE_MS);
    }, OFFER_FADE_MS);
  };

  const selectedOffer = useMemo(
    () => affiliateFloatingOffers.find((offer) => offer.slug === selectedOfferState?.slug) || null,
    [affiliateFloatingOffers, selectedOfferState]
  );
  const selectedOfferImages = selectedOffer ? offerImagesBySlug[selectedOffer.slug] || [] : [];
  const selectedOfferImageCount = selectedOfferImages.length;
  const selectedOfferActiveIndex = selectedOfferState
    ? clamp(selectedOfferState.activeIndex, 0, Math.max(selectedOfferImageCount - 1, 0))
    : 0;
  const selectedOfferImageUrl =
    selectedOfferImages[selectedOfferActiveIndex]?.url || selectedOffer?.image_url || "";
  const shouldApplyInitialFade = Boolean(displayedOffer) && !hasPlayedInitialFade;

  useEffect(() => {
    if (!shouldApplyInitialFade) return;

    const timerId = window.setTimeout(() => {
      setHasPlayedInitialFade(true);
    }, OFFER_INITIAL_FADE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [shouldApplyInitialFade]);

  return (
    <>
      <section className="mt-6 -mx-4 min-h-[176px] border-t border-pink-200 bg-gradient-to-t from-sky-100/80 to-pink-100/90 px-4 py-3">
        <style>{`
          @keyframes affiliate-initial-fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
        <div className="mx-auto flex h-[158px] w-full max-w-md items-center pl-3">
          {affiliateOffersLoading ? (
            <div className="flex h-full w-full items-center justify-center text-center text-sm font-medium text-pink-700">
              Đang tải offer affiliate...
            </div>
          ) : affiliateOffersError ? (
            <div className="flex h-full w-full items-center justify-center text-center text-sm font-medium text-pink-700">
              {affiliateOffersError}
            </div>
          ) : displayedOffer ? (
            <div className="relative h-full w-full">
              <div
                className="flex h-full w-full items-center"
                style={{
                  opacity: transitionStage === "out" ? 0 : 1,
                  transition: shouldApplyInitialFade ? undefined : `opacity ${OFFER_FADE_MS}ms ease-in-out`,
                  animation: shouldApplyInitialFade
                    ? `affiliate-initial-fade-in ${OFFER_INITIAL_FADE_MS}ms ease-in-out both`
                    : undefined,
                }}
              >
                <AffiliateOfferCard
                  emphasized
                  images={offerImagesBySlug[displayedOffer.slug] || []}
                  offer={displayedOffer}
                  onInteract={resetOfferRotation}
                  onOpen={(slug, activeIndex) => {
                    resetOfferRotation();
                    setSelectedOfferState({ slug, activeIndex });
                  }}
                />
              </div>

              {displayedCatalogOffers.length > 0 ? (
                <div
                  className="absolute bottom-0 right-0 z-10 flex justify-center"
                  style={{ left: `${STACK_WIDTH + INFO_GAP_PX}px` }}
                >
                  <div className="flex max-w-[120px] flex-wrap items-center justify-center gap-2">
                    {displayedCatalogOffers.map((catalogOffer) => {
                      const isSelected = catalogOffer.slug === displayedOffer.slug;
                      const hasLogo = Boolean(catalogOffer.brand_logo_url);

                      return (
                        <button
                          key={catalogOffer.slug}
                          type="button"
                          onClick={() => {
                            resetOfferRotation();
                            handleSelectOfferBySlug(catalogOffer.slug);
                          }}
                          className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] border transition ${
                            isSelected
                              ? "border-purple-500 bg-white shadow-[0_0_0_2px_rgba(168,85,247,0.2)]"
                              : "border-purple-200/80 bg-white/75 hover:border-purple-300"
                          }`}
                          aria-label={`Xem offer ${catalogOffer.brand || "affiliate"} trong catalog ${catalogOffer.catalog || "affiliate"}`}
                        >
                          {hasLogo ? (
                            <img
                              src={catalogOffer.brand_logo_url || ""}
                              alt={catalogOffer.brand || "Brand logo"}
                              className="h-5 w-5 object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="px-1 text-[8px] font-bold uppercase text-slate-500">
                              {(catalogOffer.brand || "?").slice(0, 2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[110px] w-full items-center justify-center text-center text-sm font-medium text-pink-700">
              Chưa có offer affiliate đang bật để hiển thị.
            </div>
          )}
        </div>
      </section>

      {selectedOffer ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => setSelectedOfferState(null)}
          onKeyDown={(event) => {
            if (event.key === "Tab" || event.key === "Escape" || event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedOfferState(null);
            }
          }}
          role="button"
          tabIndex={0}
          autoFocus
          aria-label="Đóng ảnh lớn affiliate"
        >
          <div className="relative flex w-full max-w-3xl items-center justify-center overflow-visible">
            <div className="relative w-2/3 sm:w-[72%] md:w-[78%]">
              <img
                src={selectedOfferImageUrl}
                alt={selectedOffer.title || selectedOffer.brand || "Offer affiliate"}
                className="mx-auto h-auto max-h-[80vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
