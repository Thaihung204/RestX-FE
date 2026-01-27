'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';

// Exporting utility for manual usage if needed
export const handleScroll = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const windowPageYOffset = window.pageYOffset || document.documentElement.scrollTop;
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + windowPageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
    return true;
  }
  return false;
};

type NavItemRequest = {
  key: string;
  label: React.ReactNode;
  href: string; // Full path like '/restaurant#about' or '/restaurant'
};

interface NavbarProps {
  items: NavItemRequest[];
  textColor?: string;
  scrolled?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ items, textColor = 'white', scrolled = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('');
  const isClickScrolling = useRef(false);
  
  // Helper to extract ID from href
  const getSectionId = (href: string) => {
      const parts = href.split('#');
      if (parts.length > 1) return parts[1];
      if (href === '/restaurant' || href === '/') return 'home'; // Convention for root
      return null;
  };

  // Set active tab on mount based on hash or default
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash) {
      const found = items.find(item => item.href.endsWith(hash));
      if (found) {
        setActiveTab(found.key);
        setTimeout(() => handleScroll(hash.substring(1)), 300);
      }
    } else {
        if (items.length > 0 && pathname === items[0].href.split('#')[0]) {
             // If on the base page and no hash, check if we are at home section or just default
             // We'll let the IntersectionObserver pick it up mostly, but verify initial state
             // Usually default to first item if it matches the 'home' concept
             const homeItem = items.find(i => getSectionId(i.href) === 'home');
             if (homeItem) setActiveTab(homeItem.key);
             else setActiveTab(items[0].key);
        }
    }
  }, [pathname, items]);

  // ScrollSpy Logic: Update active tab while scrolling
  useEffect(() => {
    // Only run if we are on the text/restaurant page (or similar logic)
    // We can assume if the elements exist, we observe them.
    
    // Observer options:
    // rootMargin: Negative top margin compensates for the fixed header height (approx 80px).
    // The -40% bottom margin means the "active" zone is the top 60% of the screen.
    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -50% 0px',
        threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
        // If the user clicked a link, ignore scroll events until the smooth scroll is likely done
        if (isClickScrolling.current) return;

        // Filter intersecting entries
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
            // If multiple sections are visible, the one with the intersection ratio or simple order?
            // Usually the last intersecting one that entered?
            // With this rootMargin, we are looking for elements crossing the top part.
            // Let's pick the first one from the list as the 'most relevant' in this config.
            
            const visibleSection = visibleEntries[0];
            const id = visibleSection.target.id;
            
            // Reverse lookup the item key
            const item = items.find(i => getSectionId(i.href) === id);
            
            if (item) {
                setActiveTab(prev => (prev !== item.key ? item.key : prev));
            }
        }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe targets
    items.forEach(item => {
        const id = getSectionId(item.href);
        if (id) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
    });

    return () => observer.disconnect();
  }, [items, pathname]);

  const onLinkClick = (e: MouseEvent, item: NavItemRequest) => {
    e.preventDefault();
    setActiveTab(item.key);
    
    // Set manual scroll flag to prevent observer from overriding during the animation
    isClickScrolling.current = true;
    setTimeout(() => {
        isClickScrolling.current = false;
    }, 1000); // 1 second timeout roughly covers smooth scroll duration

    const [targetPath, targetHash] = item.href.split('#');
    const isSamePage = pathname === targetPath;

    if (isSamePage) {
        if (targetHash) {
            handleScroll(targetHash);
            window.history.pushState(null, '', `#${targetHash}`);
        } else {
            // Handle Home/Top case
            const id = getSectionId(item.href);
            if (id === 'home') {
                handleScroll('home');
                window.history.pushState(null, '', targetPath);
            } else {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
                 window.history.pushState(null, '', targetPath);
            }
        }
    } else {
        if (targetHash) {
             router.push(item.href);
        } else {
             router.push(targetPath);
        }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {items.map((item) => {
        const isActive = activeTab === item.key;
        
        return (
          <div
            key={item.key}
            style={{ position: 'relative' }}
          >
           {isActive && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '9999px',
                  backgroundColor: scrolled ? 'rgba(255, 107, 59, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                  zIndex: 0,
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <a
              href={item.href}
              onClick={(e) => onLinkClick(e, item)}
              style={{
                position: 'relative',
                display: 'block',
                padding: '8px 16px',
                color: isActive ? '#FF6B3B' : textColor,
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive ? 600 : 500,
                zIndex: 1,
                cursor: 'pointer',
                transition: 'color 0.3s ease',
              }}
            >
              {item.label}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default Navbar;
