import { useEffect, useState } from "react";

interface WindowSize {
  width: number;
  height: number;
}

function getWindowSize(): WindowSize {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export default function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => getWindowSize());

  useEffect(() => {
    const handleResize = () => {
      setSize(getWindowSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
