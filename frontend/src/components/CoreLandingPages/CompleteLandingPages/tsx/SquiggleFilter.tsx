"use client";

// The Magic SVG Filters — squiggly hand-drawn effect + pencil texture
export function SquiggleFilter() {
    return (
        <svg className="hidden">
            <defs>
                <filter id="squiggle">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="5" result="noise" seed="0" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
                </filter>
                <filter id="pencil-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </defs>
        </svg>
    );
}
