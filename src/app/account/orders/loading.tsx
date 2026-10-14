import { Container, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-8 h-8 w-40" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </Container>
  );
}
