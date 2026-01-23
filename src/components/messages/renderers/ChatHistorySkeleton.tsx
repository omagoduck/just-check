import { Skeleton } from "@/components/ui/skeleton";

export function UserMessageSkeleton() {
    return (
        <div className="flex flex-col space-y-2 mb-10 max-w-[70%] ml-auto items-end">
            <Skeleton className="h-10 rounded-lg w-[50%]" />
        </div>
    );
}

export function UserMessageSkeleton2() {
    return (
        <div className="flex flex-col space-y-2 mb-10 max-w-[70%] ml-auto items-end">
            {/* <Skeleton className="h-20 w-20 rounded-md" /> */} {/* This depicts the uploaded item.*/}
            <Skeleton className="h-18 rounded-lg w-[80%]" />
        </div>
    );
}

export function AIMessageSkeleton() {
    return (
        <div className="mb-10 space-y-2">
            <div className="space-x-2 space-y-2"> {/* This depicts thinking and corresponding icon */}
                <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 rounded-lg w-20" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 rounded-lg w-[60%]" />
                <Skeleton className="h-4 rounded-lg" />
                <Skeleton className="h-4 rounded-lg w-[70%]" />
            </div>
        </div>
    );
}

export function AIMessageSkeleton2() {
    return (
        <div className="mb-10 space-y-2">
            <div className="space-x-2 space-y-2"> {/* This depicts thinking and corresponding icon */}
                <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 rounded-lg w-20" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 rounded-lg " />
                <Skeleton className="h-4 rounded-lg w-[70%]" />
            </div>

            <Skeleton className="h-10 rounded-lg my-4" /> {/* This depicts tool call result*/}

            <div className="space-y-2">
                <Skeleton className="h-4 rounded-lg w-[60%]" />
                <Skeleton className="h-4 rounded-lg" />
                <Skeleton className="h-4 rounded-lg" />
                <Skeleton className="h-4 rounded-lg w-[80%]" />
            </div>
        </div>
    );
}

export function ChatHistorySkeleton() {
    return (
        <>
            <UserMessageSkeleton />
            <AIMessageSkeleton />
            <UserMessageSkeleton2 />
            <AIMessageSkeleton2 />
        </>
    );
}