"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface SuccessAnimationProps {
  size?: number;
  className?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ size = 150, className = "", onComplete }: SuccessAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Simple success checkmark animation
    const successAnimation = {
      v: "5.7.4",
      fr: 30,
      ip: 0,
      op: 60,
      w: size,
      h: size,
      nm: "Success",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Checkmark",
          sr: 1,
          ks: {
            o: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 30, s: [100] }] },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [size / 2, size / 2, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: {
              a: 1,
              k: [
                { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 0, s: [0, 0, 100] },
                { t: 30, s: [100, 100, 100] },
              ],
            },
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              it: [
                {
                  ind: 0,
                  ty: "sh",
                  ix: 1,
                  ks: {
                    a: 0,
                    k: {
                      i: [
                        [0, 0],
                        [0, 0],
                      ],
                      o: [
                        [0, 0],
                        [0, 0],
                      ],
                      v: [
                        [-size * 0.15, 0],
                        [0, size * 0.15],
                        [size * 0.3, -size * 0.15],
                      ],
                      c: true,
                    },
                  },
                  nm: "Path 1",
                  mn: "ADBE Vector Shape - Group",
                },
                {
                  ty: "st",
                  c: { a: 0, k: [0.19, 0.78, 0.44, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 6 },
                  lc: 2,
                  lj: 2,
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
              nm: "Shape 1",
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

    setAnimationData(successAnimation);

    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [size, onComplete]);

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
