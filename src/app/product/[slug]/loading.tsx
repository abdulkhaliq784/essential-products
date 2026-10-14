import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-6 sm:py-10">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="mt-6 h-11 w-full sm:w-64" />
          <Skeleton className="mt-8 h-32 w-full" />
        </div>
      </div>
    </Container>
  );
}
