'use client';

import * as React from 'react';
import ProtectedPage from '@/components/protected-page';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

export default function NewProblemPage() {
  const [problemType, setProblemType] = React.useState('multiple-choice');
  const [subjectiveType, setSubjectiveType] = React.useState('short-answer');
  const [mcqOptionCount, setMcqOptionCount] = React.useState(2);

  return (
    <ProtectedPage allowedRoles={['admin', 'teacher']}>
      <PageHeader
        title="새 문제 추가"
        description="새로운 퀴즈 문제를 생성합니다."
      />
      <Card>
        <CardContent className="pt-6">
          <form className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="problem-number">번호</Label>
              <Input
                id="problem-number"
                type="number"
                placeholder="문제 번호를 입력하세요"
                className="w-48"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question1">문제 1 (필수)</Label>
              <Textarea
                id="question1"
                placeholder="학생에게 제시될 주된 질문을 입력하세요."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question2">문제 2 (선택)</Label>
              <Textarea
                id="question2"
                placeholder="필요한 경우, 추가 안내문이나 보조 질문을 입력하세요."
              />
            </div>

            <div className="space-y-2">
              <Label>문제 유형</Label>
              <RadioGroup
                value={problemType}
                onValueChange={setProblemType}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple-choice" id="r-mcq" />
                  <Label htmlFor="r-mcq">객관식</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subjective" id="r-subj" />
                  <Label htmlFor="r-subj">주관식</Label>
                </div>
              </RadioGroup>
            </div>

            {problemType === 'multiple-choice' && (
              <Card className="bg-muted/50 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>보기 개수</Label>
                    <Select
                      value={String(mcqOptionCount)}
                      onValueChange={(val) => setMcqOptionCount(Number(val))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2개</SelectItem>
                        <SelectItem value="3">3개</SelectItem>
                        <SelectItem value="4">4개</SelectItem>
                        <SelectItem value="5">5개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>보기 입력</Label>
                    {Array.from({ length: mcqOptionCount }).map((_, i) => (
                      <Input
                        key={i}
                        placeholder={`보기 ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {problemType === 'subjective' && (
              <Card className="bg-muted/50 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>주관식 유형</Label>
                    <RadioGroup
                      value={subjectiveType}
                      onValueChange={setSubjectiveType}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="short-answer"
                          id="r-short"
                        />
                        <Label htmlFor="r-short">단답형</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="descriptive"
                          id="r-desc"
                        />
                        <Label htmlFor="r-desc">서술형</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {subjectiveType === 'short-answer' && (
                    <div className="space-y-2">
                      <Label htmlFor="short-answer">정답</Label>
                      <Input
                        id="short-answer"
                        placeholder="단답형 정답을 입력하세요."
                      />
                    </div>
                  )}

                  {subjectiveType === 'descriptive' && (
                     <div className="space-y-2">
                        <Label>채점 방식</Label>
                        <RadioGroup defaultValue="ai" className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ai" id="r-ai"/>
                                <Label htmlFor="r-ai">AI 자동 채점</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="teacher" id="r-teacher"/>
                                <Label htmlFor="r-teacher">교사 직접 채점</Label>
                            </div>
                        </RadioGroup>
                        <p className="text-sm text-muted-foreground">서술형 문제는 AI 또는 교사가 직접 채점합니다.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
             <div className="flex justify-end">
                <Button type="submit">
                    저장
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
