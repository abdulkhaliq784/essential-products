import { Container, ProductGridSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Container className="py-8">
      <Skeleton className="mb-8 h-8 w-48" />
      <ProductGridSkeleton />
    </Container>
  );
}
