// ... 앞부분은 동일 ...

// POST: 새 사용자 생성
export async function POST(req: NextRequest) {
  // 빌드 중에는 req.json()을 읽으려다 에러가 날 수 있으므로 체크 추가
  if (!privateKey) {
    return NextResponse.json({ message: 'Build time skip' }, { status: 200 });
  }

  const auth = getAuth();
  const db = getDb();
  
  // 나머지 로직은 동일...
}

// GET (만약 있다면 추가):
export async function GET() {
  return NextResponse.json({ message: 'Service is running' });
}