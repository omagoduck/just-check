import { redirect } from "next/navigation";

// This is current functionality to redirect /chats to the main page
// To-do: In future, we will test chat hisory here
export default function ChatsPage() {
  redirect("/");
}
