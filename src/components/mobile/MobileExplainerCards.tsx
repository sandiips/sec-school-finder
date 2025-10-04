'use client';

import { useState, useRef, useEffect } from 'react';
import ExplainerCard from './ExplainerCard';

interface MobileExplainerCardsProps {
  sportsData: {
    text: string;
    mentionedSports: string[];
  };
  ccasData: {
    text: string;
  };
  cultureData: {
    text: string;
    cultureTags: string[];
  };
}

export default function MobileExplainerCards({
  sportsData,
  ccasData,
  cultureData
}: MobileExplainerCardsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const cards = [
    {
      id: 'sports',
      title: 'Sports',
      theme: 'green' as const,
      data: sportsData
    },
    {
      id: 'ccas',
      title: 'CCAs',
      theme: 'indigo' as const,
      data: ccasData
    },
    {
      id: 'culture',
      title: 'Culture',
      theme: 'amber' as const,
      data: cultureData
    }
  ];

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;

    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.scrollBehavior = 'auto';
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;

    e.preventDefault();
    const x = e.touches[0].clientX;
    const walk = (x - startX.current) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!scrollContainerRef.current) return;

    isDragging.current = false;
    scrollContainerRef.current.style.scrollBehavior = 'smooth';

    // Snap to nearest card
    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth;
    const newIndex = Math.round(container.scrollLeft / cardWidth);

    setCurrentCard(Math.max(0, Math.min(newIndex, cards.length - 1)));
    container.scrollTo({
      left: newIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  // Handle scroll for updating current card indicator
  const handleScroll = () => {
    if (!scrollContainerRef.current || isDragging.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth;
    const newIndex = Math.round(container.scrollLeft / cardWidth);

    if (newIndex !== currentCard) {
      setCurrentCard(newIndex);
    }
  };

  // Programmatic navigation to specific card
  const goToCard = (index: number) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.clientWidth;

    setCurrentCard(index);
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentCard > 0) {
        goToCard(currentCard - 1);
      } else if (e.key === 'ArrowRight' && currentCard < cards.length - 1) {
        goToCard(currentCard + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, cards.length]);

  return (
    <div className="w-full"> {/* Responsive control handled by parent */}
      {/* Card Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="w-full flex-shrink-0 px-2 snap-start"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ExplainerCard
              title={card.title}
              theme={card.theme}
              data={card.data}
              isActive={currentCard === index}
            />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              currentCard === index
                ? 'bg-blue-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to ${cards[index].title} card`}
          />
        ))}
      </div>

      {/* Screen Reader Navigation */}
      <div className="sr-only">
        <p>Showing {cards[currentCard].title} information. Use left and right arrow keys to navigate between cards.</p>
      </div>
    </div>
  );
}