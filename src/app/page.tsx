import Explore from "@/components/Explore";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      <Explore />
    </div>
  );
}
