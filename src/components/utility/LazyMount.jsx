import React, { useEffect, useRef, useState } from 'react';

// Renders children only when it becomes visible (IntersectionObserver)
export default function LazyMount({ rootMargin = '200px', children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return; // already mounted
    const node = ref.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      });
    }, { rootMargin });
    io.observe(node);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref}>
      {visible ? children : null}
    </div>
  );
}
