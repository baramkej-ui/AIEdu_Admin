'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// --- Firebase Admin SDK 초기화 ---
// 서비스 계정 키를 환경 변수에서 가져옵니다. base64 인코딩된 JSON 문자열입니다.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let privateKey: string | undefined;

if (serviceAccountKey) {
  try {
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    const serviceAccountJson = JSON.parse(decodedKey);
    privateKey = serviceAccountJson.private_key;
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  }
}

// 앱이 이미 초기화되었는지 확인하여 중복 초기화를 방지합니다.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const auth = admin.auth();
const db = admin.firestore();

// --- API 핸들러 ---

// POST: 새 사용자 생성
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role });

    const newUser = {
      id: userRecord.uid,
      name,
      email,
      role,
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/40/40`,
    };

    await db.collection('users').doc(userRecord.uid).set(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email is already in use.';
    }
    return NextResponse.json({ message: 'Failed to create user', error: errorMessage }, { status: 500 });
  }
}

// PUT: 사용자 정보 및 비밀번호 수정
export async function PUT(req: NextRequest) {
  try {
    const { id, email, name, role, password } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ message: 'User ID and email are required' }, { status: 400 });
    }

    const updatePayload: { email?: string; displayName?: string; password?: string } = {};
    if (email) updatePayload.email = email;
    if (name) updatePayload.displayName = name;
    if (password) updatePayload.password = password;

    const updatedUserRecord = await auth.updateUser(id, updatePayload);

    if (role) {
        await auth.setCustomUserClaims(id, { role });
    }

    const userDocRef = db.collection('users').doc(id);
    const firestoreUpdatePayload: { name?: string; email?: string; role?: string } = {};
    if (name) firestoreUpdatePayload.name = name;
    if (email) firestoreUpdatePayload.email = email;
    if (role) firestoreUpdatePayload.role = role;
    
    await userDocRef.update(firestoreUpdatePayload);

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  }
}

// DELETE: 사용자 삭제
export async function DELETE(req: NextRequest) {
    try {
        const { id, email } = await req.json();

        if (!id && !email) {
            return NextResponse.json({ message: 'User ID or email is required' }, { status: 400 });
        }

        let uidToDelete = id;

        // Firestore ID만 있고 Auth UID를 모르는 경우 이메일로 조회
        if (!uidToDelete && email) {
            try {
                const userRecord = await auth.getUserByEmail(email);
                uidToDelete = userRecord.uid;
            } catch (error: any) {
                // Auth에 사용자가 없으면 Firestore만 삭제 시도
                if (error.code === 'auth/user-not-found') {
                    console.log(`User with email ${email} not found in Auth. Proceeding to delete from Firestore.`);
                } else {
                    throw error; // 다른 Auth 오류는 다시 던짐
                }
            }
        }
        
        // 1. Auth에서 사용자 삭제 (UID가 있는 경우)
        if (uidToDelete) {
            try {
                await auth.deleteUser(uidToDelete);
                console.log(`Successfully deleted user from Auth: ${uidToDelete}`);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    console.log(`User with UID ${uidToDelete} not found in Auth (already deleted).`);
                } else {
                    throw error;
                }
            }
        }

        // 2. Firestore에서 사용자 삭제 (ID가 있는 경우)
        // 클라이언트에서 보낸 id는 Firestore의 document id이므로 이것을 사용
        if (id) {
            const userDocRef = db.collection('users').doc(id);
            const doc = await userDocRef.get();
            if (doc.exists) {
                await userDocRef.delete();
                console.log(`Successfully deleted user from Firestore: ${id}`);
            } else {
                console.log(`User document not found in Firestore: ${id}`);
            }
        }

        return NextResponse.json({ message: 'User deletion process completed' }, { status: 200 });

    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
    }
}
