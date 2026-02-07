export default function EditorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="h-svh w-full overflow-hidden">{children}</div>;
}
