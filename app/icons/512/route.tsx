import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A3A2E",
        }}
      >
        <span
          style={{
            color: "#FBFAF7",
            fontSize: 286,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
            letterSpacing: "-8px",
            marginTop: 16,
          }}
        >
          G
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
