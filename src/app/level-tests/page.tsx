'use client';

import { PageHeader } from "@/components/page-header";
import ProtectedPage from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const testTypes = ["Writing", "Reading", "Speaking", "Listening"];

export default function LevelTestsPage() {
  const router = useRouter();

  const handleButtonClick = (type: string) => {
    if (type === 'Reading') {
      router.push('/level-tests/reading');
    } else {
      router.push('/coming-soon');
    }
  };

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="레벨테스트 관리"
        description="관리할 레벨테스트 유형을 선택하세요."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                className="h-24 text-lg"
                onClick={() => handleButtonClick(type)}
                disabled={type !== 'Reading'}
              >
                {type}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
