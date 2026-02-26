"use client";

// Graph Paper Background with blue grid lines and paper grain texture
export function GraphPaper() {
    return (
        <div className="fixed inset-0 -z-10 bg-[#fdfbf7]">
            {/* Blue Grid Lines */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />
            {/* Paper Grain */}
            <div className="absolute inset-0 opacity-30" style={{ filter: "url(#pencil-texture)" }} />
        </div>
    );
}
