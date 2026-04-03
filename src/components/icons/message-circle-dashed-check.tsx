// components/icons/message-circle-dashed-check.tsx
import { Icon, type IconNode, type LucideProps } from "lucide-react";

const messageCircleDashedCheckIconNode: IconNode = [
  ["path", { d: "M10.1 2.182a10 10 0 0 1 3.8 0", key: "1" }],
  ["path", { d: "M13.9 21.818a10 10 0 0 1-3.8 0", key: "2" }],
  ["path", { d: "M17.609 3.72a10 10 0 0 1 2.69 2.7", key: "3" }],
  ["path", { d: "M2.182 13.9a10 10 0 0 1 0-3.8", key: "4" }],
  ["path", { d: "M20.28 17.61a10 10 0 0 1-2.7 2.69", key: "5" }],
  ["path", { d: "M21.818 10.1a10 10 0 0 1 0 3.8", key: "6" }],
  ["path", { d: "M3.721 6.391a10 10 0 0 1 2.7-2.69", key: "7" }],
  ["path", { d: "m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98", key: "8" }],
  ["path", { d: "m9 12 2 2 4-4", key: "9" }],
];

export function MessageCircleDashedCheck(props: LucideProps) {
  return <Icon iconNode={messageCircleDashedCheckIconNode} {...props} />;
}