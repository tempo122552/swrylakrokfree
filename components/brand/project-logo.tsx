import Image from "next/image";
import { projectName } from "@/lib/brand";

const sizeClassNames = {
  sm: "h-11 w-11",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

export function ProjectLogo({
  size = "sm",
  priority = false,
}: {
  size?: keyof typeof sizeClassNames;
  priority?: boolean;
}) {
  return (
    <div
      className={`${sizeClassNames[size]} overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-emerald-900/10`}
    >
      <Image
        alt={`โลโก้ ${projectName}`}
        className="h-full w-full object-cover"
        height={1080}
        priority={priority}
        src="/brand/swry-rak-lok-logo.jpg"
        width={1080}
      />
    </div>
  );
}
