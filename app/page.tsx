import dynamic from "next/dynamic";

const KeplerMap = dynamic(() => import("@/components/KeplerMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#fff",
      }}
    >
      Loading map...
    </div>
  ),
});

export default function Home() {
  return <KeplerMap />;
}
