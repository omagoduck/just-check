// src/app/(main)/chats/[chat-id]/page.tsx

export default function ChatPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <p>Hello Chat Page</p>
    </>
  );
}
