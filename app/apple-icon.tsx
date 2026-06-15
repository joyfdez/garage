import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            fontSize: 100,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
            letterSpacing: "-3px",
            marginTop: 6,
          }}
        >
          G
        </span>
      </div>
    ),
    size
  );
}
