"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LoadingAnimationProps {
  size?: number;
  className?: string;
}

export function LoadingAnimation({ size = 200, className = "" }: LoadingAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Simple loading animation data (fallback if no external animation)
    const defaultAnimation = {
      v: "5.7.4",
      fr: 30,
      ip: 0,
      op: 60,
      w: size,
      h: size,
      nm: "Loading",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Circle",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: {
              a: 1,
              k: [
                {
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                  t: 0,
                  s: [0],
                },
                {
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                  t: 60,
                  s: [360],
                },
              ],
            },
            p: { a: 0, k: [size / 2, size / 2, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] },
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              it: [
                {
                  d: 1,
                  ty: "el",
                  s: { a: 0, k: [size * 0.3, size * 0.3] },
                  p: { a: 0, k: [0, 0] },
                  nm: "Ellipse Path 1",
                  mn: "ADBE Vector Shape - Ellipse",
                },
                {
                  ty: "st",
                  c: { a: 0, k: [0.31, 0.49, 1, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 4 },
                  lc: 1,
                  lj: 1,
                  ml: 4,
                  bm: 0,
                  nm: "Stroke 1",
                  mn: "ADBE Vector Graphic - Stroke",
                },
                {
                  ty: "tr",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 },
                  sk: { a: 0, k: 0 },
                  sa: { a: 0, k: 0 },
                  nm: "Transform",
                },
              ],
              nm: "Ellipse 1",
              mn: "ADBE Vector Group",
            },
          ],
          ip: 0,
          op: 60,
          st: 0,
          bm: 0,
        },
      ],
    };

    setAnimationData(defaultAnimation);
  }, [size]);

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F7FFF]"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
